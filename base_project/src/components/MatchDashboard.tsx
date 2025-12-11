import { Clock, Settings } from 'lucide-react';
import { MatchState } from '../types';

interface MatchDashboardProps {
  matchState: MatchState;
  onShowConfig: () => void;
}

export function MatchDashboard({ matchState, onShowConfig }: MatchDashboardProps) {
  const ctPlayers = matchState.players.filter(p => p.team === 'CT');
  const tPlayers = matchState.players.filter(p => p.team === 'T');

  const ctTotalMoney = ctPlayers.reduce((sum, p) => {
    return sum + (matchState.playerRounds[p.id]?.money || 0);
  }, 0);

  const tTotalMoney = tPlayers.reduce((sum, p) => {
    return sum + (matchState.playerRounds[p.id]?.money || 0);
  }, 0);

  const ctTotalBuyValue = ctPlayers.reduce((sum, p) => {
    return sum + (matchState.playerRounds[p.id]?.buyValue || 0);
  }, 0);

  const tTotalBuyValue = tPlayers.reduce((sum, p) => {
    return sum + (matchState.playerRounds[p.id]?.buyValue || 0);
  }, 0);

  // Format timer: MM:SS
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseLabel = (): string => {
    switch (matchState.gamePhase) {
      case 'freezetime':
        return 'Warm-up / Freezetime';
      case 'round':
        return 'Manche en Cours';
      case 'ended':
        return 'Fin de Manche';
      default:
        return '';
    }
  };

  const getTimerColor = (): string => {
    if (matchState.gamePhase === 'freezetime') return 'text-yellow-400';
    if (matchState.gamePhase === 'round') {
      if (matchState.timer <= 30) return 'text-red-500';
      return 'text-green-400';
    }
    return 'text-gray-400';
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              <span className="text-orange-500">Eco</span>
              <span className="text-cyan-500">Strike</span>
              <span className="text-gray-400">.gg</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {matchState.gameMode === 'competitive' ? 'Compétitif (MR12)' : 'Premier (MR12 + OT)'}
              {matchState.isOvertime && ' • OVERTIME'}
            </p>
          </div>

          {/* Timer */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock size={28} className={getTimerColor()} />
              <div className={`text-5xl font-mono font-bold ${getTimerColor()}`}>
                {formatTimer(matchState.timer)}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {getPhaseLabel()}
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-sm text-orange-600 font-medium mb-1">T</div>
              <div className="text-4xl font-bold text-orange-600">{matchState.tScore}</div>
            </div>
            <div className="text-2xl text-gray-400">-</div>
            <div className="text-center">
              <div className="text-sm text-cyan-600 font-medium mb-1">CT</div>
              <div className="text-4xl font-bold text-cyan-600">{matchState.ctScore}</div>
            </div>
          </div>
        </div>

        {/* Round History */}
        {matchState.roundHistory.length > 0 && (
          <div className="mb-6">
            <div className="text-xs text-gray-500 mb-2">Historique des Manches</div>
            <div className="flex gap-1 flex-wrap">
              {matchState.roundHistory.map((winner, idx) => (
                <div
                  key={idx}
                  className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold text-white ${
                    winner === 'T' ? 'bg-orange-500' : 'bg-cyan-500'
                  }`}
                  title={`Round ${idx + 1}: ${winner} victoire`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Stats */}
        <div className="grid grid-cols-2 gap-6">
          {/* T Team */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-orange-900">
                Terroristes
              </h3>
              <div className="text-sm text-orange-700">
                Loss Streak: {matchState.tLossStreak}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-orange-700 mb-1">Team Money</div>
                <div className="text-2xl font-bold text-orange-900">
                  ${ctTotalMoney.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-orange-700 mb-1">Buy Value</div>
                <div className="text-2xl font-bold text-orange-900">
                  ${tTotalBuyValue.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* CT Team */}
          <div className="bg-cyan-50 border-2 border-cyan-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-cyan-900">
                Anti-Terroristes
              </h3>
              <div className="text-sm text-cyan-700">
                Loss Streak: {matchState.ctLossStreak}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-cyan-700 mb-1">Team Money</div>
                <div className="text-2xl font-bold text-cyan-900">
                  ${ctTotalMoney.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-cyan-700 mb-1">Buy Value</div>
                <div className="text-2xl font-bold text-cyan-900">
                  ${ctTotalBuyValue.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}