// src/components/RoundTransition.tsx (CORRIGÉ ET COMPLET)

import { X, CheckCircle, XCircle, DollarSign, Edit, Swords } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Player, 
    RoundResult, 
    Team, 
    MatchState, 
    KillEntry, 
    PlayerRoundState, 
    RoundWinType 
} from '../types/index';
// CORRECTION: Import de MatchAction pour un typage correct
import { MatchAction } from '../state/matchReducer'; 
// Import direct des helpers
import { getItemById } from '../data/cs2Equipment';


// Remplacement des props locales par l'état global et le dispatch
interface RoundTransitionProps {
    matchState: MatchState;
    // CORRECTION: Typage précis du dispatch
    dispatch: React.Dispatch<MatchAction>; 
    onClose: () => void; // Appelé par App.tsx pour passer à FreezeTime
}

// Interface pour la saisie locale des données de transition
interface TransitionData {
    winner: Team;
    winType: RoundWinType; // Ajout du type de victoire
    bombPlanted: boolean;
    bombDefused: boolean;
    // tLostButExploded n'est plus nécessaire car WinType gère ça
}

// Interface pour la saisie locale des kills
interface LocalKillState {
    [playerId: string]: {
        isAlive: boolean;
        kills: KillEntry[];
    };
}


export function RoundTransition({
    matchState,
    dispatch,
    onClose,
}: RoundTransitionProps) {
    const { players, playerRoundStates, currentRound } = matchState;
    
    // --- Étape 1 : Initialisation de l'État Local ---
    
    const initialLocalKillState: LocalKillState = useMemo(() => {
        return players.reduce((acc, p) => {
            const pr = playerRoundStates[p.id];
            // Initialisation avec l'état de la fin de la manche RoundDuration
            acc[p.id] = {
                isAlive: pr.isAlive, 
                kills: pr.kills,
            };
            return acc;
        }, {} as LocalKillState);
    }, [players, playerRoundStates]);
    
    // État local pour le résultat principal de la manche
    const [resultData, setResultData] = useState<TransitionData>(() => ({
        // Vainqueur par défaut au CT (si aucun événement)
        winner: 'CT', 
        winType: 'Elimination',
        bombPlanted: false,
        bombDefused: false,
    }));
    
    // État local pour les kills et la survie
    const [localKillState, setLocalKillState] = useState<LocalKillState>(initialLocalKillState);
    
    
    // --- Étape 2 : Fonctions de Mise à Jour ---
    
    // Gestion du résultat de la manche
    const handleResultChange = (field: keyof TransitionData, value: boolean | Team | RoundWinType) => {
        setResultData(prev => {
            const newState = { ...prev, [field]: value };
            
            // Logique de cohérence du WinType
            if (field === 'winner' || field === 'bombPlanted' || field === 'bombDefused') {
                if (newState.bombDefused) {
                    newState.winner = 'CT';
                    newState.winType = 'BombDefused';
                } else if (newState.winner === 'T' && newState.bombPlanted) {
                    newState.winType = 'BombExplosion';
                } else if (newState.winner === 'CT' && newState.bombPlanted) {
                    newState.winType = 'TimeExpiration'; // La bombe a été plantée mais CT a désamorcé (géré au-dessus) ou T a perdu par temps
                } else {
                    newState.winType = 'Elimination'; // Par défaut
                }
            }
            return newState;
        });
    };
    
    // Mise à jour des kills/survie
    const handleKillChange = (playerId: string, weaponId: string, delta: number) => {
        setLocalKillState(prev => {
            const playerEntry = prev[playerId];
            if (!playerEntry) return prev;
            
            const newKills = [...playerEntry.kills];
            const existingKillIndex = newKills.findIndex(k => k.weaponId === weaponId);
            
            if (existingKillIndex !== -1) {
                const newCount = newKills[existingKillIndex].count + delta;
                if (newCount <= 0) {
                    newKills.splice(existingKillIndex, 1); // Retirer si count <= 0
                } else {
                    newKills[existingKillIndex].count = newCount;
                }
            } else if (delta > 0) {
                // Ajouter une nouvelle entrée de kill
                newKills.push({ weaponId, count: delta });
            }
            
            // CORRECTION: Rétablir l'état de survie si des kills sont ajoutés
            const totalKills = newKills.reduce((sum, k) => sum + k.count, 0);

            return {
                ...prev,
                [playerId]: {
                    ...playerEntry,
                    kills: newKills,
                },
            };
        });
    };

    const handleSurvivalChange = (playerId: string, isAlive: boolean) => {
         setLocalKillState(prev => ({
            ...prev,
            [playerId]: {
                ...prev[playerId],
                isAlive: isAlive,
            },
        }));
    };
    
    // --- Étape 3 : Soumission des Résultats ---
    
    const handleSubmit = () => {
        
        // 1. Mise à jour de l'état des kills/survie pour la manche actuelle (avant de calculer l'argent)
        Object.keys(localKillState).forEach(playerId => {
            dispatch({ 
                type: 'UPDATE_PLAYER_SURVIVAL', 
                payload: { playerId, isAlive: localKillState[playerId].isAlive } 
            });
            dispatch({ 
                type: 'UPDATE_KILL_ENTRY', 
                payload: { playerId, kills: localKillState[playerId].kills } 
            });
        });
        
        // 2. Calcul des totaux de survie pour l'objet RoundResult
        const remainingCtAlive = players.filter(p => p.team === 'CT' && localKillState[p.id]?.isAlive).length;
        const remainingTAlive = players.filter(p => p.team === 'T' && localKillState[p.id]?.isAlive).length;

        // 3. Construction de l'objet RoundResult final
        const finalRoundResult: RoundResult = {
            roundNumber: currentRound,
            winner: resultData.winner,
            winType: resultData.winType,
            bombPlanted: resultData.bombPlanted,
            bombDefused: resultData.bombDefused,
            remainingCtAlive: remainingCtAlive,
            remainingTAlive: remainingTAlive,
        };
        
        // 4. Application du résultat de la manche (Calcul de l'argent et des streaks)
        dispatch({ type: 'APPLY_ROUND_RESULT', payload: finalRoundResult });
        
        // 5. Passage à la phase d'achat de la manche suivante (sera géré par onClose dans App.tsx)
        onClose(); 
    };
    
    // --- Étape 4 : Rendu ---
    
    const ctPlayers = players.filter(p => p.team === 'CT').sort((a, b) => a.position - b.position);
    const tPlayers = players.filter(p => p.team === 'T').sort((a, b) => a.position - b.position);
    
    // Rendu d'une ligne de joueur pour la saisie des kills et survie
    const renderPlayerSummary = (player: Player) => {
        const pr = playerRoundStates[player.id];
        const localState = localKillState[player.id];
        const playerTeam = player.team;
        
        if (!pr || !localState) return null;
        
        // Calcul du total des kills
        const totalKills = localState.kills.reduce((sum, k) => sum + k.count, 0);
        
        // Affichage des kills par arme
        const killDetails = localState.kills.map(k => {
            const itemName = getItemById(k.weaponId)?.name || k.weaponId;
            return (
                <span key={k.weaponId} className="text-xs text-gray-600 mr-2">
                    {itemName} ({k.count})
                </span>
            );
        });

        return (
            <div key={player.id} className="p-3 border rounded-lg bg-white shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800">{player.name}</span>
                    <div className='flex items-center gap-4'>
                        
                        {/* 1. Survie */}
                        <label className='flex items-center gap-2 text-sm'>
                            Statut:
                            <button
                                onClick={() => handleSurvivalChange(player.id, !localState.isAlive)}
                                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                    localState.isAlive 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-red-100 text-red-700'
                                }`}
                            >
                                {localState.isAlive ? 'Alive' : 'Dead'}
                            </button>
                        </label>

                        {/* 2. Kills Total */}
                        <div className='flex items-center gap-1 text-sm'>
                            <Swords className='w-4 h-4 text-gray-500'/>
                            Kills: <span className='font-bold'>{totalKills}</span>
                        </div>
                    </div>
                </div>

                {/* Saisie Détaillée des Kills (Simplifiée pour l'exemple) */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                    <div className='flex flex-wrap gap-1'>
                        {killDetails.length > 0 ? killDetails : <span className='text-gray-400'>No kills recorded</span>}
                    </div>
                    {/* Bouton pour ajouter un Kill générique (pour la démo) */}
                    <button
                        onClick={() => handleKillChange(player.id, pr.inventory[0]?.id || 'ak47', 1)} // Utilise l'arme principale par défaut ou AK
                        className='text-blue-500 hover:text-blue-700 transition-colors'
                        title="Ajouter un kill avec l'arme principale"
                    >
                        + Kill
                    </button>
                </div>
            </div>
        );
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                
                {/* En-tête et Titre */}
                <div className="flex justify-between items-start pb-4 border-b border-gray-200">
                    <h2 className="text-3xl font-bold text-gray-900">
                        Manche {currentRound}: Saisie des Résultats
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-grow space-y-6 pr-2 mt-4">

                    {/* Partie 1: Résultat de la Manche */}
                    <div className='p-4 border border-gray-200 rounded-lg bg-gray-50'>
                        <h3 className="text-xl font-bold mb-3">1. Résultat Principal</h3>
                        <div className="grid grid-cols-4 gap-4">
                            
                            {/* Vainqueur */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Équipe Gagnante:</label>
                                <div className='flex gap-3'>
                                    <button 
                                        onClick={() => handleResultChange('winner', 'CT')}
                                        className={`px-4 py-2 rounded-lg font-semibold ${
                                            resultData.winner === 'CT' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                                        }`}
                                    >
                                        CT
                                    </button>
                                    <button 
                                        onClick={() => handleResultChange('winner', 'T')}
                                        className={`px-4 py-2 rounded-lg font-semibold ${
                                            resultData.winner === 'T' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'
                                        }`}
                                    >
                                        T
                                    </button>
                                </div>
                            </div>
                            
                            {/* Bombe Plantée */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Bombe Plantée?</label>
                                <button 
                                    onClick={() => handleResultChange('bombPlanted', !resultData.bombPlanted)}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                        resultData.bombPlanted ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    {resultData.bombPlanted ? 'OUI' : 'NON'}
                                </button>
                            </div>

                            {/* Bombe Désamorcée */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Bombe Désamorcée?</label>
                                <button 
                                    onClick={() => handleResultChange('bombDefused', !resultData.bombDefused)}
                                    disabled={!resultData.bombPlanted}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                        resultData.bombDefused ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                                    } ${!resultData.bombPlanted ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {resultData.bombDefused ? 'OUI' : 'NON'}
                                </button>
                            </div>
                        </div>
                        
                        <p className='mt-4 text-sm font-medium text-gray-600'>
                            Type de victoire calculé: <span className='font-bold text-gray-800'>{resultData.winType}</span>
                        </p>
                    </div>

                    {/* Partie 2: Kills et Survie des Joueurs */}
                    <div className='p-4 border border-gray-200 rounded-lg'>
                        <h3 className="text-xl font-bold mb-3">2. Kills et Survie (Fin de Manche)</h3>
                        <div className="grid grid-cols-2 gap-6">
                            
                            {/* CTs */}
                            <div>
                                <h4 className="text-lg font-semibold text-blue-900 mb-2">Counter-Terrorists</h4>
                                <div className="space-y-2">
                                    {ctPlayers.map(renderPlayerSummary)}
                                </div>
                            </div>

                            {/* Ts */}
                            <div>
                                <h4 className="text-lg font-semibold text-red-900 mb-2">Terrorists</h4>
                                <div className="space-y-2">
                                    {tPlayers.map(renderPlayerSummary)}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* FOOTER: SUBMIT */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                        Annuler (Retour au Temps d'Achat)
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                        Appliquer les Résultats et Calculer l'Économie
                    </button>
                </div>
            </div>
        </div>
    );
}