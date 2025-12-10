import { ShoppingCart, Shield, Skull } from 'lucide-react';
import { Player, PlayerRound } from '../types';

interface PlayerTableProps {
  players: Player[];
  playerRounds: Record<string, PlayerRound>;
  onPlayerNameChange: (playerId: string, name: string) => void;
  onEquipmentClick: (playerId: string) => void;
}

export function PlayerTable({
  players,
  playerRounds,
  onPlayerNameChange,
  onEquipmentClick,
}: PlayerTableProps) {
  const ctPlayers = players.filter(p => p.team === 'CT').sort((a, b) => a.position - b.position);
  const tPlayers = players.filter(p => p.team === 'T').sort((a, b) => a.position - b.position);

  const renderPlayerRow = (player: Player) => {
    const pr = playerRounds[player.id];
    if (!pr) return null;

    const equipmentSummary = [];
    if (pr.armor !== 'none') equipmentSummary.push(pr.armor === 'helmet' ? 'Vest+Helmet' : 'Vest');
    if (pr.primaryWeapon) equipmentSummary.push(pr.primaryWeapon);
    if (pr.secondaryWeapon) equipmentSummary.push(pr.secondaryWeapon);
    if (pr.grenades.length > 0) equipmentSummary.push(`${pr.grenades.length} nades`);
    if (pr.hasDefuseKit) equipmentSummary.push('Kit');
    if (pr.hasZeus) equipmentSummary.push('Zeus');

    const teamColor = player.team === 'CT' ? 'blue' : 'red';

    return (
      <tr key={player.id} className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${player.team === 'CT' ? 'text-blue-600' : 'text-red-600'}`}>
              {player.team}
            </span>
            <input
              type="text"
              value={player.name}
              onChange={(e) => onPlayerNameChange(player.id, e.target.value)}
              placeholder={`${player.team} Player ${player.position}`}
              className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
            />
          </div>
        </td>
        <td className="px-4 py-3 border-b border-gray-200">
          <div className={`text-lg font-bold ${pr.money < 0 ? 'text-red-600' : 'text-gray-900'}`}>
            ${pr.money.toLocaleString()}
          </div>
        </td>
        <td className="px-4 py-3 border-b border-gray-200">
          <div className="text-lg font-semibold text-gray-700">
            ${pr.buyValue.toLocaleString()}
          </div>
        </td>
        <td className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {equipmentSummary.length > 0 ? (
              <>
                <Shield className="w-4 h-4" />
                <span>{equipmentSummary.join(', ')}</span>
              </>
            ) : (
              <span className="text-gray-400">No equipment</span>
            )}
          </div>
        </td>
        <td className="px-4 py-3 border-b border-gray-200">
          <button
            onClick={() => onEquipmentClick(player.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              player.team === 'CT'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Buy
          </button>
        </td>
        <td className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {pr.isAlive ? (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Alive
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium flex items-center gap-1">
                <Skull className="w-3 h-3" />
                Dead
              </span>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Player</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Money</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Buy Value</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Equipment</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-blue-50">
              <td colSpan={6} className="px-4 py-2">
                <div className="text-sm font-bold text-blue-900">Counter-Terrorists</div>
              </td>
            </tr>
            {ctPlayers.map(renderPlayerRow)}
            <tr className="bg-red-50">
              <td colSpan={6} className="px-4 py-2">
                <div className="text-sm font-bold text-red-900">Terrorists</div>
              </td>
            </tr>
            {tPlayers.map(renderPlayerRow)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
