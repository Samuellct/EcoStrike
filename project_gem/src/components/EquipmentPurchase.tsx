// src/components/EquipmentPurchase.tsx

import { X, RefreshCw, HandHolding } from 'lucide-react';
import { Player, PlayerRoundState, GameItem } from '../types';
import { useMatchState } from '../state/MatchContext';
import { 
    getBuyableItemsForTeam,
    getItemById,
    ARMOR_ITEM_IDS,
    ALL_WEAPONS,
    GRENADES,
    EQUIPMENT_PRICES,
    GameItemType,
} from '../data/cs2Equipment';

// Interface pour le composant (simplifiée après l'intégration du Reducer)
interface EquipmentPurchaseProps {
    player: Player;
    playerRoundState: PlayerRoundState; // Nouveau nom de prop
    onClose: () => void;
}

// Fonction utilitaire pour vérifier si un type d'item est déjà présent dans l'inventaire
const hasItemOfType = (inventory: GameItem[], type: GameItemType, excludeId?: string) => {
    return inventory.some(item => item.type === type && (!excludeId || item.id !== excludeId));
};

export function EquipmentPurchase({
    player,
    playerRoundState,
    onClose,
}: EquipmentPurchaseProps) {
    const { dispatch } = useMatchState();
    const { money, inventory } = playerRoundState;
    const team = player.team;

    // Items de base pour l'achat
    const buyableItems = getBuyableItemsForTeam(team);
    
    // Simplification pour l'affichage des grenades (max 4, dont 1 flash, 1 utilitaire, 1 HE, 1 déco/molly)
    // Notre logique de Reducer gère simplement l'ajout/suppression, sans les règles complexes de max par type.
    // Nous conservons donc la règle de 'max 4 grenades' pour le UI.
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
            },
        });
    };

    const handleResetBuy = () => {
        // ACTION: Vider l'inventaire (sauf le pistolet de départ) et rembourser 50% de la Buy Value
        // NOTE: Cette logique doit être ajoutée au Reducer sous une nouvelle action (e.g., 'RESET_BUY').
        // Pour l'instant, nous faisons un simple console.log, car elle n'était pas dans matchReducer.ts.
        console.warn(`ACTION REQUIRED: Implement 'RESET_BUY' in matchReducer.ts.`);
        
        // Simuler un achat de rien après avoir vidé l'inventaire pour forcer le recalcul
        // C'est une simplification TEMPORAIRE. La vraie action doit être atomique (une seule action RESET_BUY)
        // dispatch({ type: 'RESET_BUY', payload: { playerId: player.id } });
    };
    
    // --- GESTION DES ARMES ET ARMURES ---
    
    const renderArmorButtons = () => {
        return ARMOR_ITEM_IDS.map(armorId => {
            const item = getItemById(armorId) as GameItem;
            const isSelected = inventory.some(i => i.id === armorId);
            const canBuy = money >= item.price;

            let buttonAction;
            let buttonText = item.name;
            let buttonClass = '';

            if (isSelected) {
                // Si sélectionné, l'action est de le vendre (Reset Buy partiel non géré par BUY_EQUIPMENT)
                // Pour l'instant, on suppose qu'on annule tout pour cet item.
                buttonAction = () => { /* Logique de Vente ou Reset partielle complexe */ console.log(`Sell/Reset ${item.name}`); };
                buttonClass = 'border-gray-900 bg-gray-900 text-white';
            } else if (canBuy) {
                // S'il peut l'acheter
                buttonAction = () => handlePurchase(item);
                buttonText += ` ($${item.price})`;
                buttonClass = 'border-gray-300 hover:border-gray-400';
            } else {
                // S'il n'a pas l'argent
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

    const renderWeaponSelect = (type: GameItemType) => {
        const currentWeapon = inventory.find(item => item.type === type);
        const availableWeapons = buyableItems.filter(item => item.type === type);
        
        // Option pour vendre l'arme actuelle (simplification)
        const handleSellCurrent = () => { /* Logique de Vente ou Reset partielle complexe */ console.log(`Sell ${type}`); };

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
                    <option value="">{currentWeapon ? `Current: ${currentWeapon.name}` : 'None'}</option>
                    {availableWeapons.map((weapon) => {
                        const canAfford = money >= weapon.price;
                        return (
                            <option 
                                key={weapon.id} 
                                value={weapon.id}
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
            // Filtrer pour la Molotov/Incendiaire selon l'équipe
            .filter(item => team === 'CT' ? item.id !== 'molotov' : item.id !== 'incendiarygrenade')
            .map(item => {
                const isSelected = inventory.some(i => i.id === item.id);
                const canBuy = money >= item.price;
                
                // Règle simplifiée : Max 4 grenades au total. 
                // Les règles par catégorie (max 1 flash, etc.) sont ignorées pour la simplification ici.
                const isDisabled = !isSelected && (!canBuy || isGrenadeFull);

                let buttonAction;
                let buttonText = item.name;
                let buttonClass = '';

                if (isSelected) {
                    // Si sélectionné, l'action est de le retirer (et de vendre)
                    buttonAction = () => { /* Logique de vente de grenade */ console.log(`Sell/Remove ${item.name}`); };
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
                            Argent disponible: ${money.toLocaleString()} | Buy Value: ${playerRoundState.buyValue.toLocaleString()}
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Armor</h3>
                        <div className="flex gap-3">
                            {renderArmorButtons()}
                        </div>
                    </div>

                    {/* PRIMARY WEAPON */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Primary Weapon</h3>
                        {renderWeaponSelect('Rifle')}
                    </div>

                    {/* SECONDARY WEAPON */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Secondary Weapon (Pistol)</h3>
                        {renderWeaponSelect('Pistol')}
                    </div>

                    {/* GRENADES */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            Grenades (Max {maxGrenadesCount}, Current: {currentGrenadesCount})
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {renderGrenadeButtons()}
                        </div>
                    </div>

                    {/* EQUIPMENT (Defuse Kit) */}
                    {team === 'CT' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Defuse Kit</h3>
                            {/* NOTE: Le kit de désamorçage est un achat unique, non une sélection */}
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

                    {/* Bouton de Fermeture Final */}
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