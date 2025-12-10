// src/data/cs2Equipment.ts

import { Team, GameItem as BaseGameItem } from '../types/index';

/** ----------------- Types et Constantes de Base ----------------- */

// Utilise l'interface GameItem de src/types/index pour la cohérence
export interface GameItem extends BaseGameItem {}

// ARMOR_ITEM_IDS est requis par EquipmentPurchase.tsx
export const ARMOR_ITEM_IDS = ['vest', 'vesthelm']; 

// GRENADES est requis par EquipmentPurchase.tsx
export const GRENADES_IDS = ['hegrenade', 'flashbang', 'smokegrenade', 'incendiary', 'molotov', 'decoy'];

// PRICES pour les utilitaires, armures et pistolets de base non listés ailleurs
export const UTILITY_PRICES = {
    defuseKit: 400,
    zeus: 200,
    vest: 650,
    vesthelm: 1000,
};

/** ----------------- Définition des Items ----------------- */

export const STARTING_PISTOLS: GameItem[] = [
    { id: 'glock', name: 'Glock-18', type: 'Pistol', price: 200, killReward: 300, team: 'T' },
    { id: 'usps', name: 'USP-S', type: 'Pistol', price: 200, killReward: 300, team: 'CT' },
    { id: 'p2000', name: 'P2000', type: 'Pistol', price: 200, killReward: 300, team: 'CT' },
];

export const ALL_WEAPONS: GameItem[] = [
    // Pistolets (Excluant les pistolets de départ pour l'achat, mais inclus dans l'inventaire)
    { id: 'p250', name: 'P250', type: 'Pistol', price: 300, killReward: 300 },
    { id: 'fiveseven', name: 'Five-SeveN', type: 'Pistol', price: 700, killReward: 300, team: 'CT' },
    { id: 'tec9', name: 'Tec-9', type: 'Pistol', price: 500, killReward: 300, team: 'T' },
    { id: 'deagle', name: 'Desert Eagle', type: 'Pistol', price: 700, killReward: 300 },
    
    // Fusils d'Assaut
    { id: 'ak47', name: 'AK-47', type: 'Rifle', price: 2700, killReward: 300, team: 'T' },
    { id: 'm4a4', name: 'M4A4', type: 'Rifle', price: 3100, killReward: 300, team: 'CT' },
    { id: 'm4a1s', name: 'M4A1-S', type: 'Rifle', price: 2900, killReward: 300, team: 'CT' },
    { id: 'galilar', name: 'Galil AR', type: 'Rifle', price: 1800, killReward: 300, team: 'T' },
    { id: 'famas', name: 'FAMAS', type: 'Rifle', price: 2050, killReward: 300, team: 'CT' },

    // Sniper
    { id: 'awp', name: 'AWP', type: 'Sniper', price: 4750, killReward: 100 },
    { id: 'ssg08', name: 'SSG 08', type: 'Sniper', price: 1700, killReward: 300 },
    
    // SMG
    { id: 'mp9', name: 'MP9', type: 'SMG', price: 1250, killReward: 600, team: 'CT' },
    { id: 'mac10', name: 'MAC-10', type: 'SMG', price: 1050, killReward: 600, team: 'T' },
    { id: 'mp7', name: 'MP7', type: 'SMG', price: 1500, killReward: 300 },
    { id: 'p90', name: 'P90', type: 'SMG', price: 2350, killReward: 300 },
];

export const ALL_GRENADES: GameItem[] = [
    { id: 'hegrenade', name: 'HE Grenade', type: 'Grenade', price: 300 },
    { id: 'flashbang', name: 'Flashbang', type: 'Grenade', price: 200 },
    { id: 'smokegrenade', name: 'Smoke Grenade', type: 'Grenade', price: 300 },
    { id: 'molotov', name: 'Molotov', type: 'Grenade', price: 500, team: 'T' },
    { id: 'incendiary', name: 'Incendiary Grenade', type: 'Grenade', price: 600, team: 'CT' },
    { id: 'decoy', name: 'Decoy Grenade', type: 'Grenade', price: 50 },
];

export const UTILITY_AND_ARMOR: GameItem[] = [
    { id: 'defusekit', name: 'Defuse Kit', type: 'Utility', price: UTILITY_PRICES.defuseKit, team: 'CT' },
    { id: 'zeus', name: 'Zeus x27', type: 'Utility', price: UTILITY_PRICES.zeus, killReward: 0 },
    { id: 'vest', name: 'Kevlar', type: 'Armor', price: UTILITY_PRICES.vest },
    { id: 'vesthelm', name: 'Kevlar + Casque', type: 'Armor', price: UTILITY_PRICES.vesthelm },
];

// Liste complète de tous les items
export const ALL_ITEMS: GameItem[] = [
    ...STARTING_PISTOLS,
    ...ALL_WEAPONS,
    ...ALL_GRENADES,
    ...UTILITY_AND_ARMOR,
];

/** ----------------- Constantes Économiques (Fin de Manche) ----------------- */

export const ECONOMIC_CONSTANTS = {
    // Argent de Départ
    STARTING_MONEY: 800,
    // CORRIGÉ: S'assurer que le montant Overtime est cohérent (souvent le max)
    STARTING_MONEY_OVERTIME: 16000, 
    MAX_MONEY: 16000,
    
    // Récompenses de Victoire
    WIN_ROUND_BONUS: 3250,
    
    // Bonus spécifiques
    CT_TEAM_KILL_BONUS: 50, 
    T_PLANT_BONUS_WIN: 300, 
    T_PLANT_BONUS_LOSS: 800, // Gain minimal de défaite pour T si la bombe a explosé
    CT_DEFUSE_BONUS: 300, 
    
    // Séquence du Loss Bonus (indices 0 à 4 = 1 à 5 défaites)
    LOSS_BONUS_SEQUENCE: [1400, 1900, 2400, 2900, 3400],

    // AJOUTÉ: Liste des récompenses de kill pour une recherche rapide dans economicCalculations.ts
    // Ces valeurs proviennent de la propriété killReward des items (réécriture pour compilation).
    KILL_REWARDS: ALL_ITEMS.reduce((acc, item) => {
        if (item.killReward !== undefined) {
            acc[item.id.toLowerCase()] = item.killReward;
        }
        return acc;
    }, {
        'knife': 1500, // Ajout du couteau (non achetable)
    } as Record<string, number>),
};

/** ----------------- Fonctions d'Utilitaires ----------------- */

/**
 * Récupère un item à partir de son ID (ex: 'ak47', 'defusekit').
 */
export function getItemById(id: string): GameItem | undefined {
    return ALL_ITEMS.find(item => item.id.toLowerCase() === id.toLowerCase());
}

/**
 * Récupère uniquement les items achetable par une équipe.
 */
export function getBuyableItemsForTeam(team: Team): GameItem[] {
    // Exclut les pistolets de départ (glock, usps, p2000) de la liste d'achat
    const nonBuyableIds = ['glock', 'usps', 'p2000']; 

    return ALL_ITEMS.filter(item => {
        // Exclure les items non achetables (pistolets de départ)
        if (nonBuyableIds.includes(item.id.toLowerCase())) {
            return false;
        }
        
        // Inclure l'armure et le zeus pour les deux équipes
        if (item.type === 'Armor' || item.id === 'zeus') {
            return true;
        }

        // Inclure les grenades neutres
        if (GRENADES_IDS.includes(item.id.toLowerCase()) && item.team === undefined) {
            return true;
        }
        
        // Inclure les items spécifiques à l'équipe ou neutres
        return item.team === undefined || item.team === team;
    });
}