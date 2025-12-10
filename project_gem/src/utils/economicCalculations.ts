// src/utils/economicCalculations.ts

import {
    ECONOMIC_CONSTANTS,
    getItemById,
    GameItem,
} from '../data/cs2Equipment';
import { 
    PlayerRoundState, 
    RoundResult, 
    Team,
    KillEntry
} from '../types';

/**
 * Calcule la valeur totale de l'équipement (Buy Value) conservé par le joueur.
 * @param playerState L'état du joueur pour la manche.
 * @returns Le coût total des items dans l'inventaire.
 */
export function calculateBuyValue(playerState: PlayerRoundState): number {
    // Le Buy Value est la somme des prix des items dans l'inventaire.
    return playerState.inventory.reduce((total, item) => total + item.price, 0);
}

/**
 * Calcule la récompense de fin de manche pour l'équipe (Loss Bonus ou Win Bonus).
 * Cette valeur est la base du gain d'argent de chaque joueur de l'équipe.
 *
 * @param result Le résultat final de la manche.
 * @param team L'équipe concernée ('CT' ou 'T').
 * @param lossStreak Le compteur de défaites actuel de l'équipe (avant mise à jour).
 * @returns La récompense de base de fin de manche.
 */
export function calculateBaseRoundReward(
    result: RoundResult,
    team: Team,
    lossStreak: number
): number {
    const { 
        WIN_ROUND_BONUS, 
        T_PLANT_BONUS_LOSS, 
        T_PLANT_BONUS_WIN, 
        LOSS_BONUS_SEQUENCE 
    } = ECONOMIC_CONSTANTS;

    // --- Victoire ---
    if (result.winner === team) {
        // Le gain de victoire est fixe, que ce soit par objectif ou élimination.
        // On pourrait ajouter T_PLANT_BONUS_WIN ici pour l'équipe T, 
        // mais le prompt demande un bonus individuel (T_PLANT_BONUS_WIN sera appliqué par joueur).
        return WIN_ROUND_BONUS;
    } 
    
    // --- Défaite ---
    else {
        // Calcule le Loss Bonus basé sur la séquence
        const getLossBonus = (streak: number): number => {
            if (streak <= 0) return LOSS_BONUS_SEQUENCE[0]; // Cas d'une première défaite
            const index = Math.min(streak - 1, LOSS_BONUS_SEQUENCE.length - 1);
            return LOSS_BONUS_SEQUENCE[index];
        };
        
        const baseLossReward = getLossBonus(lossStreak);

        // Cas T: Perte mais plant réussi et non-défusé
        if (team === 'T' && result.bombPlanted && !result.bombDefused) {
             // Si T perd mais la bombe a explosé, T reçoit le Loss Bonus + 800 (pour chaque joueur).
             // Si T perd par élimination mais a planté, il reçoit le Loss Bonus.
             // Le bonus T_PLANT_BONUS_LOSS est appliqué individuellement dans la fonction calculateIndividualMoney.
             return baseLossReward;
        }

        // Cas T: Perte par temps écoulé (pas de plant) ou par élimination (pas de plant)
        if (team === 'T' && result.tLostButExploded === false && !result.bombPlanted) {
            // Si T perd par temps écoulé SANS plant, ils reçoivent $0 (pas de gain de fin de manche).
            // Le Loss Streak n'est pas réinitialisé, mais le gain est zéro.
            return result.winner === 'CT' ? 0 : baseLossReward; 
        }

        // Cas général de défaite (y compris CT après défaite)
        return baseLossReward;
    }
}

/**
 * Calcule le nouveau Loss Streak après une manche.
 * @param currentStreak Le compteur actuel.
 * @param didWin Vrai si l'équipe a gagné la manche.
 * @param isT Vrai si l'équipe est T (pour la règle de perte sans plant).
 * @param result Le résultat de la manche.
 * @returns Le nouveau Loss Streak pour la manche suivante.
 */
export function getNextLossStreak(
    currentStreak: number,
    didWin: boolean,
    isT: boolean,
    result: RoundResult
): number {
    if (didWin) {
        // Victoire réinitialise à 0.
        return 0;
    }
    
    // Si T perd sans plant, le Loss Bonus n'est pas appliqué, mais le Loss Streak continue.
    // Si T perd par temps écoulé et SANS plant, le gain est $0, mais le streak avance.
    if (isT && !result.bombPlanted && result.winner === 'CT' && !result.tLostButExploded) {
        return Math.min(currentStreak + 1, 5); // Augmente le streak
    }

    // Le streak augmente, capé à 5 (pour atteindre le max de $3400).
    return Math.min(currentStreak + 1, 5);
}

