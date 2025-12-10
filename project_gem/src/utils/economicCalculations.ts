// src/utils/economicCalculations.ts (CORRIGÉ)

import {
    RoundResult,
    Team,
    PlayerRoundState,
    GameItem,
    KillEntry,
} from '../types/index';
import { ECONOMIC_CONSTANTS } from '../data/cs2Equipment';


// --- 1. Calcul des Récompenses d'Équipe de Base ---

/**
 * Calcule la récompense de base garantie (avant kills, plant/defuse) pour une équipe spécifique.
 * @param result Le résultat de la manche précédente.
 * @param team L'équipe pour laquelle on calcule la récompense (CT ou T).
 * @param lossStreak Le Loss Streak actuel de l'équipe (avant la mise à jour).
 * @returns Le montant de la récompense de base.
 */
export function calculateBaseRoundReward(
    result: RoundResult,
    team: Team,
    lossStreak: number
): number {
    const isWinner = result.winner === team;
    // CORRECTION: Accès direct à la constante, ou déconstruction si souhaité, mais l'accès complet est plus sûr.
    const LOSS_BONUS_SEQUENCE = ECONOMIC_CONSTANTS.LOSS_BONUS_SEQUENCE; 
    
    if (isWinner) {
        return ECONOMIC_CONSTANTS.WIN_ROUND_BONUS;
    }

    // Gain de défaite (basé sur le Loss Streak ACTUEL)
    // lossStreak = 1 -> index 0 (1400), lossStreak = 5 -> index 4 (3400)
    // Le streak doit être au moins 1 pour obtenir le premier bonus.
    const streakIndex = Math.min(lossStreak, LOSS_BONUS_SEQUENCE.length);
    const bonus = LOSS_BONUS_SEQUENCE[streakIndex - 1] || LOSS_BONUS_SEQUENCE[0]; // Sécurité pour 0 défaites
    
    // Bonus T si la bombe a été plantée (gain de perte T + 800)
    if (team === 'T' && result.bombPlanted && result.winner === 'CT') {
        return bonus + ECONOMIC_CONSTANTS.T_PLANT_BONUS_LOSS;
    }

    return bonus;
}

// --- 2. Calcul du Loss Streak pour la Manche Suivante ---

/**
 * Calcule le nouveau Loss Streak après une manche.
 */
export function getNextLossStreak(
    currentStreak: number,
    didWin: boolean,
): number {
    if (didWin) {
        return 0; 
    }
    
    return Math.min(currentStreak + 1, 5); 
}


// --- 3. Calcul de la Récompense Individuelle ---

/**
 * Calcule le gain d'argent individuel basé sur les kills et les actions (plant/defuse).
 */
export function calculateIndividualMoneyGain(
    playerState: PlayerRoundState,
    result: RoundResult,
    playerTeam: Team,
    teamBaseReward: number,
    totalCtKills: number, // Total CT Kills, inutilisé dans la logique standard (mais gardé si vous aviez un bonus spécifique)
    playerPlanted: boolean,
    playerDefused: boolean
): number {
    let totalGain = teamBaseReward;

    // --- 3.1 Bonus de Kills Individuels ---
    
    const killBonus = playerState.kills.reduce((sum, killEntry) => {
        // CORRECTION: Utilisation de KILL_REWARDS du fichier de données
        const itemReward = ECONOMIC_CONSTANTS.KILL_REWARDS[killEntry.weaponId.toLowerCase()] || 300; 
        return sum + (itemReward * killEntry.count);
    }, 0);

    totalGain += killBonus;

    // --- 3.2 Bonus Spécifiques (Plante/Désamorce) ---

    // Bonus de Plant si l'équipe T gagne (T_PLANT_BONUS_WIN est déjà inclus dans la base si T gagne via explosion)
    if (playerPlanted && result.winner === 'T') {
        totalGain += ECONOMIC_CONSTANTS.T_PLANT_BONUS_WIN; 
    }

    // Bonus de Désamorce si l'équipe CT gagne
    if (playerDefused && result.winner === 'CT') {
        totalGain += ECONOMIC_CONSTANTS.CT_DEFUSE_BONUS;
    }
    
    // Note : Le bonus de plant $800 pour la défaite T est géré dans calculateBaseRoundReward

    return totalGain;
}


// --- 4. Calculs d'Inventaire et Prévisions ---

/**
 * Calcule la valeur d'achat totale de l'équipement d'un joueur.
 */
export function calculateBuyValue(inventory: GameItem[]): number {
    return inventory.reduce((total, item) => total + item.price, 0);
}

/**
 * Calcule le montant minimum garanti que le joueur aura au début de la prochaine manche.
 * Ceci est l'argent actuel + le gain minimal du Loss Streak (en supposant une défaite).
 * @param currentMoney L'argent actuel du joueur.
 * @param lossStreak Le Loss Streak de l'équipe.
 * @returns Le minimum d'argent garanti.
 */
export function calculateMinimumGuaranteed(currentMoney: number, lossStreak: number): number {
    const LOSS_BONUS_SEQUENCE = ECONOMIC_CONSTANTS.LOSS_BONUS_SEQUENCE;
    
    // Le streak de la prochaine manche si DÉFAITE (max 5)
    // Si lossStreak = 0 -> nextLossStreak = 1. Index 0 (1400)
    const nextLossStreak = Math.min(lossStreak + 1, LOSS_BONUS_SEQUENCE.length); 
    
    // CORRECTION: On utilise nextLossStreak pour déterminer l'index du bonus pour la DÉFAITE.
    const nextRoundLossBonus = LOSS_BONUS_SEQUENCE[nextLossStreak - 1] || LOSS_BONUS_SEQUENCE[0];

    const maxMoney = ECONOMIC_CONSTANTS.MAX_MONEY;
    
    return Math.min(currentMoney + nextRoundLossBonus, maxMoney);
}