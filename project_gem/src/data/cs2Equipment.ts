import { Team } from '../types';

// --- Types pour ce fichier ---

// Définition de l'équipement
export type Equipment = {
    id: string;
    name: string;
    team: Team | 'ALL';
    price: number;
    killReward: number; // Récompense spécifique pour un kill avec cette arme
    type: 'Pistol' | 'Heavy' | 'SMG' | 'Rifle' | 'Sniper' | 'Gear' | 'Grenade';
};

// --- Constantes de Bonus d'Argent ---

// Base de récompense de Kill
export const STANDARD_KILL_REWARD = 300; 
export const KNIFE_REWARD = 1500;
export const SHOTGUN_REWARD = 900;
export const SMG_REWARD = 600;
export const AWP_REWARD = 100; // AWP seulement, les autres snipers sont à 300

// Plafond d'argent
export const MAX_MONEY_CAP = 16000;

// Bonus de fin de Round (montant par joueur)
export const WIN_REWARD = 3250;
export const LOSS_REWARD_BASE = 1400; // Récompense pour la première défaite
export const LOSS_STREAK_INCREMENT = 500;
export const MAX_LOSS_REWARD = 3400; // Plafond: 1400 + 4 * 500 = 3400

// Récompenses pour les objectifs
export const BOMB_PLANT_REWARD = 300; // Récompense individuelle pour le planteur (si on track l'action)
export const BOMB_DEFUSE_REWARD = 300; // Récompense individuelle pour le démineur (si on track l'action)
export const BOMB_PLANT_TEAM_REWARD = 800; // Bonus ajouté aux $ pour chaque T si la bombe a explosé ou si le round a été gagné après plant.


