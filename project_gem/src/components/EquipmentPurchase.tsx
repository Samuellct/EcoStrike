// src/components/EquipmentPurchase.tsx

import { X, RefreshCw } from 'lucide-react'; // 'HandHolding' corrigé ou retiré
import { Player, PlayerRoundState, GameItem } from '../types/index';  // Import de GameItem
import { useMatchState } from '../state/MatchContext';
import { 
    getBuyableItemsForTeam,
    getItemById,
    ARMOR_ITEM_IDS, // Import nécessaire
    EQUIPMENT_PRICES, // Import nécessaire
    GameItemType, // Import nécessaire
    ALL_WEAPONS, // Retiré car non utilisé directement
} from '../data/cs2Equipment'; 


interface EquipmentPurchaseProps {
    player: Player;
    playerRoundState: PlayerRoundState;
    onClose: () => void;
}

// Fonction utilitaire pour vérifier si un type d'item est déjà présent dans l'inventaire
// Gardé ici, mais vous pouvez le supprimer si le Reducer gère toutes les règles.
const hasItemOfType = (inventory: GameItem[], type: GameItemType, excludeId?: string) => {
    return inventory.some(item => item.type === type && (!excludeId || item.id !== excludeId));
};

export function EquipmentPurchase({
    player,
    playerRoundState,
    onClose,
}: EquipmentPurchaseProps) {
    const { dispatch } = useMatchState();
    const { money, inventory, buyValue } = playerRoundState; // Ajout de buyValue
    const team = player.team;

    const buyableItems = getBuyableItemsForTeam(team);
    
    const maxGrenadesCount = 4; 
    const currentGrenadesCount = inventory.filter(item => item.type === 'Grenade').length;
    const isGrenadeFull = currentGrenadesCount >= maxGrenadesCount;

    // --- LOGIQUE D'ACHAT ---

    const handlePurchase = (item: GameItem) => {
        dispatch({
            type: 'BUY_EQUIPMENT',
            payload: {
                playerId: player.id,
                itemBoughtId: item.id,
                // recipientId est requis par le type PurchaseInput, même si c'est vide pour l'instant.
                // Le Reducer devrait gérer le fait qu'on achète pour soi-même.
                recipientId: player.id, 
            },
        });
    };

    const handleResetBuy = () => {
        dispatch({ 
            type: 'RESET_BUY', 
            payload: { playerId: player.id } 
        });
    };
    
    // --- GESTION DES ARMES ET ARMURES ---
    
    const renderArmorButtons = () => {
        // Correction de 'armorId' implicitement 'any'
        return ARMOR_ITEM_IDS.map((armorId: string) => { 
            const item = getItemById(armorId) as GameItem;
            if (!item) return null;

            const isSelected = inventory.some(i => i.id === armorId);
            const canBuy = money >= item.price;

            let buttonAction;
            let buttonText = item.name;
            let buttonClass = '';

            if (isSelected) {
                // Pour l'armure, la re-sélection agit comme une vente/retrait simple.
                buttonAction = () => { 
                    dispatch({ 
                        type: 'SELL_EQUIPMENT', 
                        payload: { playerId: player.id, itemId: item.id } 
                    });
                };
                buttonClass = 'border-gray-900 bg-gray-900 text-white';
            } else if (canBuy) {
                buttonAction = () => handlePurchase(item);
                buttonText += ` ($${item.price})`;
                buttonClass = 'border-gray-300 hover:border-gray-400';
            } else {
                buttonAction = () => {};
                buttonText += ` (Need $${item.price})`;
                buttonClass = 'border-gray-300 opacity-50 cursor-not-allowed';
            }

            return (
                <button
                    key={item.id}
                    onClick={buttonAction}
                    disabled={!canBuy && !isSelected}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${buttonClass}`}
                >
                    {buttonText}
                </button>
            );
        });
    };

    // La logique de sélection d'arme est simplifiée pour appeler handlePurchase ou SELL_EQUIPMENT
    const renderWeaponSelect = (type: GameItemType) => {
        const currentWeapon = inventory.find(item => item.type === type);
        const availableWeapons = buyableItems.filter(item => item.type === type);
        
        const handleSellCurrent = () => { 
            if (currentWeapon) {
                dispatch({ 
                    type: 'SELL_EQUIPMENT', 
                    payload: { playerId: player.id, itemId: currentWeapon.id } 
                });
            }
        };

        return (
            <div className="flex flex-col gap-2">
                <select
                    value={currentWeapon?.id || ''}
                    onChange={(e) => {
                        const newId = e.target.value;
                        if (newId) {
                            const item = getItemById(newId) as GameItem;
                            handlePurchase(item);
                        } else {
                            handleSellCurrent();
                        }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                    <option value="">{currentWeapon ? `Current: ${currentWeapon.name} (Click to sell)` : 'None'}</option>
                    {availableWeapons.map((weapon) => {
                        const canAfford = money >= weapon.price;
                        return (
                            <option 
                                key={weapon.id} 
                                value={weapon.id}
                                // L'option n'est désactivée que s'il s'agit d'une nouvelle arme (différente de l'actuelle) et qu'il n'a pas les fonds.
                                disabled={!canAfford && weapon.id !== currentWeapon?.id}
                            >
                                {weapon.name} (${weapon.price}) {canAfford ? '' : '(N/A)'}
                            </option>
                        );
                    })}
                </select>
                {currentWeapon && currentWeapon.id !== player.defaultPistol.toLowerCase() && (
                    <button onClick={handleSellCurrent} className="text-xs text-red-600 hover:text-red-700 underline self-start">
                        Vendre {currentWeapon.name} (50% Remboursement)
                    </button>
                )}
            </div>
        );
    };


    const renderGrenadeButtons = () => {
        return buyableItems
            .filter(item => item.type === 'Grenade')
            .filter(item => team === 'CT' ? item.id !== 'molotov' : item.id !== 'incendiarygrenade')
            .map(item => {
                const isSelected = inventory.some(i => i.id === item.id);
                const canBuy = money >= item.price;
                
                const isDisabled = !isSelected && (!canBuy || isGrenadeFull);

                let buttonAction;
                let buttonText = item.name;
                let buttonClass = '';

                if (isSelected) {
                    buttonAction = () => { 
                        dispatch({ 
                            type: 'SELL_EQUIPMENT', 
                            payload: { playerId: player.id, itemId: item.id } 
                        });
                    };
                    buttonClass = 'border-gray-900 bg-gray-900 text-white';
                } else {
                    buttonAction = () => handlePurchase(item);
                    buttonText += ` ($${item.price})`;
                    buttonClass = isDisabled ? 
                        'border-gray-300 opacity-50 cursor-not-allowed' : 
                        'border-gray-300 hover:border-gray-400';
                }

                return (
                    <button
                        key={item.id}
                        onClick={buttonAction}
                        disabled={isDisabled && !isSelected}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${buttonClass}`}
                    >
                        {buttonText}
                    </button>
                );
            });
    };

    // --- RENDER PRINCIPAL ---

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Achat d'Équipement pour {player.name || `${player.team} Player ${player.position}`}
                        </h2>
                        <p className="text-sm text-gray-600">
                            Argent disponible: ${money.toLocaleString()} | Buy Value: ${buyValue.toLocaleString()}
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
                    {/* RESET BUY */}
                    <button 
                        onClick={handleResetBuy}
                        className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Vendre tout et Reset Buy (50% remb.)
                    </button>
                    
                    {/* ARMOR */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Armure</h3>
                        <div className="flex gap-3">
                            {renderArmorButtons()}
                        </div>
                    </div>

                    {/* PRIMARY WEAPON */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Arme Principale</h3>
                        {renderWeaponSelect('Rifle')}
                    </div>

                    {/* SECONDARY WEAPON */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Arme Secondaire (Pistolet)</h3>
                        {renderWeaponSelect('Pistol')}
                    </div>

                    {/* GRENADES */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            Grenades (Max {maxGrenadesCount}, Actuel: {currentGrenadesCount})
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {renderGrenadeButtons()}
                        </div>
                    </div>

                    {/* EQUIPMENT (Defuse Kit) */}
                    {team === 'CT' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Defuse Kit</h3>
                            <button
                                onClick={() => handlePurchase(getItemById('defusekit') as GameItem)}
                                disabled={inventory.some(i => i.id === 'defusekit') || money < EQUIPMENT_PRICES.defuseKit}
                                className="px-4 py-2 rounded-lg border-2 transition-colors border-gray-300 hover:border-gray-400 disabled:opacity-50"
                            >
                                {inventory.some(i => i.id === 'defusekit') 
                                    ? "Defuse Kit Acquis" 
                                    : `Acheter Defuse Kit ($${EQUIPMENT_PRICES.defuseKit})`}
                            </button>
                        </div>
                    )}

                    {/* ZEUS */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Zeus x27</h3>
                        <button
                            onClick={() => handlePurchase(getItemById('zeus') as GameItem)}
                            disabled={inventory.some(i => i.id === 'zeus') || money < EQUIPMENT_PRICES.zeus}
                            className="px-4 py-2 rounded-lg border-2 transition-colors border-gray-300 hover:border-gray-400 disabled:opacity-50"
                        >
                            {inventory.some(i => i.id === 'zeus') 
                                ? "Zeus Acquis" 
                                : `Acheter Zeus ($${EQUIPMENT_PRICES.zeus})`}
                        </button>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                        >
                            Fermer Achat
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}