/**
 * Calcule le montant total des Kill Rewards pour un joueur.
 * @param kills Tableau des KillEntry du joueur.
 * @returns Le montant total d'argent gagné via les kills.
 */
export function calculateIndividualKillReward(kills: KillEntry[]): number {
    return kills.reduce((total, killEntry) => {
        const item = getItemById(killEntry.weaponId);
        const reward = item?.killReward || 300; // Par défaut à $300
        return total + (reward * killEntry.count);
    }, 0);
}

/**
 * Calcule le gain total d'argent pour un joueur à la fin d'une manche.
 * @param playerState L'état du joueur.
 * @param result Le résultat de la manche.
 * @param teamBaseReward La récompense de base de l'équipe (Loss/Win Bonus).
 * @param totalCtKills Le nombre total de kills effectués par les CT durant la manche.
 * @param playerPlanted Vrai si le joueur a planté la bombe (T).
 * @param playerDefused Vrai si le joueur a défusé la bombe (CT).
 * @returns Le montant total d'argent gagné pour la manche.
 */
export function calculateIndividualMoneyGain(
    playerState: PlayerRoundState,
    result: RoundResult,
    teamBaseReward: number,
    totalCtKills: number,
    playerPlanted: boolean,
    playerDefused: boolean
): number {
    let gain = 0;

    // 1. Gain de Fin de Manche (Base)
    gain += teamBaseReward;

    // 2. Kill Rewards Individuelles
    const individualKillReward = calculateIndividualKillReward(playerState.kills);
    gain += individualKillReward;
    
    // 3. Bonus d'Équipe CT (si CT)
    if (playerState.team === 'CT') {
        gain += totalCtKills * ECONOMIC_CONSTANTS.CT_TEAM_KILL_BONUS;
    }
    
    // 4. Bonus d'Objectif (Individuel)
    if (playerState.team === 'T') {
        // Plant Bonus : $800 si T perd mais plante, ou $300 si T gagne
        if (playerPlanted && result.winner === 'CT') {
            gain += ECONOMIC_CONSTANTS.T_PLANT_BONUS_LOSS; // $800
        } else if (playerPlanted && result.winner === 'T') {
            gain += ECONOMIC_CONSTANTS.T_PLANT_BONUS_WIN; // $300 (si T gagne par explosion)
        }
    } else if (playerState.team === 'CT') {
        // Defuse Bonus
        if (playerDefused) {
            gain += ECONOMIC_CONSTANTS.CT_DEFUSE_BONUS; // $300
        }
    }

    // 5. Cas spécial : T perd par temps écoulé sans plant
    if (playerState.team === 'T' && result.winner === 'CT' && !result.bombPlanted) {
        // Dans ce cas, teamBaseReward est $0, mais assurons-nous que le gain ne soit pas négatif.
        // Le joueur gagne uniquement ses Kill Rewards et rien d'autre.
        return individualKillReward;
    }
    
    return gain;
}


/**
 * Calcule la prévision d'argent "Minimum Garanti" pour la manche suivante.
 * Logique : Argent Actuel du joueur + Gain de la pire des fins de manche possibles (Loss Bonus Max).
 *
 * @param currentMoney Argent actuel du joueur (après achats de la manche en cours).
 * @param teamLossStreak Le Loss Streak actuel de l'équipe.
 * @returns La somme minimale garantie au début de la manche suivante.
 */
export function calculateMinimumGuaranteed(
    currentMoney: number,
    teamLossStreak: number
): number {
    const { LOSS_BONUS_SEQUENCE, STARTING_MONEY } = ECONOMIC_CONSTANTS;

    // 1. Détermine le Loss Bonus minimum que l'équipe recevra à la fin de la manche.
    // Le minimum est le Loss Bonus actuel si l'équipe perd (le streak augmente)
    // ou le gain minimal ($1400) si l'équipe gagne.
    
    // Assumons que l'équipe perd. Le Loss Streak augmente de 1.
    const assumedNextStreak = Math.min(teamLossStreak + 1, LOSS_BONUS_SEQUENCE.length);
    const guaranteedLossBonus = LOSS_BONUS_SEQUENCE[assumedNextStreak - 1];

    // Note: On ne peut pas garantir les Kill Rewards ou les Bonus de Plant.
    // Le minimum garanti est basé sur le scénario de défaite pure de l'équipe.
    
    // Si la manche est la première ou la 13ème, l'argent est reset à 800.
    // Ce calcul doit être utilisé uniquement pendant la phase d'achat/de jeu normal.
    // S'il s'agit de la phase d'achat, currentMoney inclut déjà le $800 de départ.
    
    // Simplification (comme dans la communauté CS) : 
    // Minimum Garanti = Argent actuel + Le Loss Bonus garanti si l'équipe perd.
    return currentMoney + guaranteedLossBonus;
}