// src/state/matchReducer.ts (CORRIGÉ ET COMPLET)

import {
    MatchState,
    MatchMode,
    MatchPhase,
    Player,
    PlayerRoundState,
    RoundResult,
    PurchaseInput,
    KillEntry,
    GameItem,
    GameItemType,
} from '../types/index'; 
import {
    ECONOMIC_CONSTANTS,
    getItemById,
    ARMOR_ITEM_IDS, // Nécessaire pour les vérifications d'achat
    GRENADES_IDS, // Nécessaire pour les vérifications d'achat
} from '../data/cs2Equipment';
import {
    calculateBaseRoundReward,
    calculateIndividualMoneyGain,
    calculateMinimumGuaranteed,
    calculateBuyValue, 
    getNextLossStreak,
} from '../utils/economicCalculations';

// --- ACTIONS D'ÉTAT ---

export type MatchAction =
    | { type: 'SET_INITIAL_CONFIG'; payload: { mode: MatchMode; players: Player[] } }
    | { type: 'START_MATCH' }
    | { type: 'SET_PHASE'; payload: MatchPhase }
    | { type: 'BUY_EQUIPMENT'; payload: PurchaseInput }
    | { type: 'UPDATE_KILL_ENTRY'; payload: { playerId: string; kills: KillEntry[] } }
    | { type: 'UPDATE_PLAYER_SURVIVAL'; payload: { playerId: string; isAlive: boolean } }
    | { type: 'APPLY_ROUND_RESULT'; payload: RoundResult }
    | { type: 'ADVANCE_TO_NEXT_ROUND' }
    | { type: 'INITIATE_OVERTIME' }
    | { type: 'END_MATCH' };

// --- ÉTAT INITIAL ---

const basePlayers: Player[] = [
    // Exemple de structure, vide par défaut
    { id: 'CT-1', name: 'CT-1', team: 'CT', position: 1, defaultPistol: 'USP-S' },
];

const getInitialPlayerRoundStates = (players: Player[], money: number): Record<string, PlayerRoundState> => {
    return players.reduce((acc, player) => {
        const startingPistol = player.team === 'T' ? 'glock' : player.defaultPistol.toLowerCase();
        const startingPistolItem = getItemById(startingPistol) as GameItem; // On suppose qu'il existe
        
        // Calculer le Buy Value initial
        const buyValue = calculateBuyValue([startingPistolItem]);

        acc[player.id] = {
            playerId: player.id,
            money: money,
            inventory: [startingPistolItem],
            isAlive: true,
            kills: [],
            buyValue: buyValue,
            minimumGuaranteedNextRound: calculateMinimumGuaranteed(money, 0), // Loss Streak 0
        };
        return acc;
    }, {} as Record<string, PlayerRoundState>);
};


export const initialMatchState: MatchState = {
    matchMode: 'Standard',
    currentRound: 0, // 0 = Phase Config
    phase: 'Config',
    teamState: {
        CT: { score: 0, lossStreak: 0 },
        T: { score: 0, lossStreak: 0 },
    },
    players: basePlayers,
    playerRoundStates: getInitialPlayerRoundStates(basePlayers, ECONOMIC_CONSTANTS.STARTING_MONEY),
    roundHistory: [],
};

// --- REDUCER ---

// Fonction utilitaire pour le Reducer
const hasItemOfType = (inventory: GameItem[], type: GameItemType, excludeId?: string) => {
    return inventory.some(item => item.type === type && (!excludeId || item.id !== excludeId));
};

