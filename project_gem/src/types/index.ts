// src/types/index.ts

// Les types importés de cs2Equipment.ts seront définis à l'étape suivante.
// Supposons qu'ils existent pour le moment.
// import { Team, ArmorType } from '../data/cs2Equipment'; 

/** ----------------- Types de Données Brutes (Définition de la structure) ----------------- */

// Nouvelle définition pour les équipes
export type Team = 'CT' | 'T';

// Nouvelle définition pour les modes de match
export type MatchMode = 'Standard' | 'Premier';

// Nouvelle définition des phases de l'application
export type MatchPhase = 'Config' | 'FreezeTime' | 'RoundDuration' | 'RoundEndSummary' | 'HalfTime' | 'OvertimeStart';


/** ----------------- Interfaces d'Équipement et de Kill ----------------- */

// Représente un seul item d'équipement possédé par un joueur
export interface Equipment {
  id: string; // Ex: 'ak47', 'defuseKit', 'heGrenade'
  price: number; // Prix d'achat (pour le calcul du Buy Value)
  // Ajout de 'isGained' si l'item a été ramassé ou donné
}

// Représente les kills effectués par un joueur pendant une manche
export interface KillEntry {
  weaponId: string; // ID de l'arme utilisée (pour obtenir la Kill Reward spécifique)
  count: number;
}


/** ----------------- Interfaces de Joueur et d'État de Manche ----------------- */

export interface Player {
  id: string; // Ex: 'CT-1', 'T-5'
  name: string;
  team: Team;
  position: number;
  // Choix permanent pour les CT, Glock pour les T.
  defaultPistol: 'USP-S' | 'P2000' | 'GLOCK';
}

// L'état économique d'un joueur pour la manche actuelle et la transition
export interface PlayerRoundState {
  playerId: string;
  money: number; // Argent actuel du joueur
  
  // Équipement possédé à la fin de la phase d'achat (pour le calcul du Buy Value)
  inventory: Equipment[]; 
  
  isAlive: boolean; // État de survie pour la manche passée (conservé si VIVANT)
  
  // Données saisies à la fin de la manche (ROUND_END_SUMMARY)
  kills: KillEntry[];
  
  // Prévisions pour la manche suivante
  minimumGuaranteedNextRound: number; // (Argent Actuel + Loss Bonus Max)
}


/** ----------------- Interfaces d'État de l'Équipe ----------------- */

export interface TeamState {
  score: number;
  lossStreak: number; // 1 à 5 (Max)
  // Ajoutez isSideSwapped pour gérer les moitiés au-delà de la 12
}

/** ----------------- Interfaces d'Événements de Manche ----------------- */

export interface RoundResult {
  winner: Team;
  // bombPlanted et defused sont nécessaires pour la logique du loss bonus et les gains T/CT
  bombPlanted: boolean;
  bombDefused: boolean;
  // Si le T a perdu mais que la bombe a explosé après le temps
  tLostButExploded: boolean;
}

/** ----------------- Interfaces de l'État Global ----------------- */

export interface MatchState {
  matchMode: MatchMode;
  currentRound: number; // Manches 1, 2, ..., 12, 13 (changement de côté), 25 (Prolongation)
  phase: MatchPhase;
  
  CT: TeamState;
  T: TeamState;
  
  // Liste des 10 joueurs
  players: Player[]; 
  
  // État économique de tous les joueurs pour la manche actuelle
  playerRoundStates: Record<string, PlayerRoundState>;
  
  // Historique des résultats de manche (pour la barre visuelle)
  roundHistory: RoundResult[];
}

/** ----------------- Interfaces de Gifting ----------------- */

// Interface pour la saisie de l'achat d'équipement, y compris le gifting
export interface PurchaseInput {
  playerId: string; // L'acheteur
  itemBoughtId: string;
  // Si null, l'achat est pour le joueur lui-même
  recipientId: string | null; 
}

// L'export de l'interface MatchState est la principale source de vérité.