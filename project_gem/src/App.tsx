// src/App.tsx (MODIFIÉ)

import { useState } from 'react';
import { MatchDashboard } from './components/MatchDashboard';
import { PlayerTable } from './components/PlayerTable';
import { EquipmentPurchase } from './components/EquipmentPurchase';
import { RoundTransition } from './components/RoundTransition';
import { ArrowRight } from 'lucide-react';
import { useMatchState } from './state/MatchContext'; 
import { MatchConfig } from './components/MatchConfig'; 
import { Team } from './types/index'; 
import { RoundTimer } from './components/RoundTimer'; // NOUVEL IMPORT

// La fonction initializeMatch n'est plus nécessaire ici.

function App() {
  // Remplacer useState par useMatchState
  const { state, dispatch } = useMatchState();

  // Les états locaux pour l'UI restent ici
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  
  const selectedPlayer = state.players.find(p => p.id === selectedPlayerId);

  // -- Logique de Phase --
  const isTransitionPhase = state.phase === 'RoundEndSummary';
  const isRoundActive = state.phase === 'FreezeTime' || state.phase === 'RoundDuration';
  
  // MODIFICATION CLÉ: L'achat est maintenant possible pendant RoundDuration
  const isPurchasePhase = state.phase === 'FreezeTime' || state.phase === 'OvertimeStart' || state.phase === 'RoundDuration';

  // --- RENDU ---
  
  if (state.phase === 'Config') {
    return <MatchConfig dispatch={dispatch} />;
  }
  
  return (
    <div className='min-h-screen bg-gray-100'>
      <MatchDashboard />
      
      {/* 2. Chronomètre au centre (NOUVEAU) */}
      <div className='flex justify-center'>
        <RoundTimer /> 
      </div>

      <div className='max-w-7xl mx-auto'>
        <PlayerTable onEquipmentClick={setSelectedPlayerId} />
      </div>

      <div className='mt-8 flex justify-center'>
        {/* NOUVEAU: Le bouton s'affiche dès que RoundDuration démarre */}
        {isRoundActive && (
          <button 
            // Ce bouton force le passage à la phase de saisie (RoundEndSummary)
            onClick={() => dispatch({ type: 'SET_PHASE', payload: 'RoundEndSummary' })}
            // MODIFICATION CLÉ: Ajout de la classe d'animation 'animate-pulse-cs' lorsque la manche est terminée (RoundEndSummary)
            className={`
                       px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-3 shadow-lg 
                       // Utiliser la surbrillance si la phase de saisie est active (signe que le temps est écoulé)
                       ${isTransitionPhase ? 'animate-pulse-cs' : ''} 
                      `}
          >
            <span className="text-lg">Fin de Manche / Saisie des Résultats</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* 3. Pop-up d'Achat (FreezeTime / OvertimeStart / RoundDuration) (MODIFIÉ) */}
      {selectedPlayer && selectedPlayerId && isPurchasePhase && (
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