// --- Liste Complète des Équipements de CS2 ---
export const EQUIPMENT_LIST: Equipment[] = [
    // PISTOLS (Récompense standard 300, sauf CZ75/R8)
    { id: 'pistol_glock', name: 'Glock-18', team: 'T', price: 200, killReward: STANDARD_KILL_REWARD, type: 'Pistol' },
    { id: 'pistol_usp', name: 'USP-S', team: 'CT', price: 200, killReward: STANDARD_KILL_REWARD, type: 'Pistol' },
    { id: 'pistol_p2000', name: 'P2000', team: 'CT', price: 200, killReward: STANDARD_KILL_REWARD, type: 'Pistol' },
    { id: 'pistol_p250', name: 'P250', team: 'ALL', price: 300, killReward: STANDARD_KILL_REWARD, type: 'Pistol' },
    { id: 'pistol_tec9', name: 'Tec-9', team: 'T', price: 500, killReward: STANDARD_KILL_REWARD, type: 'Pistol' },
    { id: 'pistol_fiveseven', name: 'Five-SeveN', team: 'CT', price: 500, killReward: STANDARD_KILL_REWARD, type: 'Pistol' },
    { id: 'pistol_deagle', name: 'Desert Eagle', team: 'ALL', price: 700, killReward: STANDARD_KILL_REWARD, type: 'Pistol' },
    { id: 'pistol_cz75a', name: 'CZ75-Auto', team: 'ALL', price: 500, killReward: 300, type: 'Pistol' }, // CZ75 est à 300
    { id: 'pistol_r8', name: 'R8 Revolver', team: 'ALL', price: 600, killReward: STANDARD_KILL_REWARD, type: 'Pistol' }, 
    
    // HEAVY (Récompense 600 pour SMG, 900 pour Shotguns)
    { id: 'smg_mac10', name: 'MAC-10', team: 'T', price: 1050, killReward: SMG_REWARD, type: 'SMG' },
    { id: 'smg_mp9', name: 'MP9', team: 'CT', price: 1250, killReward: SMG_REWARD, type: 'SMG' },
    { id: 'smg_mp7', name: 'MP7', team: 'ALL', price: 1500, killReward: SMG_REWARD, type: 'SMG' },
    { id: 'smg_ump45', name: 'UMP-45', team: 'ALL', price: 1200, killReward: SMG_REWARD, type: 'SMG' },
    { id: 'smg_p90', name: 'P90', team: 'ALL', price: 2350, killReward: SMG_REWARD, type: 'SMG' },
    { id: 'smg_bizon', name: 'PP-Bizon', team: 'ALL', price: 1400, killReward: SMG_REWARD, type: 'SMG' },
    { id: 'smg_mp5sd', name: 'MP5-SD', team: 'ALL', price: 1500, killReward: SMG_REWARD, type: 'SMG' },

    // SHOTGUNS (Récompense 900)
    { id: 'shotgun_nova', name: 'Nova', team: 'ALL', price: 1050, killReward: SHOTGUN_REWARD, type: 'Heavy' },
    { id: 'shotgun_xm1014', name: 'XM1014', team: 'ALL', price: 2000, killReward: SHOTGUN_REWARD, type: 'Heavy' },
    { id: 'shotgun_mag7', name: 'MAG-7', team: 'CT', price: 1300, killReward: SHOTGUN_REWARD, type: 'Heavy' },
    { id: 'shotgun_sawedoff', name: 'Sawed-Off', team: 'T', price: 1100, killReward: SHOTGUN_REWARD, type: 'Heavy' },

    // RIFLES (Récompense standard 300)
    { id: 'rifle_galilar', name: 'Galil AR', team: 'T', price: 1800, killReward: STANDARD_KILL_REWARD, type: 'Rifle' },
    { id: 'rifle_famas', name: 'FAMAS', team: 'CT', price: 2250, killReward: STANDARD_KILL_REWARD, type: 'Rifle' },
    { id: 'rifle_ak47', name: 'AK-47', team: 'T', price: 2700, killReward: STANDARD_KILL_REWARD, type: 'Rifle' },
    { id: 'rifle_m4a4', name: 'M4A4', team: 'CT', price: 3100, killReward: STANDARD_KILL_REWARD, type: 'Rifle' },
    { id: 'rifle_m4a1s', name: 'M4A1-S', team: 'CT', price: 2900, killReward: STANDARD_KILL_REWARD, type: 'Rifle' },
    { id: 'rifle_aug', name: 'AUG', team: 'CT', price: 3300, killReward: STANDARD_KILL_REWARD, type: 'Rifle' },
    { id: 'rifle_sg553', name: 'SG 553', team: 'T', price: 3000, killReward: STANDARD_KILL_REWARD, type: 'Rifle' },
    
    // SNIPERS (Récompense 300 pour Scout/SSG08, 100 pour AWP)
    { id: 'sniper_ssg08', name: 'SSG 08', team: 'ALL', price: 1700, killReward: STANDARD_KILL_REWARD, type: 'Sniper' },
    { id: 'sniper_awp', name: 'AWP', team: 'ALL', price: 4750, killReward: AWP_REWARD, type: 'Sniper' },
    { id: 'sniper_g3sg1', name: 'G3SG1', team: 'T', price: 5000, killReward: STANDARD_KILL_REWARD, type: 'Sniper' },
    { id: 'sniper_scar20', name: 'SCAR-20', team: 'CT', price: 5000, killReward: STANDARD_KILL_REWARD, type: 'Sniper' },
    
    // HEAVY MACHINE GUNS (Récompense standard 300)
    { id: 'heavy_negev', name: 'Negev', team: 'ALL', price: 1700, killReward: STANDARD_KILL_REWARD, type: 'Heavy' },
    { id: 'heavy_m249', name: 'M249', team: 'ALL', price: 4200, killReward: STANDARD_KILL_REWARD, type: 'Heavy' },

    // GEAR (Équipement)
    { id: 'kevlar', name: 'Kevlar', team: 'ALL', price: 650, killReward: 0, type: 'Gear' },
    { id: 'kevlar_helm', name: 'Kevlar + Helm', team: 'ALL', price: 1000, killReward: 0, type: 'Gear' },
    { id: 'defuse_kit', name: 'Defuse Kit', team: 'CT', price: 400, killReward: 0, type: 'Gear' },
    { id: 'zeus', name: 'Zeus x27', team: 'ALL', price: 200, killReward: 0, type: 'Gear' },

    // GRENADES (Récompense 0)
    { id: 'grenade_he', name: 'HE Grenade', team: 'ALL', price: 300, killReward: 0, type: 'Grenade' },
    { id: 'grenade_flash', name: 'Flashbang', team: 'ALL', price: 200, killReward: 0, type: 'Grenade' },
    { id: 'grenade_smoke', name: 'Smoke Grenade', team: 'ALL', price: 300, killReward: 0, type: 'Grenade' },
    { id: 'grenade_molotov', name: 'Molotov', team: 'T', price: 600, killReward: 0, type: 'Grenade' },
    { id: 'grenade_incendiary', name: 'Incendiary Grenade', team: 'CT', price: 600, killReward: 0, type: 'Grenade' },
    { id: 'grenade_decoy', name: 'Decoy Grenade', team: 'ALL', price: 50, killReward: 0, type: 'Grenade' },
];

/**
 * Récupère le montant de la récompense de kill pour une arme spécifique.
 * Utilise la liste EQUIPMENT_LIST pour la logique.
 * @param weaponId L'ID de l'arme (exemple: 'rifle_ak47')
 * @returns Le montant de la récompense en dollars.
 */
export const getKillReward = (weaponId: string): number => {
    // Cas spécial pour le couteau (souvent pas dans l'inventaire équipable)
    if (weaponId === 'knife') return KNIFE_REWARD; 
    
    const equipment = EQUIPMENT_LIST.find(e => e.id === weaponId);
    
    // Retourne la récompense spécifique si trouvée, sinon la récompense standard
    return equipment ? equipment.killReward : STANDARD_KILL_REWARD;
};

// --- Fonctions utilitaires ---

/**
 * Calcule la valeur totale d'équipement à partir d'une liste d'IDs d'équipement.
 * Cette fonction sera utilisée dans src/utils/economicCalculations.ts.
 */
export const calculateEquipmentValue = (equipmentIds: string[]): number => {
    return equipmentIds.reduce((total, id) => {
        const item = EQUIPMENT_LIST.find(e => e.id === id);
        return total + (item ? item.price : 0);
    }, 0);
};