export const matchReducer = (state: MatchState, action: MatchAction): MatchState => {
    switch (action.type) {
        
        case 'SET_INITIAL_CONFIG': {
            const { mode, players } = action.payload;
            const initialMoney = ECONOMIC_CONSTANTS.STARTING_MONEY;

            // Préparer l'état des joueurs
            const initialPlayerStates = getInitialPlayerRoundStates(players, initialMoney);

            return {
                ...state,
                matchMode: mode,
                players: players,
                playerRoundStates: initialPlayerStates,
                roundHistory: [],
                teamState: { CT: { score: 0, lossStreak: 0 }, T: { score: 0, lossStreak: 0 } },
                currentRound: 0, // Rester à 0
            };
        }

        case 'START_MATCH': {
            // Passe de Config à la première manche
            return {
                ...state,
                currentRound: 1,
                phase: 'FreezeTime', // Commence directement la phase d'achat de la manche 1
            };
        }

        case 'SET_PHASE':
            return {
                ...state,
                phase: action.payload,
            };

        case 'BUY_EQUIPMENT': {
            const { playerId, itemBoughtId, recipientId } = action.payload;
            const buyerState = state.playerRoundStates[playerId];
            const recipientState = state.playerRoundStates[recipientId]; // Peut être le même si c'est un achat personnel
            const item = getItemById(itemBoughtId);

            if (!buyerState || !recipientState || !item || recipientState.playerId !== recipientId) {
                console.error('Invalid purchase attempt: Player or item not found.');
                return state;
            }

            // CORRECTION: Vérifications d'achat importantes
            if (buyerState.money < item.price) {
                console.warn(`${state.players.find(p => p.id === playerId)?.name} cannot afford ${item.name}`);
                return state;
            }

            const newRecipientInventory = [...recipientState.inventory];
            let itemRemoved: GameItem | undefined;

            // Logique de remplacement et de limite (Achats pour soi-même)
            if (playerId === recipientId) {
                // 1. Limite d'armes principales (Pistolet, Fusil, SMG, etc.)
                if (item.type !== 'Armor' && item.type !== 'Grenade' && item.type !== 'Utility') {
                    // Supprimer l'arme de même type si elle existe (sauf si c'est un pistolet de départ)
                    const existingWeaponIndex = newRecipientInventory.findIndex(i => 
                        i.type === item.type && 
                        i.id !== recipientState.players[0].defaultPistol.toLowerCase() // Ne pas enlever le pistolet par défaut si c'est le seul
                    );
                    if (existingWeaponIndex !== -1) {
                        itemRemoved = newRecipientInventory.splice(existingWeaponIndex, 1)[0];
                    }
                }

                // 2. Limite d'Armure (remplacement si on achète un casque, ou si on achète tout sans rien)
                if (item.type === 'Armor') {
                    // Retirer toute armure existante si la nouvelle est un meilleur type (vesthelm)
                    const existingArmorIndex = newRecipientInventory.findIndex(i => ARMOR_ITEM_IDS.includes(i.id));
                    if (existingArmorIndex !== -1) {
                        itemRemoved = newRecipientInventory.splice(existingArmorIndex, 1)[0];
                    }
                }

                // 3. Limite de Grenades (max 4, une de chaque type sauf Flash)
                if (item.type === 'Grenade') {
                    const currentGrenades = newRecipientInventory.filter(i => GRENADES_IDS.includes(i.id));
                    
                    if (currentGrenades.length >= 4) {
                        console.warn(`Cannot buy ${item.name}: Grenade limit reached.`);
                        return state;
                    }

                    // Limite par type (sauf Flashbang)
                    const isFlash = item.id === 'flashbang';
                    const maxCount = isFlash ? 2 : 1; 
                    const currentCount = currentGrenades.filter(g => g.id === item.id).length;

                    if (currentCount >= maxCount) {
                        console.warn(`Cannot buy ${item.name}: Limit for this grenade type reached.`);
                        return state;
                    }
                }
            }
            // FIN des vérifications de logique d'achat pour soi-même

            // Ajout de l'item à l'inventaire du destinataire (s'il n'a pas été retiré ou si c'est un give)
            if (item.type !== 'Utility' || !newRecipientInventory.some(i => i.id === item.id)) {
                 newRecipientInventory.push(item);
            }

            // Mise à jour de l'état du Destinataire
            const updatedRecipientState: PlayerRoundState = {
                ...recipientState,
                inventory: newRecipientInventory,
                buyValue: calculateBuyValue(newRecipientInventory),
                // L'argent n'est pas mis à jour ici pour le recipient (seulement pour l'acheteur)
            };

            // Mise à jour de l'état de l'Acheteur
            const updatedBuyerState: PlayerRoundState = {
                ...buyerState,
                money: Math.max(0, buyerState.money - item.price),
                // Recalculer le minimum garanti
                minimumGuaranteedNextRound: calculateMinimumGuaranteed(
                    Math.max(0, buyerState.money - item.price),
                    state.teamState[state.players.find(p => p.id === playerId)!.team].lossStreak
                ),
            };

            return {
                ...state,
                playerRoundStates: {
                    ...state.playerRoundStates,
                    [recipientId]: updatedRecipientState,
                    [playerId]: updatedBuyerState, // L'acheteur (même si c'est le même joueur)
                },
            };
        }

        case 'UPDATE_KILL_ENTRY': {
            const { playerId, kills } = action.payload;
            return {
                ...state,
                playerRoundStates: {
                    ...state.playerRoundStates,
                    [playerId]: {
                        ...state.playerRoundStates[playerId],
                        kills: kills,
                    },
                },
            };
        }
        
        case 'UPDATE_PLAYER_SURVIVAL': {
            const { playerId, isAlive } = action.payload;
            return {
                ...state,
                playerRoundStates: {
                    ...state.playerRoundStates,
                    [playerId]: {
                        ...state.playerRoundStates[playerId],
                        isAlive: isAlive,
                    },
                },
            };
        }

        case 'APPLY_ROUND_RESULT': {
            const result = action.payload;
            const winningTeam = result.winner;
            const losingTeam = winningTeam === 'CT' ? 'T' : 'CT';

            // 1. Mise à jour des scores et loss streaks
            const newTeamState = {
                ...state.teamState,
                [winningTeam]: {
                    score: state.teamState[winningTeam].score + 1,
                    lossStreak: getNextLossStreak(state.teamState[winningTeam].lossStreak, true), // Vainqueur -> 0
                },
                [losingTeam]: {
                    score: state.teamState[losingTeam].score, // Score perdant inchangé
                    lossStreak: getNextLossStreak(state.teamState[losingTeam].lossStreak, false), // Perdant -> +1
                },
            };

            // 2. Calcul du gain de base (avant les gains individuels)
            const baseRewardWinner = calculateBaseRoundReward(result, winningTeam, state.teamState[winningTeam].lossStreak);
            const baseRewardLoser = calculateBaseRoundReward(result, losingTeam, state.teamState[losingTeam].lossStreak);

            // 3. Application des gains et réinitialisation de l'état pour la prochaine manche
            const updatedPlayerRoundStates: Record<string, PlayerRoundState> = {};
            const allPlayers = state.players;

            for (const player of allPlayers) {
                const playerState = state.playerRoundStates[player.id];
                const team = player.team;
                const isWinner = team === winningTeam;
                const baseReward = isWinner ? baseRewardWinner : baseRewardLoser;

                // Trouver si le joueur a planté/désamorcé (nécessite d'étendre RoundResult si on voulait le faire proprement)
                // Pour l'instant, on suppose que si la bombe a été plantée/désamorcée, au moins un joueur l'a fait.
                // Logique simplifiée pour la démo: on suppose que si la bombe a explosé/defusé, l'équipe T/CT entière a un bonus.
                // L'argent est cependant calculé individuellement (via le payload de RoundTransition, qui est manquant ici)
                // Le bonus de plant individuel T est géré dans economicCalculations, basé sur les kills (qui n'incluent pas le plant/defuse).
                // On va simplifier en injectant des booléens de plant/defuse dans le calcul :
                const playerPlanted = team === 'T' && result.bombPlanted && isWinner; // Si T gagne
                const playerDefused = team === 'CT' && result.bombDefused && isWinner; // Si CT gagne

                const totalGain = calculateIndividualMoneyGain(
                    playerState,
                    result,
                    team,
                    baseReward,
                    result.remainingCtAlive, // Utilisé comme un proxy, peut être affiné
                    playerPlanted,
                    playerDefused
                );
                
                // Argent total (limité par MAX_MONEY)
                const newMoney = Math.min(playerState.money + totalGain, ECONOMIC_CONSTANTS.MAX_MONEY);

                // Inventaire de la manche précédente est conservé

                // Recalculer le minimum garanti pour la manche suivante
                const minGuaranteedNextRound = calculateMinimumGuaranteed(
                    newMoney, 
                    newTeamState[team].lossStreak // Utilisez le NOUVEAU loss streak pour la manche suivante
                );

                updatedPlayerRoundStates[player.id] = {
                    ...playerState,
                    money: newMoney,
                    isAlive: true, // Réinitialisé pour la prochaine manche
                    kills: [], // Réinitialisation des kills
                    // L'inventaire (buyValue) reste celui de la manche précédente
                    minimumGuaranteedNextRound: minGuaranteedNextRound,
                };
            }

            return {
                ...state,
                teamState: newTeamState,
                playerRoundStates: updatedPlayerRoundStates,
                roundHistory: [...state.roundHistory, result],
                phase: 'RoundEndSummary', // Reste dans la phase de saisie tant que l'utilisateur n'a pas cliqué sur 'Suivant'
            };
        }

        case 'ADVANCE_TO_NEXT_ROUND': {
            // Logique pour passer à la prochaine manche (après RoundEndSummary)
            const nextRound = state.currentRound + 1;
            const newPhase = nextRound > 24 && state.matchMode === 'Standard' ? 'Finished' : 'FreezeTime';

            // Réinitialisation de l'état 'Alive' et 'Kills'
            const resetPlayerStates = Object.values(state.playerRoundStates).reduce((acc, playerState) => {
                acc[playerState.playerId] = {
                    ...playerState,
                    isAlive: true,
                    kills: [],
                    // Money et Inventory restent les mêmes que ceux calculés dans APPLY_ROUND_RESULT
                };
                return acc;
            }, {} as Record<string, PlayerRoundState>);
            
            return {
                ...state,
                currentRound: nextRound,
                phase: newPhase,
                playerRoundStates: resetPlayerStates,
            };
        }

        case 'INITIATE_OVERTIME': {
            // Initialisation des scores/streaks et de l'argent d'Overtime
            const initialMoneyOvertime = ECONOMIC_CONSTANTS.STARTING_MONEY_OVERTIME;

            const updatedPlayerRoundStates = Object.values(state.playerRoundStates).reduce((acc, playerState) => {
                const player = state.players.find(p => p.id === playerState.playerId) as Player;
                const startingPistolItem = getItemById(player.defaultPistol.toLowerCase()) as GameItem;
                
                acc[playerState.playerId] = {
                    ...playerState,
                    money: initialMoneyOvertime,
                    inventory: [startingPistolItem],
                    buyValue: calculateBuyValue([startingPistolItem]),
                    isAlive: true,
                    kills: [],
                    minimumGuaranteedNextRound: calculateMinimumGuaranteed(initialMoneyOvertime, 0),
                };
                return acc;
            }, {} as Record<string, PlayerRoundState>);
            
            return {
                ...state,
                currentRound: 25, // Début de l'Overtime (peut-être 25, ou 1 pour le tracker)
                phase: 'OvertimeStart', // Phase d'achat
                teamState: { 
                    CT: { score: state.teamState.CT.score, lossStreak: 0 }, 
                    T: { score: state.teamState.T.score, lossStreak: 0 } 
                },
                playerRoundStates: updatedPlayerRoundStates,
            };
        }
        
        case 'END_MATCH':
            // Retour à l'état de configuration
            return { 
                ...state, 
                phase: 'Config',
                currentRound: 0,
                teamState: { CT: { score: 0, lossStreak: 0 }, T: { score: 0, lossStreak: 0 } },
                roundHistory: []
            };

        default:
            return state;
    }
};