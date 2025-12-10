// src/data/cs2Equipment.ts

/** ----------------- Types et Constantes de Base ----------------- */

export type Team = 'CT' | 'T';
export type ArmorType = 'none' | 'vest' | 'helmet';

// Interface pour tous les items (armes, utilitaires, armure)
export interface GameItem {
    id: string; // Identifiant unique (ex: 'ak47', 'defuseKit')
    name: string;
    type: 'Pistol' | 'SMG' | 'Rifle' | 'Shotgun' | 'LMG' | 'Sniper' | 'Grenade' | 'Utility' | 'Armor';
    price: number;
    killReward?: number; // Optionnel, pour les armes seulement
    team?: Team; // Optionnel, si l'item est exclusif
}

// Les récompenses de kill sont définies dans la structure GameItem, mais voici la table de référence (pour le KillReward):
// Knife: 1500
// Zeus: 0
// SMGs (sauf P90): 600
// Shotguns (sauf XM1014): 900
// Rifles, Pistols, LMGs, HE, XM1014, P90: 300
// AWP, SSG 08, Auto Snipers: 100

export const STARTING_PISTOLS: GameItem[] = [
    { id: 'usps', name: 'USP-S', type: 'Pistol', price: 0, killReward: 300, team: 'CT' },
    { id: 'p2000', name: 'P2000', type: 'Pistol', price: 0, killReward: 300, team: 'CT' },
    { id: 'glock', name: 'Glock-18', type: 'Pistol', price: 0, killReward: 300, team: 'T' },
];

export const ALL_WEAPONS: GameItem[] = [
    // PISTOLS (Kill Reward 300)
    { id: 'p250', name: 'P250', type: 'Pistol', price: 300, killReward: 300 },
    { id: 'fiveseven', name: 'Five-SeveN', type: 'Pistol', price: 500, killReward: 300, team: 'CT' },
    { id: 'tec9', name: 'Tec-9', type: 'Pistol', price: 500, killReward: 300, team: 'T' },
    { id: 'cz75auto', name: 'CZ75-Auto', type: 'Pistol', price: 500, killReward: 300 },
    { id: 'deagle', name: 'Desert Eagle', type: 'Pistol', price: 700, killReward: 300 },
    { id: 'r8revolver', name: 'R8 Revolver', type: 'Pistol', price: 600, killReward: 300 },
    
    // SMGS (Kill Reward 600, sauf P90)
    { id: 'mac10', name: 'MAC-10', type: 'SMG', price: 1050, killReward: 600, team: 'T' },
    { id: 'mp9', name: 'MP9', type: 'SMG', price: 1250, killReward: 600, team: 'CT' },
    { id: 'mp7', name: 'MP7', type: 'SMG', price: 1500, killReward: 600 },
    { id: 'mp5sd', name: 'MP5-SD', type: 'SMG', price: 1500, killReward: 600 },
    { id: 'ump45', name: 'UMP-45', type: 'SMG', price: 1200, killReward: 600 },
    { id: 'ppbizon', name: 'PP-Bizon', type: 'SMG', price: 1400, killReward: 600 },
    { id: 'p90', name: 'P90', type: 'SMG', price: 2350, killReward: 300 }, // Exception: 300
    
    // SHOTGUNS (Kill Reward 900, sauf XM1014)
    { id: 'sawedoff', name: 'Sawed-Off', type: 'Shotgun', price: 1100, killReward: 900, team: 'T' },
    { id: 'nova', name: 'Nova', type: 'Shotgun', price: 1050, killReward: 900 },
    { id: 'xm1014', name: 'XM1014', type: 'Shotgun', price: 2000, killReward: 300 }, // Exception: 300
    { id: 'mag7', name: 'MAG-7', type: 'Shotgun', price: 1300, killReward: 900, team: 'CT' },

    // RIFLES (Kill Reward 300)
    { id: 'famas', name: 'FAMAS', type: 'Rifle', price: 2050, killReward: 300, team: 'CT' },
    { id: 'galilar', name: 'Galil AR', type: 'Rifle', price: 1800, killReward: 300, team: 'T' },
    { id: 'm4a4', name: 'M4A4', type: 'Rifle', price: 3100, killReward: 300, team: 'CT' },
    { id: 'm4a1s', name: 'M4A1-S', type: 'Rifle', price: 2900, killReward: 300, team: 'CT' },
    { id: 'ak47', name: 'AK-47', type: 'Rifle', price: 2700, killReward: 300, team: 'T' },
    { id: 'aug', name: 'AUG', type: 'Rifle', price: 3300, killReward: 300, team: 'CT' },
    { id: 'sg553', name: 'SG 553', type: 'Rifle', price: 3000, killReward: 300, team: 'T' },
    
    // SNIPERS (Kill Reward 100, sauf SSG 08 et AWP)
    { id: 'ssg08', name: 'SSG 08', type: 'Sniper', price: 1700, killReward: 300 }, // Correction: SSG 08 = 300 (Nouvelles règles)
    { id: 'awp', name: 'AWP', type: 'Sniper', price: 4750, killReward: 100 },
    { id: 'g3sg1', name: 'G3SG1', type: 'Sniper', price: 5000, killReward: 100, team: 'T' },
    { id: 'scar20', name: 'SCAR-20', type: 'Sniper', price: 5000, killReward: 100, team: 'CT' },

    // MACHINE GUNS (Kill Reward 300)
    { id: 'm249', name: 'M249', type: 'LMG', price: 5200, killReward: 300 },
    { id: 'negev', name: 'Negev', type: 'LMG', price: 1700, killReward: 300 },
    
    // MELEE (Kill Reward 1500)
    { id: 'knife', name: 'Couteau', type: 'Utility', price: 0, killReward: 1500 },
    { id: 'zeus', name: 'Zeus x27', type: 'Utility', price: 200, killReward: 0 },
];

