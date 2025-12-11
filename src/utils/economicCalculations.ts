import {
  ARMOR_PRICES,
  EQUIPMENT_PRICES,
  ECONOMIC_CONSTANTS,
  getWeaponPrice,
  getGrenadePrice,
  getKillReward,
} from '../data/cs2Equipment';
import { PlayerRound, RoundResult, Team } from '../types';

export function calculateBuyValue(playerRound: PlayerRound): number {
  let total = 0;

  if (playerRound.armor === 'vest') {
    total += ARMOR_PRICES.vest;
  } else if (playerRound.armor === 'helmet') {
    total += ARMOR_PRICES.helmet;
  }

  if (playerRound.primaryWeapon) {
    total += getWeaponPrice(playerRound.primaryWeapon);
  }

  if (playerRound.secondaryWeapon) {
    total += getWeaponPrice(playerRound.secondaryWeapon);
  }

  playerRound.grenades.forEach(grenade => {
    total += getGrenadePrice(grenade);
  });

  if (playerRound.hasDefuseKit) {
    total += EQUIPMENT_PRICES.defuseKit;
  }

  if (playerRound.hasZeus) {
    total += EQUIPMENT_PRICES.zeus;
  }

  return total;
}

export function getLossBonusForStreak(lossStreak: number): number {
  if (lossStreak <= 0) return 0;
  const index = Math.min(lossStreak - 1, ECONOMIC_CONSTANTS.lossBonus.length - 1);
  return ECONOMIC_CONSTANTS.lossBonus[index];
}

// Calcul des kill rewards pour un joueur
export function calculatePlayerKillReward(playerRound: PlayerRound): number {
  if (playerRound.killInputMode === 'raw') {
    return playerRound.rawKillReward;
  }
  
  // Mode détaillé
  let total = 0;
  playerRound.detailedKills.forEach(kill => {
    const reward = getKillReward(kill.weapon);
    total += reward * kill.count;
  });
  
  return total;
}

// Calcul du nombre total de kills T pour le bonus CT partagé
export function calculateTotalTKills(
  tPlayerIds: string[],
  playerRounds: Record<string, PlayerRound>
): number {
  let totalKills = 0;
  
  tPlayerIds.forEach(playerId => {
    const pr = playerRounds[playerId];
    if (!pr) return;
    
    if (pr.killInputMode === 'raw') {
      // Le mode raw n'integre pas de module de verif donc il faut être certain de mettre le montant correct pour ne pas fausser les caulcus
      return;
    }
    
    pr.detailedKills.forEach(kill => {
      totalKills += kill.count;
    });
  });
  
  return totalKills;
}

export function calculateRoundReward(
  result: RoundResult,
  team: Team,
  lossStreak: number,
  playerId: string
): number {
  if (result.winner === team) {
    // Victoire
    let reward = ECONOMIC_CONSTANTS.winByObjective;
    
    // Bonus plant si T
    if (team === 'T' && result.planterId === playerId) {
      reward += ECONOMIC_CONSTANTS.tPlanterBonus;
    }
    
    // Bonus defuse si CT
    if (team === 'CT' && result.defuserId === playerId) {
      reward += ECONOMIC_CONSTANTS.ctDefuseBonus;
    }
    
    return reward;
  } else {
    // Défaite
    if (team === 'T') {
      // Cas où T perd par temps écoulé sans plant
      if (result.winType === 'time' && !result.bombPlanted) {
        // Les T qui perdent par temps écoulé sans plant ne reçoivent RIEN, SAUF s'ils sont morts (en gros ils recoivent le loss bonus)
        if (result.survivorIds.includes(playerId)) {
          return 0; // Vivant = pas de reward
        } else {
          return getLossBonusForStreak(lossStreak); // Mort = loss bonus
        }
      }
      
      // Défaite normale avec plant
      if (result.bombPlanted) {
        return getLossBonusForStreak(lossStreak) + ECONOMIC_CONSTANTS.tPlantBonus;
      }
    }
    
    // Défaite standard
    return getLossBonusForStreak(lossStreak);
  }
}

export function getNextLossStreak(
  currentStreak: number,
  didWin: boolean
): number {
  if (didWin) {
    return 0;
  }
  return currentStreak + 1;
}

export function getGuaranteedLossBonus(lossStreak: number): number {
  return getLossBonusForStreak(lossStreak + 1);
}

// Calcul du "Minimum Garanti" pour la prochaine manche
export function calculateMinimumGuaranteed(
  currentMoney: number,
  lossStreak: number
): number {
  const nextLossBonus = getGuaranteedLossBonus(lossStreak);
  return currentMoney + nextLossBonus;
}