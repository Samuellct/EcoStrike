// src/state/matchReducer.ts

import {
    MatchState,
    MatchMode,
    MatchPhase,
    Team,
    Player,
    PlayerRoundState,
    RoundResult,
    PurchaseInput,
} from '../types'; // Importez les types mis à jour
import {
    ECONOMIC_CONSTANTS,
    getBuyableItemsForTeam,
    getItemById,
    GameItem,
} from '../data/cs2Equipment';
import {
    calculateBaseRoundReward,
    calculateIndividualMoneyGain,
    calculateIndividualKillReward, // Utile pour la prévisualisation
    calculateMinimumGuaranteed,
    calculateBuyValue,
    getNextLossStreak,
} from '../utils/economicCalculations';

// --- ACTIONS D'ÉTAT ---

export type MatchAction =
    | { type: 'SET_INITIAL_CONFIG'; payload: { mode: MatchMode; players: Player[] } }
    | { type: 'START_MATCH' }
    | { type: 'SET_PHASE'; payload: MatchPhase }
    
    // Actions de jeu
    | { type: 'BUY_EQUIPMENT'; payload: PurchaseInput }
    | { type: 'UPDATE_KILL_ENTRY'; payload: { playerId: string; kills: KillEntry[] } }
    | { type: 'UPDATE_PLAYER_SURVIVAL'; payload: { playerId: string; isAlive: boolean } }
    
    // Transition de Manche
    | { type: 'APPLY_ROUND_RESULT'; payload: RoundResult }
    | { type: 'ADVANCE_TO_NEXT_ROUND' }
    
    // Fin de match et Prolongation
    | { type: 'INITIATE_OVERTIME' }
    | { type: 'END_MATCH' }


// --- ÉTAT INITIAL ---

const initialPlayerRoundState = (player: Player): PlayerRoundState => {
    // Initialisation simple avec le pistolet de départ
    const startingPistolItem = getItemById(player.defaultPistol.toLowerCase()) as GameItem;
    
    return {
        playerId: player.id,
        money: ECONOMIC_CONSTANTS.STARTING_MONEY,
        inventory: [startingPistolItem],
        isAlive: true,
        kills: [],
        minimumGuaranteedNextRound: 0,
    };
};

export const initialMatchState: MatchState = {
    matchMode: 'Standard',
    currentRound: 0, // 0 signifie phase de config
    phase: 'Config',
    CT: { score: 0, lossStreak: 0 },
    T: { score: 0, lossStreak: 0 },
    players: [],
    playerRoundStates: {},
    roundHistory: [],
};


// --- REDUCER PRINCIPAL ---

