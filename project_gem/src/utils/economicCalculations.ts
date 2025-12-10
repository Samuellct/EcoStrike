import {
  ARMOR_PRICES,
  EQUIPMENT_PRICES,
  ECONOMIC_CONSTANTS,
  getWeaponPrice,
  getGrenadePrice,
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

export function calculateRoundReward(
  result: RoundResult,
  team: Team,
  lossStreak: number
): number {
  if (result.winner === team) {
    return result.winType === 'objective'
      ? ECONOMIC_CONSTANTS.winByObjective
      : ECONOMIC_CONSTANTS.winByElimination;
  } else {
    if (team === 'T' && result.bombPlanted) {
      return getLossBonusForStreak(lossStreak) + ECONOMIC_CONSTANTS.tPlantBonus;
    }

    if (team === 'T' && result.winType === 'time' && !result.bombPlanted) {
      return 0;
    }

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
