// src/components/RoundTransition.tsx

import { X, CheckCircle, XCircle, DollarSign, HandHelping } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Player, RoundResult, Team, MatchState, KillEntry } from '../types/index';
import { useMatchState } from '../state/MatchContext'; // Import du hook
import { ALL_WEAPONS } from '../data/cs2Equipment';

// Remplacement des props locales par l'état global et le dispatch
interface RoundTransitionProps {
    matchState: MatchState;
    dispatch: React.Dispatch<any>; // Utilise 'any' ici pour ne pas importer MatchAction
    onClose: () => void;
}

// Interface pour la saisie locale des données de transition
interface TransitionData {
    winner: Team;
    bombPlanted: boolean;
    bombDefused: boolean;
    tLostButExploded: boolean; // Si T perd mais la bombe a explosé (gain $800, streak augmente)
    // Kills et Survie seront gérés via dispatch ou état local temporaire
}


export function RoundTransition({
    matchState,
    dispatch,
    onClose,
}: RoundTransitionProps) {
    const { players, playerRoundStates } = matchState;
    
    // Étape 1 : Saisie du Résultat de la Manche
    const [resultData, setResultData] = useState<TransitionData>(() => ({
        winner: 'CT',
        bombPlanted: false,
        bombDefused: false,
        tLostButExploded: false,
    }));
    
    // Étape 2 : Saisie des événements (survie et kills)
    // Nous utilisons un état local pour les kills et la survie avant d'appliquer le résultat
    const [killInputs, setKillInputs] = useState<Record<string, KillEntry[]>>(() => {
        return players.reduce((acc, p) => ({ ...acc, [p.id]: [] }), {});
    });
    const [survivalStatus, setSurvivalStatus] = useState<Record<string, boolean>>(() => {
        return players.reduce((acc, p) => ({ ...acc, [p.id]: playerRoundStates[p.id]?.isAlive ?? true }), {});
    });
    
    // Pour l'affichage
    const ctPlayers = useMemo(() => players.filter(p => p.team === 'CT').sort((a, b) => a.position - b.position), [players]);
    const tPlayers = useMemo(() => players.filter(p => p.team === 'T').sort((a, b) => a.position - b.position), [players]);

    // --- LOGIQUE DE SAISIE LOCALE ---

    const handleSurvivalToggle = (playerId: string) => {
        setSurvivalStatus(prev => ({
            ...prev,
            [playerId]: !prev[playerId],
        }));
        // Note: L'action 'UPDATE_PLAYER_SURVIVAL' est envoyée lors du SUBMIT final (ou si on le souhaite au changement)
    };
    
    const handleKillUpdate = (playerId: string, weaponId: string, delta: 1 | -1) => {
        setKillInputs(prev => {
            const currentKills = prev[playerId] || [];
            let newKills = [...currentKills];
            const existingEntry = newKills.find(k => k.weaponId === weaponId);

            if (existingEntry) {
                const newCount = existingEntry.count + delta;
                if (newCount > 0) {
                    existingEntry.count = newCount;
                } else {
                    newKills = newKills.filter(k => k.weaponId !== weaponId); // Retirer si count <= 0
                }
            } else if (delta > 0) {
                newKills.push({ weaponId, count: 1 });
            }
            return { ...prev, [playerId]: newKills };
        });
    };

    // --- SOUMISSION FINALE ---
    
    const handleSubmit = () => {
        // 1. Mise à jour de la survie de tous les joueurs
        Object.keys(survivalStatus).forEach(playerId => {
            dispatch({ 
                type: 'UPDATE_PLAYER_SURVIVAL', 
                payload: { playerId, isAlive: survivalStatus[playerId] } 
            });
        });
        
        // 2. Mise à jour des kills de tous les joueurs
        Object.keys(killInputs).forEach(playerId => {
            dispatch({ 
                type: 'UPDATE_KILL_ENTRY', 
                payload: { playerId, kills: killInputs[playerId] } 
            });
        });

        // 3. Déclenchement de l'action de transition économique
        const roundResult: RoundResult = {
            winner: resultData.winner,
            bombPlanted: resultData.bombPlanted,
            bombDefused: resultData.bombDefused,
            tLostButExploded: resultData.tLostButExploded,
        };
        
        // Utilisation de APPLY_ROUND_RESULT qui va exécuter toute la logique de gain d'argent et de streak.
        dispatch({ type: 'APPLY_ROUND_RESULT', payload: roundResult });
        
        // 4. Passage à la manche suivante (FreezeTime)
        dispatch({ type: 'ADVANCE_TO_NEXT_ROUND' });
        
        // Fermeture du modal
        onClose();
    };

    // --- RENDER FUNCTIONS ---
    
    // Le composant pour saisir la survie et les kills
    const renderPlayerSummary = (player: Player) => {
        const pr = playerRoundStates[player.id];
        if (!pr) return null;

        const playerKills = killInputs[player.id] || [];

        return (
            <div key={player.id} className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                        {player.name || `${player.team} Player ${player.position}`}
                    </span>
                    {/* Boutons Alive/Dead */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleSurvivalToggle(player.id)}
                            className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors flex items-center gap-1 ${
                                survivalStatus[player.id]
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            <CheckCircle className="w-4 h-4" /> Alive
                        </button>
                        <button
                            onClick={() => handleSurvivalToggle(player.id)}
                            className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors flex items-center gap-1 ${
                                !survivalStatus[player.id]
                                    ? 'bg-gray-700 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            <XCircle className="w-4 h-4" /> Dead
                        </button>
                    </div>
                </div>
                
                {/* Saisie des Kills (simplifiée: choisir l'arme et incrémenter) */}
                <div className="pt-2 border-t border-gray-100">
                    <h5 className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> Kills & Rewards
                    </h5>
                    <div className="flex flex-wrap gap-2">
                        {/* Exemple: Bouton rapide pour les kills à 300 (Rifle/Pistol) */}
                        <button
                            onClick={() => handleKillUpdate(player.id, 'ak47', 1)} // AK-47 est un placeholder de 300$
                            className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                        >
                            +1 Kill (Rifle)
                        </button>
                        {/* Afficher les kills enregistrés */}
                        {playerKills.map(k => (
                            <div key={k.weaponId} className="flex items-center bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                                {k.count} x {getItemById(k.weaponId)?.name || k.weaponId}
                                <button onClick={() => handleKillUpdate(player.id, k.weaponId, -1)} className="ml-1 text-red-600">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Round {matchState.currentRound} Transition Summary</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* SECTION 1: ROUND RESULT */}
                    <div className="grid grid-cols-3 gap-6">
                        {/* Vainqueur */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Vainqueur de la Manche</h3>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setResultData(p => ({ ...p, winner: 'CT' }))}
                                    className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                                        resultData.winner === 'CT' ? 'border-blue-600 bg-blue-100' : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                >
                                    CT
                                </button>
                                <button
                                    onClick={() => setResultData(p => ({ ...p, winner: 'T' }))}
                                    className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                                        resultData.winner === 'T' ? 'border-red-600 bg-red-100' : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                >
                                    T
                                </button>
                            </div>
                        </div>

                        {/* Plant/Explosion/Défuse */}
                        <div className="col-span-2 space-y-3">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Statut de la Bombe et Objectifs</h3>
                            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={resultData.bombPlanted}
                                    onChange={(e) => setResultData(p => ({ ...p, bombPlanted: e.target.checked }))}
                                    className="w-5 h-5"
                                />
                                <span className="font-medium text-gray-900">Bombe plantée</span>
                            </label>
                            {resultData.bombPlanted && (
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={resultData.bombDefused}
                                            onChange={(e) => setResultData(p => ({ ...p, bombDefused: e.target.checked }))}
                                            disabled={resultData.winner === 'T'}
                                            className="w-5 h-5"
                                        />
                                        <span className="font-medium text-gray-900">Bombe Défusée (Victoire CT)</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={resultData.tLostButExploded}
                                            onChange={(e) => setResultData(p => ({ ...p, tLostButExploded: e.target.checked }))}
                                            disabled={resultData.winner === 'T' || !resultData.bombPlanted}
                                            className="w-5 h-5"
                                        />
                                        <span className="font-medium text-gray-900">La bombe a explosé (Défaite CT, $800 T)</span>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION 2: PLAYER EVENTS (SURVIVAL & KILLS) */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <HandHelping className="w-5 h-5" /> Saisie des Événements
                        </h3>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-sm font-semibold text-blue-900 mb-2">Counter-Terrorists</h4>
                                <div className="space-y-2">
                                    {ctPlayers.map(renderPlayerSummary)}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-red-900 mb-2">Terrorists</h4>
                                <div className="space-y-2">
                                    {tPlayers.map(renderPlayerSummary)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER: SUBMIT */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                        >
                            Appliquer les Résultats et Passer à la Manche Suivante
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Fonction utilitaire pour éviter l'import de cs2Equipment ici (déjà disponible dans App.tsx)
// Pour une bonne pratique, ceci devrait être dans un fichier commun, mais je le redéfinis ici pour compiler:
function getItemById(id: string) {
    return ALL_WEAPONS.find(item => item.id === id);
}