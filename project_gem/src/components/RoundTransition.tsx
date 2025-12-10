import { X, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Player, PlayerRound, RoundResult, Team } from '../types';

interface RoundTransitionProps {
  players: Player[];
  playerRounds: Record<string, PlayerRound>;
  onNextRound: (result: RoundResult, survivorIds: string[]) => void;
  onClose: () => void;
  onUpdatePlayerAlive: (playerId: string, isAlive: boolean) => void;
}

export function RoundTransition({
  players,
  playerRounds,
  onNextRound,
  onClose,
  onUpdatePlayerAlive,
}: RoundTransitionProps) {
  const [winner, setWinner] = useState<Team>('CT');
  const [winType, setWinType] = useState<'elimination' | 'objective' | 'time'>('elimination');
  const [bombPlanted, setBombPlanted] = useState(false);

  const handleSubmit = () => {
    const survivorIds = players
      .filter(p => playerRounds[p.id]?.isAlive)
      .map(p => p.id);

    onNextRound(
      {
        winner,
        winType,
        bombPlanted,
      },
      survivorIds
    );
  };

  const ctPlayers = players.filter(p => p.team === 'CT').sort((a, b) => a.position - b.position);
  const tPlayers = players.filter(p => p.team === 'T').sort((a, b) => a.position - b.position);

  const renderPlayerStatus = (player: Player) => {
    const pr = playerRounds[player.id];
    if (!pr) return null;

    return (
      <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2 py-1 rounded ${
            player.team === 'CT' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
          }`}>
            {player.team}
          </span>
          <span className="font-medium text-gray-900">
            {player.name || `${player.team} Player ${player.position}`}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onUpdatePlayerAlive(player.id, true)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              pr.isAlive
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Alive
          </button>
          <button
            onClick={() => onUpdatePlayerAlive(player.id, false)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              !pr.isAlive
                ? 'bg-gray-700 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <XCircle className="w-4 h-4" />
            Dead
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Round Transition</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Round Winner</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setWinner('CT')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                    winner === 'CT'
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Counter-Terrorists
                </button>
                <button
                  onClick={() => setWinner('T')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                    winner === 'T'
                      ? 'border-red-600 bg-red-600 text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Terrorists
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Win Type</h3>
              <select
                value={winType}
                onChange={(e) => setWinType(e.target.value as 'elimination' | 'objective' | 'time')}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="elimination">Elimination</option>
                <option value="objective">Bomb Objective (Plant/Defuse)</option>
                <option value="time">Time Expiration</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={bombPlanted}
                onChange={(e) => setBombPlanted(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="font-medium text-gray-900">Bomb was planted this round</span>
            </label>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Player Survival Status</h3>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Counter-Terrorists</h4>
              <div className="space-y-2">
                {ctPlayers.map(renderPlayerStatus)}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-red-900 mb-2">Terrorists</h4>
              <div className="space-y-2">
                {tPlayers.map(renderPlayerStatus)}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Next Round
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
