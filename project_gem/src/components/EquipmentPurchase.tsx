// src/components/EquipmentPurchase.tsx (CORRECTION ROBUSTE)

import { X, ShoppingCart, User } from 'lucide-react'; 
import React, { useState, useMemo } from 'react';
import { Player, PlayerRoundState, GameItem, PurchaseInput, GameItemType } from '../types/index';
import { useMatchState } from '../state/MatchContext';
import { 
    getBuyableItemsForTeam,
    getItemById,
    ARMOR_ITEM_IDS, 
    GRENADES_IDS, // Import nécessaire pour la logique d'affichage des grenades
} from '../data/cs2Equipment'; 

// L'interface de props est simplifiée pour ne contenir que les données et les callbacks d'UI
interface EquipmentPurchaseProps {
    player: Player;
    playerRoundState: PlayerRoundState;
    onPurchase: (input: PurchaseInput) => void; 
    onClose: () => void;
}

export function EquipmentPurchase({
    player,
    playerRoundState,
    onPurchase,
    onClose,
}: EquipmentPurchaseProps) {
    const { state } = useMatchState(); 
    const { money } = playerRoundState; // On utilise l'argent de l'ACHETEUR (player)
    const team = player.team;
    
    // État local pour gérer l'achat pour un coéquipier
    const teammates = state.players.filter(p => p.team === team && p.id !== player.id);
    const [recipientId, setRecipientId] = useState<string>(player.id);

    // Items que l'équipe peut acheter (filtrés par team)
    const buyableItems = useMemo(() => getBuyableItemsForTeam(team), [team]);
    
    // Groupement des items pour l'affichage (réalisé une seule fois)
    const groupedItems = useMemo(() => {
        return buyableItems.reduce((acc, item) => {
            if (!acc[item.type]) {
                acc[item.type] = [];
            }
            acc[item.type].push(item);
            return acc;
        }, {} as Record<GameItemType, GameItem[]>);
    }, [buyableItems]);
    
    // --- Logique d'Achat ---
    
    // NOUVEAUTÉ CLÉ: Récupération et filtrage de l'inventaire du destinataire
    // Ceci garantit que toutes les fonctions ci-dessous ne travaillent qu'avec des objets valides.
    const recipientInventoryFiltered: GameItem[] = useMemo(() => {
        const recipientInv = state.playerRoundStates[recipientId]?.inventory || [];
        // Filtrer explicitement les éléments undefined/null (la cause des erreurs)
        return recipientInv.filter(i => i) as GameItem[]; 
    }, [recipientId, state.playerRoundStates]);
    
    
    const isAlreadyOwned = (item: GameItem) => {
        // Logique de possession pour la personne qui reçoit l'item (recipientId)
        
        // Cas spécial pour l'Armure : Vest ou Vest+Helmet
        if (item.type === 'Armor') {
            // Utilise l'inventaire filtré
            return recipientInventoryFiltered.some(i => ARMOR_ITEM_IDS.includes(i.id));
        }
        
        // Cas spécial pour les Pistolets de départ (non achetables)
        if (item.type === 'Pistol' && (item.id === 'glock' || item.id === 'usps' || item.id === 'p2000')) {
             return true; 
        }

        // Cas général: Si l'arme existe déjà
        // Utilise l'inventaire filtré
        return recipientInventoryFiltered.some(i => i.id === item.id);
    };
    
    // Vérifie si le type d'arme est déjà dans l'inventaire du destinataire (pour les limites d'armes principales)
    const hasWeaponOfType = (itemType: GameItemType) => {
        // Les types de grenades et l'armure ne sont pas concernés par cette limite
        if (itemType === 'Grenade' || itemType === 'Armor' || itemType === 'Utility') {
            return false;
        }
        
        // Si l'arme est de type lourd (principal) et qu'il y en a déjà une
        // Utilise l'inventaire filtré (plus besoin de `i &&`)
        return recipientInventoryFiltered.some(i => 
            ['Rifle', 'Sniper', 'SMG', 'Shotgun', 'Heavy'].includes(i.type) && 
            i.type === itemType
        );
    };
    
    const isGrenadeLimitReached = (item: GameItem) => {
        // currentGrenades contient uniquement des GameItem valides grâce au filtrage useMemo
        const currentGrenades = recipientInventoryFiltered.filter(i => GRENADES_IDS.includes(i.id));
        
        if (currentGrenades.length >= 4) {
            return true;
        }
        
        // Limite par type (sauf Flashbang)
        const isFlash = item.id === 'flashbang';
        const maxCount = isFlash ? 2 : 1; 
        const currentCount = currentGrenades.filter(g => g.id === item.id).length;

        return currentCount >= maxCount;
    }
    
    const handlePurchase = (item: GameItem) => {
        const input: PurchaseInput = {
            playerId: player.id, // L'acheteur (toujours le joueur du composant)
            itemBoughtId: item.id,
            recipientId: recipientId, // Le destinataire (le joueur ou un coéquipier)
        };
        
        onPurchase(input);
    };

    // --- Rendu ---
    
    const renderBuyButton = (item: GameItem) => {
        // Le destinataire est celui sélectionné dans le dropdown (ou soi-même)
        const recipientCurrentMoney = state.playerRoundStates[recipientId]?.money || 0;
        
        // Vérifie si l'acheteur (player.id) a l'argent (si l'achat n'est pas pour soi-même)
        const canAfford = player.id !== recipientId 
            ? money >= item.price 
            : recipientCurrentMoney >= item.price;
            
        const isTeamMate = player.id !== recipientId;

        const isWeaponLimitReached = (item.type !== 'Armor' && item.type !== 'Utility' && hasWeaponOfType(item.type));
        const isGrenadeLimit = (item.type === 'Grenade' && isGrenadeLimitReached(item));
        const isDefuseKitCT = (item.id === 'defusekit' && team === 'T'); // T ne peut pas acheter de kit
        
        // L'item est-il déjà dans l'inventaire du destinataire ?
        const isOwned = isAlreadyOwned(item) && !isTeamMate && item.type !== 'Grenade';

        const isDisabled = 
            !canAfford ||
            isWeaponLimitReached || 
            isGrenadeLimit ||
            isDefuseKitCT ||
            isOwned;

        const buttonClass = `
            px-3 py-1 text-sm rounded-lg transition-colors font-medium border
            ${isDisabled 
                ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                : 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
            }
        `;
        

        return (
            <button
                key={item.id}
                onClick={() => handlePurchase(item)}
                disabled={isDisabled}
                className={buttonClass}
                title={`Prix: $${item.price.toLocaleString()}`}
            >
                {isOwned && !isTeamMate && item.type !== 'Grenade' ? `Acquis (${item.name})` : (item.id.includes('kit') ? item.name : `${item.name} ($${item.price})`)}
            </button>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                
                {/* En-tête du Panier */}
                <div className="flex justify-between items-start pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <ShoppingCart className="w-8 h-8 text-gray-700" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Achat d'Équipement</h2>
                            <p className="text-sm text-gray-500">
                                Acheteur: <span className="font-semibold text-gray-700">{player.name}</span> (Argent: ${money.toLocaleString()})
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>
                
                {/* Sélection du Destinataire */}
                <div className="py-4 border-b border-gray-200">
                     <div className='flex items-center gap-4'>
                        <User className='w-5 h-5 text-gray-500'/>
                        <label htmlFor="recipient-select" className="text-sm font-medium text-gray-700">Acheter pour:</label>
                        <select
                            id="recipient-select"
                            value={recipientId}
                            onChange={(e) => setRecipientId(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg text-gray-700"
                        >
                            <option value={player.id}>{player.name} (Moi-même)</option>
                            {teammates.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} (Argent: ${state.playerRoundStates[p.id]?.money.toLocaleString()})
                                </option>
                            ))}
                        </select>
                     </div>
                    {/* Affichage du Buy Value du destinataire */}
                     <p className='text-xs text-gray-500 mt-2 ml-9'>
                        Valeur d'inventaire actuelle de {state.players.find(p => p.id === recipientId)?.name}: 
                        <span className='font-semibold'> ${state.playerRoundStates[recipientId]?.buyValue.toLocaleString()}</span>
                     </p>
                </div>
                
                {/* Contenu Scrollable */}
                <div className="mt-4 overflow-y-auto flex-grow space-y-6 pr-2">
                    
                    {/* Fusils et Snipers */}
                    {groupedItems['Rifle'] && groupedItems['Rifle'].length > 0 && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <h3 className="text-lg font-bold text-gray-900 mb-3 border-b pb-1">Fusils d'Assaut et Snipers</h3>
                            <div className="flex flex-wrap gap-2">
                                {groupedItems['Rifle'].map(renderBuyButton)}
                                {groupedItems['Sniper']?.map(renderBuyButton)}
                            </div>
                        </div>
                    )}
                    
                    {/* Pistolets */}
                    {groupedItems['Pistol'] && groupedItems['Pistol'].length > 0 && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <h3 className="text-lg font-bold text-gray-900 mb-3 border-b pb-1">Pistolets</h3>
                            <div className="flex flex-wrap gap-2">
                                {/* Filtre pour ne pas afficher le pistolet de départ (glock, usps, p2000) */}
                                {groupedItems['Pistol'].filter(i => i.price > 200).map(renderBuyButton)} 
                            </div>
                        </div>
                    )}
                    
                    {/* SMGs, Heavys, Shotguns */}
                    { (groupedItems['SMG'] || groupedItems['Shotgun'] || groupedItems['Heavy']) && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <h3 className="text-lg font-bold text-gray-900 mb-3 border-b pb-1">SMG, Lourds et Fusils à Pompe</h3>
                            <div className="flex flex-wrap gap-2">
                                {groupedItems['SMG']?.map(renderBuyButton)}
                                {groupedItems['Shotgun']?.map(renderBuyButton)}
                                {groupedItems['Heavy']?.map(renderBuyButton)}
                            </div>
                        </div>
                    )}
                    
                    {/* Grenades */}
                    {groupedItems['Grenade'] && groupedItems['Grenade'].length > 0 && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <h3 className="text-lg font-bold text-gray-900 mb-3 border-b pb-1">Grenades et Utilitaire</h3>
                            <div className="flex flex-wrap gap-2">
                                {groupedItems['Grenade'].map(renderBuyButton)}
                                {/* Armure */}
                                {groupedItems['Armor']?.map(renderBuyButton)}
                                {/* Zeus */}
                                {groupedItems['Utility']?.filter(i => i.id === 'zeus').map(renderBuyButton)}
                                {/* Defuse Kit (CT uniquement) */}
                                {team === 'CT' && groupedItems['Utility']?.filter(i => i.id === 'defusekit').map(renderBuyButton)}
                            </div>
                        </div>
                    )}
                    
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-4 border-t border-gray-200 mt-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                        Fermer Achat
                    </button>
                </div>
            </div>
        </div>
    );
}