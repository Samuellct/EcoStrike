import { X } from 'lucide-react';
import { Player, PlayerRound, Team } from '../types';
import {
  getAllWeapons,
  GRENADES,
  ARMOR_PRICES,
  EQUIPMENT_PRICES,
} from '../data/cs2Equipment';

interface EquipmentPurchaseProps {
  player: Player;
  playerRound: PlayerRound;
  onUpdate: (updates: Partial<PlayerRound>) => void;
  onClose: () => void;
}

export function EquipmentPurchase({
  player,
  playerRound,
  onUpdate,
  onClose,
}: EquipmentPurchaseProps) {
  const weapons = getAllWeapons(player.team);
  const availableGrenades = player.team === 'CT'
    ? GRENADES.filter(g => g.name !== 'Molotov')
    : GRENADES.filter(g => g.name !== 'Incendiary Grenade');

  const maxGrenades = 4;
  const hasMaxGrenades = playerRound.grenades.length >= maxGrenades;

  const handleGrenadeToggle = (grenadeName: string) => {
    const current = playerRound.grenades;
    if (current.includes(grenadeName)) {
      onUpdate({
        grenades: current.filter(g => g !== grenadeName),
      });
    } else if (!hasMaxGrenades) {
      onUpdate({
        grenades: [...current, grenadeName],
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {player.name || `${player.team} Player ${player.position}`}
            </h2>
            <p className="text-sm text-gray-600">
              Available: ${playerRound.money.toLocaleString()} | Buy Value: ${playerRound.buyValue.toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Armor</h3>
            <div className="flex gap-3">
              <button
                onClick={() => onUpdate({ armor: 'none' })}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  playerRound.armor === 'none'
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                None ($0)
              </button>
              <button
                onClick={() => onUpdate({ armor: 'vest' })}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  playerRound.armor === 'vest'
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                Vest (${ARMOR_PRICES.vest})
              </button>
              <button
                onClick={() => onUpdate({ armor: 'helmet' })}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  playerRound.armor === 'helmet'
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                Vest + Helmet (${ARMOR_PRICES.helmet})
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Primary Weapon</h3>
            <select
              value={playerRound.primaryWeapon}
              onChange={(e) => onUpdate({ primaryWeapon: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="">None</option>
              {weapons.map((weapon) => (
                <option key={weapon.name} value={weapon.name}>
                  {weapon.name} (${weapon.price})
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Secondary Weapon (excluding free starting pistols)
            </h3>
            <select
              value={playerRound.secondaryWeapon}
              onChange={(e) => onUpdate({ secondaryWeapon: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="">None</option>
              {weapons
                .filter(w => w.price > 0)
                .map((weapon) => (
                  <option key={weapon.name} value={weapon.name}>
                    {weapon.name} (${weapon.price})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Grenades (Max {maxGrenades})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {availableGrenades.map((grenade) => (
                <label
                  key={grenade.name}
                  className={`flex items-center gap-3 px-4 py-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    playerRound.grenades.includes(grenade.name)
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-300 hover:border-gray-400'
                  } ${hasMaxGrenades && !playerRound.grenades.includes(grenade.name) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={playerRound.grenades.includes(grenade.name)}
                    onChange={() => handleGrenadeToggle(grenade.name)}
                    disabled={hasMaxGrenades && !playerRound.grenades.includes(grenade.name)}
                    className="w-5 h-5"
                  />
                  <span className="flex-1">
                    {grenade.name} (${grenade.price})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {player.team === 'CT' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Equipment</h3>
              <label className="flex items-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                <input
                  type="checkbox"
                  checked={playerRound.hasDefuseKit}
                  onChange={(e) => onUpdate({ hasDefuseKit: e.target.checked })}
                  className="w-5 h-5"
                />
                <span>Defuse Kit (${EQUIPMENT_PRICES.defuseKit})</span>
              </label>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Zeus x27</h3>
            <label className="flex items-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
              <input
                type="checkbox"
                checked={playerRound.hasZeus}
                onChange={(e) => onUpdate({ hasZeus: e.target.checked })}
                className="w-5 h-5"
              />
              <span>Zeus x27 (${EQUIPMENT_PRICES.zeus})</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
