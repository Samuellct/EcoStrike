import { Player, PlayerRound } from '../types';
import { getGuaranteedLossBonus } from '../utils/economicCalculations';

interface MatchDashboardProps {
  currentRound: number;
  ctScore: number;
  tScore: number;
  ctLossStreak: number;
  tLossStreak: number;
  players: Player[];
  playerRounds: Record<string, PlayerRound>;
}

export function MatchDashboard({
  currentRound,
  ctScore,
  tScore,
  ctLossStreak,
  tLossStreak,
  players,
  playerRounds,
}: MatchDashboardProps) {
  const ctPlayers = players.filter(p => p.team === 'CT');
  const tPlayers = players.filter(p => p.team === 'T');

  const ctTotalMoney = ctPlayers.reduce((sum, p) => {
    const pr = playerRounds[p.id];
    return sum + (pr?.money || 0);
  }, 0);

  const tTotalMoney = tPlayers.reduce((sum, p) => {
    const pr = playerRounds[p.id];
    return sum + (pr?.money || 0);
  }, 0);

  const ctTotalBuyValue = ctPlayers.reduce((sum, p) => {
    const pr = playerRounds[p.id];
    return sum + (pr?.buyValue || 0);
  }, 0);

  const tTotalBuyValue = tPlayers.reduce((sum, p) => {
    const pr = playerRounds[p.id];
    return sum + (pr?.buyValue || 0);
  }, 0);

  const ctGuaranteedBonus = getGuaranteedLossBonus(ctLossStreak);
  const tGuaranteedBonus = getGuaranteedLossBonus(tLossStreak);

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">EcoStrike.gg</h1>
            <p className="text-sm text-gray-500 mt-1">CS2 Economy Tracker</p>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Round</div>
            <div className="text-4xl font-bold text-gray-900">{currentRound}</div>
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

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-blue-900">Counter-Terrorists</h3>
              <div className="text-sm text-blue-700">Loss Streak: {ctLossStreak}</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-blue-700 mb-1">Team Money</div>
                <div className="text-2xl font-bold text-blue-900">${ctTotalMoney.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-blue-700 mb-1">Buy Value</div>
                <div className="text-2xl font-bold text-blue-900">${ctTotalBuyValue.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-blue-700 mb-1">Next Loss Bonus</div>
                <div className="text-2xl font-bold text-blue-900">${ctGuaranteedBonus.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-red-900">Terrorists</h3>
              <div className="text-sm text-red-700">Loss Streak: {tLossStreak}</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-red-700 mb-1">Team Money</div>
                <div className="text-2xl font-bold text-red-900">${tTotalMoney.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-red-700 mb-1">Buy Value</div>
                <div className="text-2xl font-bold text-red-900">${tTotalBuyValue.toLocaleString()}</div>
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