export const ALL_GRENADES: GameItem[] = [
    // GRENADES (Kill Reward 300 pour HE)
    { id: 'hegrenade', name: 'HE Grenade', type: 'Grenade', price: 300, killReward: 300 },
    { id: 'flashbang', name: 'Flashbang', type: 'Grenade', price: 200 },
    { id: 'smokegrenade', name: 'Smoke Grenade', type: 'Grenade', price: 300 },
    { id: 'incendiary', name: 'Incendiary Grenade', type: 'Grenade', price: 600, team: 'CT' },
    { id: 'molotov', name: 'Molotov', type: 'Grenade', price: 400, team: 'T' },
    { id: 'decoy', name: 'Decoy Grenade', type: 'Grenade', price: 50 },
];

export const UTILITY_AND_ARMOR: GameItem[] = [
    { id: 'defusekit', name: 'Kit de Défuse', type: 'Utility', price: 400, team: 'CT' },
    { id: 'vest', name: 'Armure (Seulement Veste)', type: 'Armor', price: 650 },
    { id: 'vesthelm', name: 'Armure + Casque', type: 'Armor', price: 1000 },
];

// Catalogue principal de tous les items achetable (exclut les pistolets de départ et le couteau)
export const ALL_EQUIPMENT: GameItem[] = [
    ...ALL_WEAPONS.filter(item => item.price > 0),
    ...ALL_GRENADES,
    ...UTILITY_AND_ARMOR,
];

/** ----------------- Constantes Économiques (Fin de Manche) ----------------- */

export const ECONOMIC_CONSTANTS = {
    // Argent de Départ
    STARTING_MONEY: 800,
    STARTING_MONEY_OVERTIME: 16000,
    
    // Récompenses de Victoire
    WIN_ROUND_BONUS: 3500,
    
    // Bonus spécifiques
    CT_TEAM_KILL_BONUS: 50, // Bonus pour chaque CT quand un T est tué
    T_PLANT_BONUS_WIN: 300, // Bonus individuel si la bombe plante et l'équipe T gagne
    T_PLANT_BONUS_LOSS: 800, // Bonus individuel si la bombe plante et l'équipe T perd
    CT_DEFUSE_BONUS: 300, // Bonus individuel pour le défuseur
    
    // Séquence du Loss Bonus (indices 0 à 4 = 1 à 5 défaites)
    LOSS_BONUS_SEQUENCE: [1400, 1900, 2400, 2900, 3400],
};

/** ----------------- Fonctions d'Utilitaires ----------------- */

/**
 * Récupère un item à partir de son ID (ex: 'ak47', 'defusekit').
 */
export function getItemById(id: string): GameItem | undefined {
    return [
        ...STARTING_PISTOLS, 
        ...ALL_WEAPONS, 
        ...ALL_GRENADES, 
        ...UTILITY_AND_ARMOR
    ].find(item => item.id === id);
}

/**
 * Récupère tous les items achetable pour une équipe donnée.
 */
export function getBuyableItemsForTeam(team: Team): GameItem[] {
    const isCt = team === 'CT';
    
    // Le pistolet de départ est géré séparément dans la logique du joueur (defaultPistol)
    return ALL_EQUIPMENT.filter(item => 
        !item.team || item.team === team || (isCt && item.id === 'incendiary') || (!isCt && item.id === 'molotov')
    );
}