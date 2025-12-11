import { ShoppingCart, Shield, Skull, TrendingUp } from 'lucide-react';
import { Player, PlayerRound } from '../types';
import { calculateMinimumGuaranteed } from '../utils/economicCalculations';

interface PlayerTableProps {
  players: Player[];
  playerRounds: Record<string, PlayerRound>;
  ctLossStreak: number;
  tLossStreak: number;
  onPlayerNameChange: (playerId: string, name: string) => void;
  onEquipmentClick: (playerId: string) => void;
}

export function PlayerTable({
  players,
  playerRounds,
  ctLossStreak,
  tLossStreak,
  onPlayerNameChange,
  onEquipmentClick,
}: PlayerTableProps) {
  const ctPlayers = players.filter(p => p.team === 'CT').sort((a, b) => a.position - b.position);
  const tPlayers = players.filter(p => p.team === 'T').sort((a, b) => a.position - b.position);

  const renderPlayerRow = (player: Player) => {
    const pr = playerRounds[player.id];
    if (!pr) return null;

    const lossStreak = player.team === 'CT' ? ctLossStreak : tLossStreak;
    const minGuaranteed = calculateMinimumGuaranteed(pr.money, lossStreak);

    const equipmentSummary = [];
    if (pr.armor !== 'none') {
      equipmentSummary.push(pr.armor === 'helmet' ? 'Vest+Helmet' : 'Vest');
    }
    if (pr.primaryWeapon) equipmentSummary.push(pr.primaryWeapon);
    if (pr.secondaryWeapon) equipmentSummary.push(pr.secondaryWeapon);
    if (pr.grenades.length > 0) equipmentSummary.push(`${pr.grenades.length} nades`);
    if (pr.hasDefuseKit) equipmentSummary.push('Kit');
    if (pr.hasZeus) equipmentSummary.push('Zeus');

    return (
      <tr key={player.id} className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2 py-1 rounded ${
                player.team === 'CT'
                  ? 'bg-cyan-100 text-cyan-700'
                  : 'bg-orange-100 text-orange-700'
              }`}
            >
              {player.team}
            </span>
            <input
              type="text"
              value={player.name}
              onChange={(e) => onPlayerNameChange(player.id, e.target.value)}
              placeholder={`${player.team} ${player.position}`}
              className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm w-32"
            />
          </div>
        </td>
        <td className="px-4 py-3 border-b border-gray-200">
          <div
            className={`text-lg font-bold ${
              pr.money < 0 ? 'text-red-600' : 'text-gray-900'
            }`}
          >
            ${pr.money.toLocaleString()}
          </div>
        </td>
        <td className="px-4 py-3 border-b border-gray-200">
          <div className="text-lg font-semibold text-gray-700">
            ${pr.buyValue.toLocaleString()}
          </div>
        </td>
        <td className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-600">
              ${minGuaranteed.toLocaleString()}
            </span>
          </div>
          <div className="text-xs text-gray-500">Minimum garanti</div>
        </td>
        <td className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {equipmentSummary.length > 0 ? (
              <>
                <Shield className="w-4 h-4" />
                <span className="truncate max-w-xs">
                  {equipmentSummary.join(', ')}
                </span>
              </>
            ) : (
              <span className="text-gray-400">Pas d'équipement</span>
            )}
          </div>
        </td>
        <td className="px-4 py-3 border-b border-gray-200">
          <button
            onClick={() => onEquipmentClick(player.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              player.team === 'CT'
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Acheter
          </button>
        </td>
        <td className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {pr.isAlive ? (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Vivant
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium flex items-center gap-1">
                <Skull className="w-3 h-3" />
                Mort
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
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Joueur
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Argent
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Buy Value
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Prévision
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Équipement
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Actions
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Statut
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-orange-50">
              <td colSpan={7} className="px-4 py-2">
                <div className="text-sm font-bold text-orange-900">Terroristes</div>
              </td>
            </tr>
            {tPlayers.map(renderPlayerRow)}
            <tr className="bg-cyan-50">
              <td colSpan={7} className="px-4 py-2">
                <div className="text-sm font-bold text-cyan-900">Anti-Terroristes</div>
              </td>
            </tr>
            {ctPlayers.map(renderPlayerRow)}
          </tbody>
        </table>
      </div>
    </div>
  );
}