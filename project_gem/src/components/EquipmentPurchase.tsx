import { X, Trash, Wallet, Minimize } from 'lucide-react';
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
    // Note: La fonction `getAllWeapons` doit maintenant renvoyer les prix et noms.
    // Elle a été conservée de l'original.
    const weapons = getAllWeapons(player.team); 
    const availableGrenades = player.team === 'CT'
        ? GRENADES.filter(g => g.name !== 'Molotov')
        : GRENADES.filter(g => g.name !== 'Incendiary Grenade');

    const maxGrenades = 4;
    const hasMaxGrenades = playerRound.grenades.length >= maxGrenades;

    // Détermination du pistolet de départ gratuit
    const startingPistol = player.team === 'CT' ? 'USP-S' : 'Glock-18';
    
    // Fonctionnalité pour vendre tout l'équipement (sauf le pistolet de départ)
    const handleFullEco = () => {
        onUpdate({
            // On ne vend pas le pistolet de départ (il est gratuit)
            primaryWeapon: '',
            secondaryWeapon: startingPistol, 
            armor: 'none',
            grenades: [],
            hasDefuseKit: false,
            hasZeus: false,
        });
    };
    
    // Fonctionnalité pour vendre tout (pour buy plein)
    const handleFullBuy = () => {
        // Cela sert à vider les équipements précédents avant un achat complet
        // et à réinitialiser le secondaire au pistolet de départ gratuit.
        onUpdate({
            primaryWeapon: '',
            secondaryWeapon: startingPistol, 
            armor: 'none',
            grenades: [],
            hasDefuseKit: false,
            hasZeus: false,
        });
    };

    const handleGrenadeToggle = (grenadeName: string) => {
        const current = playerRound.grenades;
        if (current.includes(grenadeName)) {
            // Retirer la grenade
            onUpdate({
                grenades: current.filter(g => g !== grenadeName),
            });
        } else {
            // Ajouter la grenade, seulement si maxGrenades n'est pas atteint
            const flashbangCount = current.filter(g => g === 'Flashbang').length;
            
            // Logique de restriction : 2 flashbangs max, 4 grenades max au total
            if (grenadeName === 'Flashbang' && flashbangCount >= 2) return;
            if (current.length >= maxGrenades) return;
            
            onUpdate({
                grenades: [...current, grenadeName],
            });
        }
    };

    // Helper pour afficher le pistolet actuel
    const currentSecondaryWeapon = playerRound.secondaryWeapon || startingPistol;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {player.name || `${player.team} Player ${player.position}`} - Buy Menu
                        </h2>
                        <p className="text-sm text-gray-600 font-mono flex gap-4 mt-1">
                            <span><Wallet className="w-4 h-4 inline mr-1 text-green-600" /> Cash: **${playerRound.money.toLocaleString()}**</span>
                            <span><Minimize className="w-4 h-4 inline mr-1 text-indigo-600" /> Buy Value: **${playerRound.equipmentValue.toLocaleString()}**</span>
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
                    
                    {/* Actions Rapides */}
                    <div className="border p-4 rounded-lg bg-gray-50">
                        <h3 className="text-md font-semibold text-gray-700 mb-3">Quick Actions</h3>
                        <div className="flex gap-4">
                            <button
                                onClick={handleFullEco}
                                className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors border border-red-500 text-red-700 bg-red-100 hover:bg-red-200 flex items-center justify-center gap-2"
                            >
                                <Trash className="w-4 h-4" /> Full Eco (Vendre tout)
                            </button>
                            <button
                                onClick={handleFullBuy}
                                className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors border border-blue-500 text-blue-700 bg-blue-100 hover:bg-blue-200 flex items-center justify-center gap-2"
                            >
                                <Minimize className="w-4 h-4" /> Reset (Commencer l'achat)
                            </button>
                        </div>
                    </div>

                    {/* Armor */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Armor</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => onUpdate({ armor: 'none' })}
                                className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                                    playerRound.armor === 'none'
                                        ? 'border-gray-900 bg-gray-900 text-white shadow'
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                None ($0)
                            </button>
                            <button
                                onClick={() => onUpdate({ armor: 'vest' })}
                                className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                                    playerRound.armor === 'vest'
                                        ? 'border-gray-900 bg-gray-900 text-white shadow'
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                Vest (${ARMOR_PRICES.vest})
                            </button>
                            <button
                                onClick={() => onUpdate({ armor: 'helmet' })}
                                className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                                    playerRound.armor === 'helmet'
                                        ? 'border-gray-900 bg-gray-900 text-white shadow'
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                Vest + Helmet (${ARMOR_PRICES.helmet})
                            </button>
                        </div>
                    </div>

                    {/* Primary Weapon */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Primary Weapon</h3>
                        <select
                            value={playerRound.primaryWeapon}
                            onChange={(e) => onUpdate({ primaryWeapon: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        >
                            <option value="">None</option>
                            {weapons
                                .filter(w => w.type === 'Rifle' || w.type === 'Sniper' || w.type === 'SMG' || w.type === 'Heavy') // Filtre les armes principales
                                .map((weapon) => (
                                    <option key={weapon.name} value={weapon.name}>
                                        {weapon.name} (${weapon.price.toLocaleString()})
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* Secondary Weapon */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            Secondary Weapon (Pistols) - Current: **{currentSecondaryWeapon}**
                        </h3>
                        <select
                            value={
                                currentSecondaryWeapon === startingPistol ? startingPistol : currentSecondaryWeapon // Pour gérer l'affichage
                            }
                            onChange={(e) => onUpdate({ secondaryWeapon: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        >
                            <option value={startingPistol}>{startingPistol} (Free)</option>
                            {weapons
                                .filter(w => w.type === 'Pistol' && w.price > 0) // Filtre les pistolets payants
                                .map((weapon) => (
                                    <option key={weapon.name} value={weapon.name}>
                                        {weapon.name} (${weapon.price.toLocaleString()})
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* Grenades */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            Grenades (Currently {playerRound.grenades.length} / {maxGrenades})
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {availableGrenades.map((grenade) => {
                                const isSelected = playerRound.grenades.includes(grenade.name);
                                const isFlashbang = grenade.name === 'Flashbang';
                                const flashCount = playerRound.grenades.filter(g => g === 'Flashbang').length;
                                
                                const isAvailable = isSelected || (
                                    playerRound.grenades.length < maxGrenades &&
                                    (!isFlashbang || flashCount < 2)
                                );

                                return (
                                    <label
                                        key={grenade.name}
                                        className={`flex items-center gap-3 px-4 py-3 border-2 rounded-lg cursor-pointer transition-colors ${
                                            isSelected
                                                ? 'border-green-600 bg-green-50'
                                                : 'border-gray-300 hover:border-gray-400'
                                        } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleGrenadeToggle(grenade.name)}
                                            disabled={!isAvailable && !isSelected}
                                            className="w-5 h-5 text-green-600"
                                        />
                                        <span className="flex-1">
                                            {grenade.name} (${grenade.price})
                                            {isFlashbang && ` (${flashCount}/2)`}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Utility */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Defuse Kit (CT only) */}
                        {player.team === 'CT' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Defuse Kit</h3>
                                <label className={`flex items-center gap-3 px-4 py-3 border-2 rounded-lg cursor-pointer transition-colors ${
                                    playerRound.hasDefuseKit ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
                                }`}>
                                    <input
                                        type="checkbox"
                                        checked={playerRound.hasDefuseKit}
                                        onChange={(e) => onUpdate({ hasDefuseKit: e.target.checked })}
                                        className="w-5 h-5 text-indigo-600"
                                    />
                                    <span>Defuse Kit (${EQUIPMENT_PRICES.defuseKit})</span>
                                </label>
                            </div>
                        )}
                        
                        {/* Zeus */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Zeus x27</h3>
                            <label className={`flex items-center gap-3 px-4 py-3 border-2 rounded-lg cursor-pointer transition-colors ${
                                playerRound.hasZeus ? 'border-yellow-600 bg-yellow-50' : 'border-gray-300 hover:border-gray-400'
                            }`}>
                                <input
                                    type="checkbox"
                                    checked={playerRound.hasZeus}
                                    onChange={(e) => onUpdate({ hasZeus: e.target.checked })}
                                    className="w-5 h-5 text-yellow-600"
                                />
                                <span>Zeus x27 (${EQUIPMENT_PRICES.zeus})</span>
                            </label>
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-md"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}