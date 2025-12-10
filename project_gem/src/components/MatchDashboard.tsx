// src/components/MatchDashboard.tsx (CORRIGÉ ET COMPLET)

import { useMatchState } from '../state/MatchContext';
import { DollarSign, User } from 'lucide-react';
// CORRECTION: Import de la fonction avec le nom correct
import { calculateMinimumGuaranteed } from '../utils/economicCalculations'; 
import { PlayerRoundState } from '../types';

// Le composant utilise useMatchState et ne nécessite pas de props.
// La props vide MatchDashboardProps est retirée.

export function MatchDashboard() {
  const { state } = useMatchState();
  
  // CORRECTION: Destructuration des propriétés existantes uniquement
  const {
    currentRound,
    teamState, 
    players,
    playerRoundStates,
    phase,
  } = state;
  
  // --- Calculs des Statistiques ---

  // CORRECTION: Accès aux scores et streaks via teamState
  const ctScore = teamState.CT.score; 
  const tScore = teamState.T.score;
  const ctLossStreak = teamState.CT.lossStreak;
  const tLossStreak = teamState.T.lossStreak;

  const ctPlayers = players.filter(p => p.team === 'CT');
  const tPlayers = players.filter(p => p.team === 'T');

  const getTeamStats = (teamPlayers: typeof players, teamLossStreak: number) => {
    const totalMoney = teamPlayers.reduce((sum, p) => {
        const pr = playerRoundStates[p.id];
        return sum + (pr?.money || 0);
    }, 0);

    const totalBuyValue = teamPlayers.reduce((sum, p) => {
        const pr = playerRoundStates[p.id];
        // buyValue est calculé dans le reducer et stocké dans PlayerRoundState
        return sum + (pr?.buyValue || 0); 
    }, 0);
    
    // CORRECTION: Utilisation de calculateMinimumGuaranteed sur la somme de l'argent et le Loss Streak
    // Ceci est une simplification. Normalement, on voudrait le Minimum Garanti *par joueur*
    // Ici on calcule la somme minimale que l'équipe aura au prochain round (en supposant la défaite).
    const minimumGuaranteedLossBonus = teamPlayers.reduce((sum, p) => {
        const pr = playerRoundStates[p.id];
        return sum + calculateMinimumGuaranteed(pr?.money || 0, teamLossStreak);
    }, 0);
    
    // Une simplification plus juste pour le Dashboard (Somme d'argent + Bonus max garanti pour toute l'équipe)
    const guaranteedLossBonus = teamPlayers.reduce((sum, p) => {
        const pr = playerRoundStates[p.id] as PlayerRoundState;
        return sum + pr.minimumGuaranteedNextRound; // On utilise la valeur pré-calculée dans l'état
    }, 0);

    return { totalMoney, totalBuyValue, guaranteedLossBonus };
  };

  const ctStats = getTeamStats(ctPlayers, ctLossStreak);
  const tStats = getTeamStats(tPlayers, tLossStreak);
  
  const { totalMoney: ctTotalMoney, totalBuyValue: ctTotalBuyValue, guaranteedLossBonus: ctGuaranteedBonus } = ctStats;
  const { totalMoney: tTotalMoney, totalBuyValue: tTotalBuyValue, guaranteedLossBonus: tGuaranteedBonus } = tStats;

  // --- Rendu ---
  
  // Affichage de la phase actuelle
  const getPhaseDisplay = (p: string) => {
    switch (p) {
        case 'Config': return 'Configuration';
        case 'FreezeTime': return 'Achat/Freeze Time';
        case 'RoundDuration': return 'Manche en Cours';
        case 'RoundEndSummary': return 'Saisie des Résultats';
        case 'HalfTime': return 'Changement de Side';
        case 'OvertimeStart': return 'Prolongation';
        case 'Finished': return 'Match Terminé';
        default: return 'Inconnu';
    }
  }
  
  return (
    <div className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        
        {/* En-tête du Match */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-extrabold text-gray-900">EcoStrike Tracker</h1>
          <div className="text-lg font-semibold text-gray-700">
            <span className="text-gray-500 mr-2">Phase:</span> 
            <span className={`
                ${phase === 'FreezeTime' ? 'text-blue-600' : ''}
                ${phase === 'RoundDuration' ? 'text-green-600' : ''}
                ${phase === 'RoundEndSummary' ? 'text-orange-600' : ''}
                ${phase === 'Config' ? 'text-red-500' : ''}
            `}>{getPhaseDisplay(phase)}</span>
          </div>
        </div>
        
        {/* Score et Numéro de Manche */}
        <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-100">
          <div className="text-gray-500 font-medium">Manche</div>
          <div className="text-5xl font-extrabold text-gray-900 mx-8">
            {ctScore} : {tScore}
          </div>
          <div className="text-3xl font-extrabold text-gray-900">
             {currentRound}
          </div>
        </div>

        {/* Statistiques d'Équipe */}
        <div className="grid grid-cols-2 gap-8">
          
          {/* CT Side */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-blue-900">Counter-Terrorists</h3>
              <div className="text-sm font-medium text-blue-700 flex items-center gap-1">
                 <User className='w-4 h-4'/> Total Players: {ctPlayers.length}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-blue-700 mb-1">Total Team Money</div>
                <div className="text-2xl font-bold text-blue-900 flex items-center gap-1">
                    <DollarSign className='w-5 h-5'/> {ctTotalMoney.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-blue-700 mb-1">Buy Value (Total Gear)</div>
                <div className="text-2xl font-bold text-blue-900">${ctTotalBuyValue.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-blue-700 mb-1">Loss Streak</div>
                <div className={`text-2xl font-bold ${ctLossStreak > 0 ? 'text-orange-600' : 'text-blue-900'}`}>{ctLossStreak}</div>
              </div>
              <div>
                <div className="text-xs text-blue-700 mb-1">Min. Guaranteed Next Round</div>
                {/* CORRECTION: Utilisation de la stat garantie pré-calculée par le reducer */}
                <div className="text-2xl font-bold text-blue-900">${ctGuaranteedBonus.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* T Side */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-red-900">Terrorists</h3>
              <div className="text-sm font-medium text-red-700 flex items-center gap-1">
                 <User className='w-4 h-4'/> Total Players: {tPlayers.length}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-red-700 mb-1">Total Team Money</div>
                <div className="text-2xl font-bold text-red-900 flex items-center gap-1">
                    <DollarSign className='w-5 h-5'/> {tTotalMoney.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-red-700 mb-1">Buy Value (Total Gear)</div>
                <div className="text-2xl font-bold text-red-900">${tTotalBuyValue.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-red-700 mb-1">Loss Streak</div>
                <div className={`text-2xl font-bold ${tLossStreak > 0 ? 'text-orange-600' : 'text-red-900'}`}>{tLossStreak}</div>
              </div>
              <div>
                <div className="text-xs text-red-700 mb-1">Min. Guaranteed Next Round</div>
                {/* CORRECTION: Utilisation de la stat garantie pré-calculée par le reducer */}
                <div className="text-2xl font-bold text-red-900">${tGuaranteedBonus.toLocaleString()}</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}