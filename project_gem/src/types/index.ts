// src/types/index.ts (CORRIGÉ)

export type Team = 'CT' | 'T';

export type MatchMode = 'Standard' | 'Premier';

export type MatchPhase = 
    | 'Config' 
    | 'FreezeTime' 
    | 'RoundDuration' 
    | 'RoundEndSummary' 
    | 'HalfTime' 
    | 'OvertimeStart' 
    | 'Finished';

export type RoundWinType = 
    | 'Elimination' 
    | 'TimeExpiration' 
    | 'BombDefused' 
    | 'BombExplosion' 
    | 'Surrender' 
    | 'Technical';

export type GameItemType = 'Pistol' | 'Heavy' | 'SMG' | 'Rifle' | 'Sniper' | 'Shotgun' | 'Grenade' | 'Armor' | 'Utility'; 

export interface GameItem { 
    id: string;
    name: string;
    type: GameItemType;
    price: number;
    killReward?: number; // Kill Reward est optionnel
    team?: Team; // L'équipe est optionnelle
}

export interface KillEntry {
    weaponId: string;
    count: number;
}

export interface PlayerRoundState {
    playerId: string;
    money: number;
    inventory: GameItem[];
    isAlive: boolean;
    kills: KillEntry[];
    buyValue: number;
    minimumGuaranteedNextRound: number;
}

export interface TeamState {
    score: number;
    lossStreak: number;
}

export interface RoundResult {
    roundNumber: number;
    winner: Team;
    winType: RoundWinType;
    bombPlanted: boolean;
    bombDefused: boolean;
    remainingCtAlive: number;
    remainingTAlive: number;
}

export interface MatchState {
    matchMode: MatchMode;
    currentRound: number;
    phase: MatchPhase;
    teamState: Record<Team, TeamState>;
    players: Player[];
    playerRoundStates: Record<string, PlayerRoundState>;
    roundHistory: RoundResult[];
}

export interface Player {
    id: string;
    name: string;
    team: Team;
    position: number; // 1 à 5
    defaultPistol: 'USP-S' | 'P2000' | 'GLOCK';
}

export interface PurchaseInput {
    playerId: string;
    itemBoughtId: string;
    recipientId: string;
}