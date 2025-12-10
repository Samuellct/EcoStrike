// src/components/MatchDashboard.tsx

import { useMatchState } from '../state/MatchContext';
import { getGuaranteedLossBonus } from '../utils/economicCalculations';
import { DollarSign, User } from 'lucide-react';

// Le composant n'a plus besoin de props car il utilise le contexte.
interface MatchDashboardProps {}

export function MatchDashboard({}: MatchDashboardProps) {
  const { state } = useMatchState();
  const {
    currentRound,
    ctScore,
    tScore,
    ctLossStreak,
    tLossStreak,
    players,
    playerRoundStates, // Renommé pour correspondre au Reducer
    phase, // Ajout de la phase pour l'affichage conditionnel
  } = state;

  const ctPlayers = players.filter(p => p.team === 'CT');
  const tPlayers = players.filter(p => p.team === 'T');

  // Utilisation de playerRoundStates pour les calculs
  const ctTotalMoney = ctPlayers.reduce((sum, p) => {
    const pr = playerRoundStates[p.id];
    return sum + (pr?.money || 0);
  }, 0);

  const tTotalMoney = tPlayers.reduce((sum, p) => {
    const pr = playerRoundStates[p.id];
    return sum + (pr?.money || 0);
  }, 0);

  const ctTotalBuyValue = ctPlayers.reduce((sum, p) => {
    const pr = playerRoundStates[p.id];
    return sum + (pr?.buyValue || 0);
  }, 0);

  const tTotalBuyValue = tPlayers.reduce((sum, p) => {
    const pr = playerRoundStates[p.id];
    return sum + (pr?.buyValue || 0);
  }, 0);

  // Le calcul du bonus est toujours basé sur la séquence de défaites
  const ctGuaranteedBonus = getGuaranteedLossBonus(ctLossStreak);
  const tGuaranteedBonus = getGuaranteedLossBonus(tLossStreak);

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-6">
        
        {/* En-tête : Titre, Manche et Score */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">EcoStrike.gg</h1>
            <p className="text-sm text-gray-500 mt-1">CS2 Economy Tracker</p>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Round</div>
            <div className="text-4xl font-bold text-gray-900">{currentRound}</div>
            <div className="text-xs font-medium text-purple-600 mt-1">
                {phase === 'FreezeTime' ? 'ACHAT EN COURS' : 'MANCHE EN COURS'}
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-sm text-blue-600 font-medium mb-1">CT Score</div>
              <div className="text-3xl font-bold text-blue-600">{ctScore}</div>
            </div>
            <div className="text-2xl text-gray-400">-</div>
            <div className="text-center">
              <div className="text-sm text-red-600 font-medium mb-1">T Score</div>
              <div className="text-3xl font-bold text-red-600">{tScore}</div>
            </div>
          </div>
        </div>

        {/* Tableau de bord Économique */}
        <div className="grid grid-cols-2 gap-6">
          
          {/* CT Dashboard */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                <div className="text-xs text-blue-700 mb-1">Next Loss Bonus</div>
                <div className="text-2xl font-bold text-blue-900">${ctGuaranteedBonus.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* T Dashboard */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
                <div className="text-xs text-red-700 mb-1">Next Loss Bonus</div>
                <div className="text-2xl font-bold text-red-900">${tGuaranteedBonus.toLocaleString()}</div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}