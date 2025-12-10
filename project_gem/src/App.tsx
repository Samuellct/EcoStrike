// src/App.tsx

import { useState } from 'react';
import { MatchDashboard } from './components/MatchDashboard';
import { PlayerTable } from './components/PlayerTable';
import { EquipmentPurchase } from './components/EquipmentPurchase';
import { RoundTransition } from './components/RoundTransition';
// L'import de ces types est maintenant géré via useMatchState/types :
// import { Player, PlayerRound, MatchState, RoundResult } from './types'; 
// import { ECONOMIC_CONSTANTS, STARTING_PISTOLS } from './data/cs2Equipment';
// import { calculateBuyValue, calculateRoundReward, getNextLossStreak } from './utils/economicCalculations';
import { ArrowRight } from 'lucide-react';
import { useMatchState } from './state/MatchContext'; // Import du hook
import { MatchConfig } from './components/MatchConfig'; // Nouveau composant de configuration
import { Team } from './types'; // Import de Team pour la configuration initiale

// La fonction initializeMatch n'est plus nécessaire ici.

function App() {
  // Remplacer useState par useMatchState
  const { state, dispatch } = useMatchState();

  // Les états locaux pour l'UI restent ici
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  
  // Le besoin de showRoundTransition change de rôle.
  // Maintenant, la phase 'RoundEndSummary' contrôle l'affichage de RoundTransition.
  // Nous utilisons l'état global 'state.phase'

  const selectedPlayer = state.players.find(p => p.id === selectedPlayerId);

  // --- Rendu Conditionnel Basé sur la Phase ---

  if (state.phase === 'Config') {
    // Afficher la configuration initiale (Choix de mode, Saisie des noms/USP-S vs P2000)
    return <MatchConfig dispatch={dispatch} />;
  }

  // Si on est en phase de résumé, on affiche le composant de transition pour la saisie
  const isTransitionPhase = state.phase === 'RoundEndSummary' || state.phase === 'HalfTime' || state.phase === 'OvertimeStart';
  
  // La fonction pour déclencher la transition de manche (RoundEndSummary) est désormais un dispatch
  const handleTransitionClick = () => {
    // Si la manche est finie (après le chronomètre), on passe à la saisie des résultats
    if (state.phase === 'RoundDuration') {
      dispatch({ type: 'SET_PHASE', payload: 'RoundEndSummary' });
    }
  };


  return (
    <div className="min-h-screen bg-gray-100">
      
      {/* 1. Dashboard et Score */}
      <MatchDashboard
        currentRound={state.currentRound}
        ctScore={state.CT.score}
        tScore={state.T.score}
        ctLossStreak={state.CT.lossStreak}
        tLossStreak={state.T.lossStreak}
        phase={state.phase} // Ajout de phase pour le chronomètre
      />
      
      {/* 2. Tableau des Joueurs (pour visualiser l'état) */}
      <PlayerTable
        players={state.players}
        playerRoundStates={state.playerRoundStates}
        // Ces fonctions devront être refactorisées pour utiliser dispatch dans PlayerTable
        onEquipmentClick={setSelectedPlayerId} 
        onPlayerNameChange={(playerId, name) => { /* Logic with dispatch required */ }}
      />
      
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Bouton de Transition - Maintenant basé sur la phase 'RoundDuration' */}
        {state.phase === 'RoundDuration' && (
          <button
            onClick={handleTransitionClick}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-3 shadow-lg 
                       // AJOUTER ICI L'EFFET DYNAMIQUE (surbrillance) après la fin du chronomètre
                      "
          >
            <span className="text-lg">Fin de Manche / Saisie des Résultats</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* 3. Pop-up d'Achat (FreezeTime / OvertimeStart) */}
      {selectedPlayer && selectedPlayerId && (state.phase === 'FreezeTime' || state.phase === 'OvertimeStart') && (
        <EquipmentPurchase
          player={selectedPlayer}
          playerRoundState={state.playerRoundStates[selectedPlayerId]}
          onPurchase={(input) => dispatch({ type: 'BUY_EQUIPMENT', payload: input })} // Utilisation du dispatch
          onClose={() => setSelectedPlayerId(null)}
        />
      )}

      {/* 4. Pop-up de Saisie des Événements (RoundEndSummary) */}
      {isTransitionPhase && (
        <RoundTransition
          matchState={state}
          dispatch={dispatch}
          onClose={() => dispatch({ type: 'SET_PHASE', payload: 'FreezeTime' })}
          // La logique de fin de manche est maintenant dans RoundTransition qui appelle 'APPLY_ROUND_RESULT'
        />
      )}
      
      {/* TODO: Gérer l'affichage des joueurs pendant la phase RoundDuration si l'on veut un affichage minimaliste */}
      
    </div>
  );
}

export default App;


// ------------------ NOUVEAU COMPOSANT À CRÉER ------------------
// (Créer ce fichier src/components/MatchConfig.tsx)

interface MatchConfigProps {
  dispatch: React.Dispatch<MatchAction>;
}

// NOTE: Ce composant doit afficher le pop-up pour saisir le Mode de Match (Standard/Premier) 
// et les choix de pistolet par défaut pour chaque joueur CT (USP-S/P2000) avant d'appeler 
// dispatch({ type: 'SET_INITIAL_CONFIG', payload: { mode: ..., players: ... } }) 
// puis dispatch({ type: 'START_MATCH' })
const MatchConfig: React.FC<MatchConfigProps> = ({ dispatch }) => {
    // ... Logique de formulaire et d'initialisation des 10 joueurs ...
    
    // Exemple d'initialisation des 10 joueurs pour la configuration :
    const getInitialPlayers = (mode: MatchMode): Player[] => {
        // ... (Logique pour créer les 10 joueurs avec ID/Team/Pistolet par défaut) ...
        const players: Player[] = [];
        // Création de 5 CTs
        for (let i = 1; i <= 5; i++) {
            players.push({
                id: `CT-${i}`,
                name: `CT Player ${i}`,
                team: 'CT' as Team,
                position: i,
                defaultPistol: (i === 1 || i === 3 || i === 5) ? 'USP-S' : 'P2000', // Exemple de choix
            });
        }
        // Création de 5 Ts
        for (let i = 1; i <= 5; i++) {
             players.push({
                id: `T-${i}`,
                name: `T Player ${i}`,
                team: 'T' as Team,
                position: i,
                defaultPistol: 'GLOCK', // Fixé
            });
        }
        return players;
    };
    
    const handleStartMatch = (mode: MatchMode) => {
        const configuredPlayers = getInitialPlayers(mode);
        dispatch({ type: 'SET_INITIAL_CONFIG', payload: { mode, players: configuredPlayers } });
        dispatch({ type: 'START_MATCH' });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Configuration EcoStrike.gg</h2>
                {/* Formulaire de sélection du mode */}
                <button 
                    className="w-full bg-blue-600 text-white py-3 rounded mb-4 hover:bg-blue-700 transition"
                    onClick={() => handleStartMatch('Premier')}
                >
                    Démarrer en Mode Premier (avec Prolongation)
                </button>
                 <button 
                    className="w-full bg-orange-600 text-white py-3 rounded hover:bg-orange-700 transition"
                    onClick={() => handleStartMatch('Standard')}
                >
                    Démarrer en Mode Compétitif Standard (Max 12-12)
                </button>
            </div>
        </div>
    );
};