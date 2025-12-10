// src/App.tsx (CORRIGÉ ET COMPLET)

import { useState } from 'react';
import { MatchDashboard } from './components/MatchDashboard';
import { PlayerTable } from './components/PlayerTable';
import { EquipmentPurchase } from './components/EquipmentPurchase';
import { RoundTransition } from './components/RoundTransition';
import { ArrowRight, LogOut } from 'lucide-react';
import { useMatchState } from './state/MatchContext'; 
import { MatchConfig } from './components/MatchConfig'; 

function App() {
  // Récupération de l'état global et de la fonction dispatch
  const { state, dispatch } = useMatchState();

  // État local pour gérer quel joueur est en cours d'achat
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  
  const selectedPlayer = state.players.find(p => p.id === selectedPlayerId);

  // Phases de contrôle pour le rendu
  const isConfigPhase = state.phase === 'Config';
  const isTransitionPhase = state.phase === 'RoundEndSummary';
  const isRoundDuration = state.phase === 'RoundDuration';
  const isMatchFinished = state.phase === 'Finished';

  // Callback pour ouvrir le pop-up d'achat
  const handleEquipmentClick = (playerId: string) => {
    if (state.phase === 'FreezeTime' || state.phase === 'OvertimeStart') {
        setSelectedPlayerId(playerId);
    }
  };
  
  // Fonction de changement de nom (non implémentée dans le reducer, laissée en placeholder)
  const handlePlayerNameChange = (_playerId: string, _name: string) => {
    console.warn(`Functionality 'UPDATE_PLAYER_NAME' not implemented in reducer.`);
  };


  // --- Rendu Conditionnel (Phase Config) ---
  if (isConfigPhase) {
    return <MatchConfig dispatch={dispatch} />;
  }
  
  // --- Rendu Conditionnel (Match Terminé) ---
  if (isMatchFinished) {
      return (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
               <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md text-center">
                    <h2 className="text-3xl font-bold mb-4 text-green-700">Match Terminé !</h2>
                    <p className='text-xl mb-6'>Score Final: {state.teamState.CT.score} - {state.teamState.T.score}</p>
                    <button 
                        onClick={() => dispatch({ type: 'END_MATCH' })}
                        className="w-full bg-red-600 text-white py-3 rounded hover:bg-red-700 transition flex items-center justify-center gap-2"
                    >
                         <LogOut className='w-5 h-5'/> Revenir à la Configuration
                    </button>
               </div>
          </div>
      );
  }

  // --- Rendu Principal du Tracker ---
  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      
      {/* 1. Tableau de Bord */}
      <MatchDashboard />

      {/* 2. Tableau des Joueurs */}
      <PlayerTable 
        onEquipmentClick={handleEquipmentClick} 
        onPlayerNameChange={handlePlayerNameChange} 
      /> 

      {/* Bouton de Fin de Manche / Saisie des Résultats */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        {isRoundDuration && (
          <button 
            // Clic: Passe en phase de saisie des résultats
            onClick={() => dispatch({ type: 'SET_PHASE', payload: 'RoundEndSummary' })}
            className={`w-full bg-gray-900 text-white font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-3 shadow-lg hover:bg-gray-800`}
          >
            <span className="text-lg">Fin de Manche / Saisie des Résultats</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* 3. Pop-up d'Achat (visible pendant FreezeTime et OvertimeStart) */}
      {selectedPlayer && selectedPlayerId && (state.phase === 'FreezeTime' || state.phase === 'OvertimeStart') && (
        <EquipmentPurchase
          player={selectedPlayer}
          playerRoundState={state.playerRoundStates[selectedPlayerId]}
          // Le callback envoie l'action BUY_EQUIPMENT au reducer
          onPurchase={(input) => dispatch({ type: 'BUY_EQUIPMENT', payload: input })} 
          onClose={() => setSelectedPlayerId(null)}
        />
      )}

      {/* 4. Pop-up de Saisie des Événements (visible pendant RoundEndSummary) */}
      {isTransitionPhase && (
        <RoundTransition
          matchState={state}
          dispatch={dispatch}
          // La logique de fin de manche est maintenant dans RoundTransition qui appelle 'APPLY_ROUND_RESULT'.
          // Lorsque l'utilisateur ferme, on détermine la phase suivante (Avance, Mi-temps, Prolongation, Fin)
          onClose={() => {
              const ctScore = state.teamState.CT.score;
              const tScore = state.teamState.T.score;
              const round = state.currentRound;

              if (round === 12) { 
                  // Après la manche 12, on passe à HalfTime pour le changement de côté
                  dispatch({ type: 'SET_PHASE', payload: 'HalfTime' });
              } else if (round === 24 && ctScore !== tScore) { 
                  // Fin du match sans prolongation
                  dispatch({ type: 'SET_PHASE', payload: 'Finished' });
              } else if (round === 24 && ctScore === tScore && state.matchMode === 'Premier') {
                  // Fin du match en égalité en mode Premier: on initie la prolongation
                  dispatch({ type: 'INITIATE_OVERTIME' }); 
              } else if (round >= 24 && round % 6 === 0 && ctScore !== tScore) { 
                  // Fin de prolongation par différence de deux (toutes les 6 manches)
                  dispatch({ type: 'SET_PHASE', payload: 'Finished' });
              } else {
                  // Avance au prochain round (FreezeTime par défaut)
                  dispatch({ type: 'ADVANCE_TO_NEXT_ROUND' });
              }
          }}
        />
      )}
      
    </div>
  );
}

export default App;