export const matchReducer = (state: MatchState, action: MatchAction): MatchState => {
    switch (action.type) {
        
        /** ----------------- 1. CONFIGURATION ET DÉMARRAGE ----------------- */
        
        case 'SET_INITIAL_CONFIG': {
            // Création des 10 joueurs et de leur état de manche initial
            const { mode, players } = action.payload;
            const playerRoundStates = players.reduce((acc, player) => {
                acc[player.id] = initialPlayerRoundState(player);
                return acc;
            }, {} as Record<string, PlayerRoundState>);
            
            return {
                ...state,
                matchMode: mode,
                players,
                playerRoundStates,
            };
        }
        
        case 'START_MATCH':
            return {
                ...state,
                currentRound: 1,
                phase: 'FreezeTime',
            };
            
        case 'SET_PHASE':
            return {
                ...state,
                phase: action.payload,
            };

        /** ----------------- 2. PHASE D'ACHAT ET ÉVÉNEMENTS ----------------- */
        
        case 'BUY_EQUIPMENT': {
            const { playerId, itemBoughtId, recipientId } = action.payload;
            const item = getItemById(itemBoughtId);
            
            if (!item) return state;

            // L'acheteur paie, le receveur reçoit l'objet
            const buyerId = playerId;
            const receiverId = recipientId || playerId;
            
            // Mise à jour de l'état de l'acheteur
            const newBuyerState = { ...state.playerRoundStates[buyerId] };
            
            if (newBuyerState.money >= item.price) {
                newBuyerState.money -= item.price;
            } else {
                console.error(`Achat impossible : ${buyerId} n'a pas assez d'argent.`);
                return state;
            }

            // Mise à jour de l'état du receveur
            const newReceiverState = { ...state.playerRoundStates[receiverId] };
            newReceiverState.inventory = [...newReceiverState.inventory, item];
            
            // Appliquer les changements et recalculer le minimum garanti
            const updatedPlayerRoundStates = { ...state.playerRoundStates };
            updatedPlayerRoundStates[buyerId] = newBuyerState;
            updatedPlayerRoundStates[receiverId] = newReceiverState;

            // Mise à jour des prévisions Minimum Garanti après l'achat
            Object.values(updatedPlayerRoundStates).forEach(playerState => {
                const team = state.players.find(p => p.id === playerState.playerId)?.team || 'CT';
                const teamStreak = team === 'CT' ? state.CT.lossStreak : state.T.lossStreak;
                playerState.minimumGuaranteedNextRound = calculateMinimumGuaranteed(playerState.money, teamStreak);
            });
            
            return {
                ...state,
                playerRoundStates: updatedPlayerRoundStates,
            };
        }

        case 'UPDATE_KILL_ENTRY': {
            // Utilisé pendant la phase RoundEndSummary
            const { playerId, kills } = action.payload;
            const updatedState = { ...state.playerRoundStates[playerId], kills };
            return {
                ...state,
                playerRoundStates: {
                    ...state.playerRoundStates,
                    [playerId]: updatedState,
                },
            };
        }
        
        case 'UPDATE_PLAYER_SURVIVAL': {
            // Utilisé pendant la phase RoundEndSummary
            const { playerId, isAlive } = action.payload;
            const updatedState = { ...state.playerRoundStates[playerId], isAlive };
            return {
                ...state,
                playerRoundStates: {
                    ...state.playerRoundStates,
                    [playerId]: updatedState,
                },
            };
        }

        /** ----------------- 3. FIN DE MANCHE ET TRANSITION ----------------- */
        
        case 'APPLY_ROUND_RESULT': {
            const result = action.payload;
            const newState = { ...state };
            let newCT = { ...state.CT };
            let newT = { ...state.T };
            
            // 1. Mise à jour du Score et du Loss Streak
            const didCTWin = result.winner === 'CT';
            
            if (didCTWin) {
                newCT.score++;
                newCT.lossStreak = 0;
                newT.lossStreak = getNextLossStreak(state.T.lossStreak, false, true, result);
            } else {
                newT.score++;
                newT.lossStreak = 0;
                newCT.lossStreak = getNextLossStreak(state.CT.lossStreak, false, false, result);
            }
            
            // 2. Calcul des Gains (Avant mise à jour du Loss Streak)
            const ctBaseReward = calculateBaseRoundReward(result, 'CT', state.CT.lossStreak);
            const tBaseReward = calculateBaseRoundReward(result, 'T', state.T.lossStreak);
            
            // Compte le nombre total de kills CT pour le bonus de $50
            const allKills: KillEntry[] = Object.values(state.playerRoundStates).flatMap(p => p.kills);
            const totalCtKills = allKills
                .filter(k => state.players.find(p => p.id === p.playerId)?.team === 'CT') // Vérifier que l'auteur est CT (nécessite d'inclure l'auteur des kills dans l'état de manche)
                .reduce((sum, entry) => sum + entry.count, 0);

            // 3. Mise à jour de l'argent de chaque joueur
            const updatedPlayerRoundStates: Record<string, PlayerRoundState> = {};
            
            state.players.forEach(player => {
                const playerState = state.playerRoundStates[player.id];
                const team = player.team;
                const baseReward = team === 'CT' ? ctBaseReward : tBaseReward;

                // Identification du planteur/défuseur (simplification de la saisie)
                // Pour une implémentation complète, ceci viendrait du RoundEndSummary,
                // mais ici on suppose que la saisie le capture.
                const playerPlanted = (team === 'T' && result.bombPlanted && result.winner === 'T' && playerState.isAlive); // Simplifié
                const playerDefused = (team === 'CT' && result.bombDefused && playerState.isAlive); // Simplifié

                const gain = calculateIndividualMoneyGain(
                    playerState,
                    result,
                    baseReward,
                    totalCtKills,
                    playerPlanted,
                    playerDefused
                );

                // Argent total pour la manche suivante
                let newMoney = playerState.money + gain;

                // Gestion de l'équipement conservé
                let newInventory: GameItem[] = [];
                if (playerState.isAlive) {
                    newInventory = playerState.inventory; // Le joueur conserve son inventaire
                } else {
                    // S'il est mort, l'inventaire est réinitialisé à son pistolet de départ
                    const startingPistolItem = getItemById(player.defaultPistol.toLowerCase()) as GameItem;
                    newInventory = [startingPistolItem];
                }

                // Réinitialisation des Kills et Survie pour la manche suivante
                updatedPlayerRoundStates[player.id] = {
                    ...playerState,
                    money: newMoney,
                    inventory: newInventory,
                    kills: [],
                    isAlive: true, // Réinitialisé pour la manche suivante
                    minimumGuaranteedNextRound: calculateMinimumGuaranteed(newMoney, team === 'CT' ? newCT.lossStreak : newT.lossStreak)
                };
            });
            
            // 4. Vérification de la Mi-temps
            if (state.currentRound === 12) {
                return {
                    ...state,
                    currentRound: 13,
                    phase: 'HalfTime',
                    CT: { score: newCT.score, lossStreak: 0 }, // Reset du streak à 0 après mi-temps
                    T: { score: newT.score, lossStreak: 0 },
                    roundHistory: [...state.roundHistory, result],
                    playerRoundStates: Object.values(updatedPlayerRoundStates).reduce((acc, playerState) => {
                        // Reset de l'argent de tous les joueurs à $800 pour la manche 13
                        acc[playerState.playerId] = {
                            ...playerState,
                            money: ECONOMIC_CONSTANTS.STARTING_MONEY,
                            minimumGuaranteedNextRound: calculateMinimumGuaranteed(ECONOMIC_CONSTANTS.STARTING_MONEY, 0),
                        };
                        return acc;
                    }, {} as Record<string, PlayerRoundState>),
                };
            }

            // 5. Mise à jour normale
            return {
                ...state,
                CT: newCT,
                T: newT,
                playerRoundStates: updatedPlayerRoundStates,
                roundHistory: [...state.roundHistory, result],
            };
        }
        
        case 'ADVANCE_TO_NEXT_ROUND': {
            // Passe à la manche suivante après l'application des résultats ou après la mi-temps
            let nextRound = state.currentRound + 1;
            
            // Vérification de la Fin de Match (simplifiée : la vérification réelle est après APPLY_ROUND_RESULT)
            // Ici, nous gérons juste l'incrémentation.
            
            return {
                ...state,
                currentRound: nextRound,
                phase: 'FreezeTime',
            };
        }

        /** ----------------- 4. PROLONGATION (Mode Premier) ----------------- */
        
        case 'INITIATE_OVERTIME': {
            // Seulement si le score est 12-12 en mode Premier
            const updatedPlayerRoundStates = Object.values(state.playerRoundStates).reduce((acc, playerState) => {
                // Reset de l'argent et de l'inventaire à $16,000 + pistolet de départ
                const player = state.players.find(p => p.id === playerState.playerId) as Player;
                const startingPistolItem = getItemById(player.defaultPistol.toLowerCase()) as GameItem;
                
                acc[playerState.playerId] = {
                    ...playerState,
                    money: ECONOMIC_CONSTANTS.STARTING_MONEY_OVERTIME,
                    inventory: [startingPistolItem],
                    isAlive: true,
                    kills: [],
                    minimumGuaranteedNextRound: calculateMinimumGuaranteed(ECONOMIC_CONSTANTS.STARTING_MONEY_OVERTIME, 0),
                };
                return acc;
            }, {} as Record<string, PlayerRoundState>);
            
            return {
                ...state,
                currentRound: 25, // Début de la prolongation
                phase: 'OvertimeStart', // Nouvelle phase d'achat/d'équipement
                CT: { score: state.CT.score, lossStreak: 0 },
                T: { score: state.T.score, lossStreak: 0 },
                playerRoundStates: updatedPlayerRoundStates,
            };
        }
        
        case 'END_MATCH':
            // Logique finale (enregistrement des données, affichage du résultat)
            return { ...state, phase: 'Config' }; // Retour à l'écran initial (ou un écran de résultat)

        default:
            return state;
    }
};