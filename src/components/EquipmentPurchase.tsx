import { X, Gift, Ban } from 'lucide-react';
import { useState } from 'react';
import { Player, PlayerRound } from '../types';
import {
  getAllWeapons,
  PISTOLS,
  GRENADES,
  ARMOR_PRICES,
  EQUIPMENT_PRICES,
  getWeaponPrice,
  getGrenadePrice,
  STARTING_PISTOLS,
} from '../data/cs2Equipment';

interface EquipmentPurchaseProps {
  player: Player;
  playerRound: PlayerRound;
  allPlayers: Player[];
  allPlayerRounds: Record<string, PlayerRound>;
  onUpdate: (updates: Partial<PlayerRound>) => void;
  onGift: (fromPlayerId: string, toPlayerId: string, itemName: string, cost: number) => void;
  onClose: () => void;
}

function countGrenadesByType(grenades: string[]): Record<string, number> {
  return grenades.reduce((acc, grenade) => {
    acc[grenade] = (acc[grenade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export function EquipmentPurchase({
  player,
  playerRound,
  allPlayers,
  allPlayerRounds,
  onUpdate,
  onGift,
  onClose,
}: EquipmentPurchaseProps) {
  const [giftMode, setGiftMode] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');

  const availableMoney = playerRound.money;

  // Séparer les armes
  const allWeapons = getAllWeapons(player.team);
  const primaryWeapons = allWeapons.filter(w => 
    !PISTOLS.some(p => p.name === w.name) &&
    !STARTING_PISTOLS.CT.some(p => p.name === w.name) &&
    !STARTING_PISTOLS.T.some(p => p.name === w.name)
  );
  
  // ✅ CORRECTION: Bloquer le pistolet non-choisi pour les CT
  const secondaryWeapons = PISTOLS.filter(w => {
    // Filtrer par team
    if (w.team && w.team !== player.team) return false;
    
    // ✅ Si CT, bloquer le pistolet starter non-choisi
    if (player.team === 'CT') {
      if (player.startingPistol === 'USP-S' && w.name === 'P2000') return false;
      if (player.startingPistol === 'P2000' && w.name === 'USP-S') return false;
    }
    
    return true;
  });

  const availableGrenades = player.team === 'CT'
    ? GRENADES.filter(g => g.name !== 'Molotov')
    : GRENADES.filter(g => g.name !== 'Incendiary Grenade');

  const teammates = allPlayers.filter(
    p => p.team === player.team && p.id !== player.id
  );

  const currentGrenadeCount = playerRound.grenades.length;
  const grenadeCounts = countGrenadesByType(playerRound.grenades);

  const canBuyGrenade = (grenadeName: string): boolean => {
    if (giftMode) {
      const currentCount = grenadeCounts[grenadeName] || 0;
      if (grenadeName === 'Flashbang') {
        return currentCount < 2;
      }
      return currentCount < 1;
    } else {
      if (currentGrenadeCount >= 4) return false;
      const currentCount = grenadeCounts[grenadeName] || 0;
      if (grenadeName === 'Flashbang') {
        return currentCount < 2;
      }
      return currentCount < 1;
    }
  };

  const canAfford = (price: number): boolean => {
    return availableMoney >= price;
  };

  const handleGrenadeToggle = (grenadeName: string) => {
    const current = playerRound.grenades;
    const price = getGrenadePrice(grenadeName);

    if (current.includes(grenadeName)) {
      const index = current.lastIndexOf(grenadeName);
      const newGrenades = [...current.slice(0, index), ...current.slice(index + 1)];
      onUpdate({ grenades: newGrenades });
    } else if (canBuyGrenade(grenadeName) && canAfford(price)) {
      onUpdate({ grenades: [...current, grenadeName] });
    }
  };

  const handleGiftWeapon = (weaponName: string) => {
    if (!selectedRecipient || !weaponName) return;

    const cost = getWeaponPrice(weaponName);
    
    if (!canAfford(cost)) {
      alert('Pas assez d\'argent pour offrir cet équipement!');
      return;
    }

    onGift(player.id, selectedRecipient, weaponName, cost);

    const recipientName = allPlayers.find(p => p.id === selectedRecipient)?.name || 'teammate';
    alert(`${weaponName} offert à ${recipientName}!`);
  };

  const handleGiftGrenade = (grenadeName: string) => {
    if (!selectedRecipient) return;

    const recipientRound = allPlayerRounds[selectedRecipient];
    const recipientGrenades = countGrenadesByType(recipientRound.grenades);
    const recipientCount = recipientGrenades[grenadeName] || 0;

    if (grenadeName === 'Flashbang' && recipientCount >= 2) {
      alert('Le coéquipier a déjà 2 Flashbangs!');
      return;
    }
    if (grenadeName !== 'Flashbang' && recipientCount >= 1) {
      alert(`Le coéquipier a déjà une ${grenadeName}!`);
      return;
    }

    const cost = getGrenadePrice(grenadeName);
    
    if (!canAfford(cost)) {
      alert('Pas assez d\'argent pour offrir cette grenade!');
      return;
    }

    onGift(player.id, selectedRecipient, grenadeName, cost);

    const recipientName = allPlayers.find(p => p.id === selectedRecipient)?.name || 'teammate';
    alert(`${grenadeName} offerte à ${recipientName}!`);
  };

  const getGrenadeLabel = (grenadeName: string): string => {
    const count = grenadeCounts[grenadeName] || 0;
    if (count === 0) return '';
    
    const max = grenadeName === 'Flashbang' ? 2 : 1;
    if (count >= max) {
      return '(Max)';
    }
    return `(${count})`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {player.name || `${player.team} Player ${player.position}`}
              </h2>
              <p className="text-sm text-gray-600">
                Disponible: <span className={`font-bold text-lg ${availableMoney < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${availableMoney.toLocaleString()}
                </span> | 
                Buy Value: <span className="font-semibold">${playerRound.buyValue.toLocaleString()}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setGiftMode(!giftMode)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                giftMode
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Gift className="w-4 h-4" />
              {giftMode ? 'Mode Cadeau Activé' : 'Activer Mode Cadeau'}
            </button>

            {giftMode && (
              <select
                value={selectedRecipient}
                onChange={(e) => setSelectedRecipient(e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Sélectionner un coéquipier...</option>
                {teammates.map(teammate => (
                  <option key={teammate.id} value={teammate.id}>
                    {teammate.name || `${teammate.team} ${teammate.position}`} ($
                    {allPlayerRounds[teammate.id]?.money.toLocaleString()})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {!giftMode && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                Armure
                <span className="text-xs text-gray-500">(Non offrable)</span>
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={() => onUpdate({ armor: 'none' })}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    playerRound.armor === 'none'
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Aucune ($0)
                </button>
                <button
                  onClick={() => onUpdate({ armor: 'vest' })}
                  disabled={!canAfford(ARMOR_PRICES.vest)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    playerRound.armor === 'vest'
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : canAfford(ARMOR_PRICES.vest)
                      ? 'border-gray-300 hover:border-gray-400'
                      : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Gilet (${ARMOR_PRICES.vest})
                  {!canAfford(ARMOR_PRICES.vest) && <Ban className="inline w-4 h-4 ml-1" />}
                </button>
                <button
                  onClick={() => onUpdate({ armor: 'helmet' })}
                  disabled={!canAfford(ARMOR_PRICES.helmet)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    playerRound.armor === 'helmet'
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : canAfford(ARMOR_PRICES.helmet)
                      ? 'border-gray-300 hover:border-gray-400'
                      : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Gilet + Casque (${ARMOR_PRICES.helmet})
                  {!canAfford(ARMOR_PRICES.helmet) && <Ban className="inline w-4 h-4 ml-1" />}
                </button>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Arme Principale {giftMode && <span className="text-purple-600 text-sm">(Offrable)</span>}
            </h3>
            <select
              value={giftMode ? '' : playerRound.primaryWeapon}
              onChange={(e) => {
                if (giftMode && selectedRecipient) {
                  handleGiftWeapon(e.target.value);
                } else if (!giftMode) {
                  onUpdate({ primaryWeapon: e.target.value });
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="">{giftMode ? 'Choisir une arme à offrir...' : 'Aucune'}</option>
              {primaryWeapons.map((weapon) => {
                const affordable = canAfford(weapon.price);
                return (
                  <option 
                    key={weapon.name} 
                    value={weapon.name}
                    disabled={!giftMode && !affordable}
                    className={!affordable && !giftMode ? 'text-gray-400' : ''}
                  >
                    {weapon.name} (${weapon.price}) {!affordable && !giftMode ? '❌' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Arme Secondaire (Pistolets) {giftMode && <span className="text-purple-600 text-sm">(Offrable)</span>}
            </h3>
            <select
              value={giftMode ? '' : playerRound.secondaryWeapon}
              onChange={(e) => {
                if (giftMode && selectedRecipient) {
                  handleGiftWeapon(e.target.value);
                } else if (!giftMode) {
                  onUpdate({ secondaryWeapon: e.target.value });
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="">{giftMode ? 'Choisir un pistolet à offrir...' : 'Aucun'}</option>
              {secondaryWeapons.map((weapon) => {
                const affordable = canAfford(weapon.price);
                return (
                  <option 
                    key={weapon.name} 
                    value={weapon.name}
                    disabled={!giftMode && !affordable}
                    className={!affordable && !giftMode ? 'text-gray-400' : ''}
                  >
                    {weapon.name} (${weapon.price}) {!affordable && !giftMode ? '❌' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Grenades {!giftMode && `(${currentGrenadeCount}/4)`}
              {giftMode && <span className="text-purple-600 text-sm ml-2">(Offrables)</span>}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {availableGrenades.map((grenade) => {
                const price = grenade.price;
                const affordable = canAfford(price);
                const canBuy = canBuyGrenade(grenade.name);
                const isDisabled = !canBuy || (!giftMode && !affordable);
                const label = getGrenadeLabel(grenade.name);

                return (
                  <button
                    key={grenade.name}
                    onClick={() => {
                      if (giftMode && selectedRecipient) {
                        handleGiftGrenade(grenade.name);
                      } else if (!giftMode) {
                        handleGrenadeToggle(grenade.name);
                      }
                    }}
                    disabled={isDisabled && !giftMode}
                    className={`flex items-center justify-between px-4 py-3 border-2 rounded-lg transition-colors ${
                      giftMode
                        ? 'border-purple-300 bg-purple-50 hover:bg-purple-100'
                        : isDisabled
                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        : playerRound.grenades.includes(grenade.name)
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-300 hover:border-gray-400 cursor-pointer'
                    }`}
                  >
                    <span className="flex-1 text-left">
                      {grenade.name} (${price})
                      {!giftMode && !affordable && <Ban className="inline w-4 h-4 ml-1" />}
                      {giftMode && <Gift className="inline w-4 h-4 ml-2" />}
                    </span>
                    {label && (
                      <span className="text-xs font-semibold text-gray-600 ml-2">
                        {label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {player.team === 'CT' && !giftMode && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                Équipement
                <span className="text-xs text-gray-500">(Non offrable)</span>
              </h3>
              <button
                onClick={() => onUpdate({ hasDefuseKit: !playerRound.hasDefuseKit })}
                disabled={!canAfford(EQUIPMENT_PRICES.defuseKit)}
                className={`w-full flex items-center justify-between px-4 py-3 border-2 rounded-lg transition-colors ${
                  playerRound.hasDefuseKit
                    ? 'border-gray-900 bg-gray-50'
                    : canAfford(EQUIPMENT_PRICES.defuseKit)
                    ? 'border-gray-300 hover:border-gray-400 cursor-pointer'
                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>
                  Kit de Désamorçage (${EQUIPMENT_PRICES.defuseKit})
                  {!canAfford(EQUIPMENT_PRICES.defuseKit) && <Ban className="inline w-4 h-4 ml-1" />}
                </span>
              </button>
            </div>
          )}

          {!giftMode && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Zeus x27</h3>
              <button
                onClick={() => onUpdate({ hasZeus: !playerRound.hasZeus })}
                disabled={!canAfford(EQUIPMENT_PRICES.zeus)}
                className={`w-full flex items-center justify-between px-4 py-3 border-2 rounded-lg transition-colors ${
                  playerRound.hasZeus
                    ? 'border-gray-900 bg-gray-50'
                    : canAfford(EQUIPMENT_PRICES.zeus)
                    ? 'border-gray-300 hover:border-gray-400 cursor-pointer'
                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>
                  Zeus x27 (${EQUIPMENT_PRICES.zeus})
                  {!canAfford(EQUIPMENT_PRICES.zeus) && <Ban className="inline w-4 h-4 ml-1" />}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}