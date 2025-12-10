// src/types.ts

// --- Définitions de Base ---

export type Team = 'CT' | 'T';

// --- Types pour les Joueurs et l'État du Round ---

export type Player = {
  id: string;
  name: string;
  team: Team;
  position: number; // Pour l'ordre d'affichage
};

// État spécifique du joueur pour le round en cours
export type PlayerRound = {
  money: number;
  equipmentValue: number; // Valeur totale de l'équipement (Kevlar + Armes + Utilitaire)
  isAlive: boolean; // Si le joueur a survécu au round précédent
  // Ajout de 'kills' ou 'deaths' peut être géré ici ou au niveau de MatchState,
  // mais la transition s'occupe des kills pour l'économie.
};


// --- Types pour l'Équipement et l'Économie ---

export type Equipment = {
    id: string;
    name: string;
    team: Team | 'ALL'; // CT, T, ou disponible pour les deux
    price: number;
    // Peut ajouter une propriété pour la récompense de kill si on veut un suivi précis
    killReward?: number; 
};

// --- Types pour les Résultats de Round ---

export type RoundResult = {
  winner: Team;
  winType: 'elimination' | 'objective' | 'time'; // Élimination, Objectif (Bomb/Defuse), Temps Expiré
  bombPlanted: boolean; // True si la bombe a été plantée à un moment donné
  // Note: La fonction onNextRound passe les kills séparément.
};

// --- État Global du Match ---

export type MatchState = {
  currentRound: number;
  phase: 'buy' | 'freeze' | 'action'; // Phase du jeu
  teamScores: Record<Team, number>;
  teamLossStreaks: Record<Team, number>; // La série de défaites pour calculer le bonus
  roundHistory: RoundResult[]; // L'historique des résultats de round
  
  // Tableau de tous les joueurs
  players: Player[];
  
  // État du round pour chaque joueur (argent, équipement, survie)
  playerRounds: Record<string, PlayerRound>; 
};