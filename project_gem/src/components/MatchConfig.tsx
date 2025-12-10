// src/components/MatchConfig.tsx (CORRIGÉ ET COMPLET)

import React from 'react';
import { Player, Team, MatchMode } from '../types/index'; // Types de base
import { ArrowRight } from 'lucide-react'; 
// CORRECTION: Import de MatchAction depuis le reducer pour un typage correct
import { MatchAction } from '../state/matchReducer'; 

interface MatchConfigProps {
  // CORRECTION: Typage précis du dispatch
  dispatch: React.Dispatch<MatchAction>; 
}

/**
 * Composant de configuration initiale du match.
 * Permet de choisir le mode et d'initialiser les joueurs.
 */
export const MatchConfig: React.FC<MatchConfigProps> = ({ dispatch }) => {
    
    // Initialisation des 10 joueurs pour la configuration :
    const getInitialPlayers = (mode: MatchMode): Player[] => {
        const players: Player[] = [];
        
        // Création de 5 CTs
        for (let i = 1; i <= 5; i++) {
            players.push({
                id: `CT-${i}`,
                name: `CT Player ${i}`,
                team: 'CT' as Team,
                position: i,
                // Alterner entre USP-S et P2000
                defaultPistol: (i % 2 === 0) ? 'P2000' : 'USP-S', 
            });
        }
        
        // Création de 5 Ts
        for (let i = 1; i <= 5; i++) {
            players.push({
                id: `T-${i}`,
                name: `T Player ${i}`,
                team: 'T' as Team,
                position: i,
                defaultPistol: 'GLOCK', 
            });
        }
        return players;
    };
    
    const handleStartMatch = (mode: MatchMode) => {
        const configuredPlayers = getInitialPlayers(mode);
        
        // 1. Initialiser l'état (joueurs, mode, argent de départ)
        dispatch({ type: 'SET_INITIAL_CONFIG', payload: { mode, players: configuredPlayers } });
        
        // 2. Commencer la première manche (FreezeTime/Achat)
        dispatch({ type: 'START_MATCH' });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Configuration EcoStrike.gg</h2>
                <p className="text-gray-600 mb-6 text-center">
                    Choisissez le mode de jeu pour démarrer. Ceci initialisera 10 joueurs par défaut.
                </p>
                
                {/* Boutons de sélection du mode */}
                <button 
                    className="w-full bg-blue-600 text-white py-3 rounded mb-4 hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    onClick={() => handleStartMatch('Premier')}
                >
                    <span className="font-semibold">Démarrer en Mode Premier</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
                 <button 
                    className="w-full bg-orange-600 text-white py-3 rounded hover:bg-orange-700 transition flex items-center justify-center gap-2"
                    onClick={() => handleStartMatch('Standard')}
                >
                    <span className="font-semibold">Démarrer en Mode Standard</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}