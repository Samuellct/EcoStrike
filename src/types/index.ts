import { Team, ArmorType } from '../data/cs2Equipment';

export type GameMode = 'competitive' | 'premier';
export type GamePhase = 'config' | 'freezetime' | 'round' | 'ended';
export type KillInputMode = 'raw' | 'detailed';

export interface Player {
  id: string;
  name: string;
  team: Team;
  position: number;
  startingPistol: string;
}

export interface DetailedKill {
  weapon: string;
  count: number;
}

export interface PlayerRound {
  playerId: string;
  money: number;
  buyValue: number;
  isAlive: boolean;
  armor: ArmorType;
  primaryWeapon: string;
  secondaryWeapon: string;
  grenades: string[];
  hasDefuseKit: boolean;
  hasZeus: boolean;
  // système de saisie des kills
  killInputMode: KillInputMode;
  rawKillReward: number;
  detailedKills: DetailedKill[];
  // module pour la conservation d'équipement
  savedEquipment: {
    armor: ArmorType;
    primaryWeapon: string;
    secondaryWeapon: string;
    grenades: string[];
    hasDefuseKit: boolean;
    hasZeus: boolean;
  } | null;
}

export interface MatchState {
  gameMode: GameMode;
  gamePhase: GamePhase;
  currentRound: number;
  ctScore: number;
  tScore: number;
  ctLossStreak: number;
  tLossStreak: number;
  players: Player[];
  playerRounds: Record<string, PlayerRound>;
  roundHistory: Team[]; // Historique visuel des rounds
  timer: number; // Timer en secondes
  // gestion overtime
  isOvertime: boolean;
  overtimeRounds: number;
  // side tracking pour swap
  ctSideIds: string[]; // IDs des joueurs actuellement côté CT
  tSideIds: string[]; // IDs des joueurs actuellement côté T
}

export interface RoundResult {
  winner: Team;
  winType: 'elimination' | 'objective' | 'time';
  bombPlanted: boolean;
  planterId?: string; // ID du joueur qui a planté la bombe
  defuserId?: string; // ID du joueur qui a defuse la bombe
  survivorIds: string[];
}

export interface GiftTransaction {
  fromPlayerId: string;
  toPlayerId: string;
  itemType: 'weapon' | 'armor' | 'grenade' | 'equipment';
  itemName: string;
  cost: number;
}

export { Team, ArmorType };