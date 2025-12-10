import { useState } from 'react';
import { MatchDashboard } from './components/MatchDashboard';
import { PlayerTable } from './components/PlayerTable';
import { EquipmentPurchase } from './components/EquipmentPurchase';
import { RoundTransition } from './components/RoundTransition';
import { Player, PlayerRound, MatchState, RoundResult } from './types';
import { ECONOMIC_CONSTANTS } from './data/cs2Equipment'; // Utilisation des constantes importées
import { calculateBuyValue } from './utils/economicCalculations'; // Nécessaire pour la phase d'achat
import { applyRoundEndEconomy } from './utils/economicCalculations'; // Nouvelle fonction centrale
import { ArrowRight } from 'lucide-react';

/**
 * Initialise l'état de la partie pour le début du Match (Round 1).
 */
function initializeMatch(): MatchState {
  const players: Player[] = [];
  const playerRounds: Record<string, PlayerRound> = {};

  // Création des joueurs CT
  for (let i = 1; i <= 5; i++) {
    const ctPlayer: Player = {
      id: `ct-${i}`,
      name: `CT ${i}`,
      team: 'CT',
      position: i,
    };
    players.push(ctPlayer);

    playerRounds[ctPlayer.id] = {
      playerId: ctPlayer.id,
      money: ECONOMIC_CONSTANTS.startingMoney,
      equipmentValue: 0, // Initialisation de la valeur d'équipement
      isAlive: true,
      // Équipement de départ du pistolet
      armor: 'none',
      primaryWeapon: '',
      secondaryWeapon: 'USP-S', // Pistolet de départ
      grenades: [],
      hasDefuseKit: false,
      hasZeus: false,
      kills: 0, // Initialisation des kills
    };
  }

  // Création des joueurs T
  for (let i = 1; i <= 5; i++) {
    const tPlayer: Player = {
      id: `t-${i}`,
      name: `T ${i}`,
      team: 'T',
      position: i,
    };
    players.push(tPlayer);

    playerRounds[tPlayer.id] = {
      playerId: tPlayer.id,
      money: ECONOMIC_CONSTANTS.startingMoney,
      equipmentValue: 0, // Initialisation de la valeur d'équipement
      isAlive: true,
      // Équipement de départ du pistolet
      armor: 'none',
      primaryWeapon: '',
      secondaryWeapon: 'Glock-18', // Pistolet de départ
      grenades: [],
      hasDefuseKit: false,
      hasZeus: false,
      kills: 0, // Initialisation des kills
    };
  }

  return {
    currentRound: 1,
    teamScores: { CT: 0, T: 0 }, // Score mis à jour en objet
    teamLossStreaks: { CT: 0, T: 0 }, // Series de défaites
    players,
    playerRounds,
    roundHistory: [], // Historique des résultats de round
    phase: 'buy', // Nouvelle propriété pour la phase (buy/active/transition)
  };
}

function App() {
  const [matchState, setMatchState] = useState<MatchState>(() => initializeMatch());
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isRoundTransitionOpen, setIsRoundTransitionOpen] = useState(false);

  // Gère l'achat d'équipement
  const updatePlayerRound = (playerId: string, updates: Partial<PlayerRound>) => {
    setMatchState(prev => {
      const updatedPlayerRound = { ...prev.playerRounds[playerId], ...updates };
      
      // La fonction calculeBuyValue doit être mise à jour pour utiliser les prix de l'équipement
      const equipmentValue = calculateBuyValue(updatedPlayerRound); 
      
      // L'argent dépensé est (equipmentValue - ancienne valeur d'équipement)
      const cost = equipmentValue - prev.playerRounds[playerId].equipmentValue;
      const newMoney = prev.playerRounds[playerId].money - cost;

      return {
        ...prev,
        playerRounds: {
          ...prev.playerRounds,
          [playerId]: {
            ...updatedPlayerRound,
            equipmentValue: equipmentValue, // Sauvegarder la nouvelle valeur d'équipement
            money: newMoney,
          },
        },
      };
    });
  };

  // Met à jour le nom du joueur
  const updatePlayerName = (playerId: string, name: string) => {
    setMatchState(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId ? { ...p, name } : p
      ),
    }));
  };

  // Met à jour le statut de survie (utilisé dans RoundTransition)
  const updatePlayerAlive = (playerId: string, isAlive: boolean) => {
    setMatchState(prev => ({
      ...prev,
      playerRounds: {
        ...prev.playerRounds,
        [playerId]: {
          ...prev.playerRounds[playerId],
          isAlive,
        },
      },
    }));
  };

  /**
   * Gère la fin du round, applique l'économie et passe au round suivant.
   * Signature mise à jour pour inclure les kills.
   */
  const handleNextRound = (result: RoundResult, survivorIds: string[], kills: Record<string, number>) => {
    setMatchState(prev => {
      // 1. Appliquer la logique économique et les bonus
      // Cette fonction retourne un nouvel état avec les nouveaux montants d'argent et loss streaks.
      let nextState = applyRoundEndEconomy(prev, result, kills);

      // 2. Mettre à jour les scores (basé sur le gagnant)
      const newScores = { ...prev.teamScores };
      newScores[result.winner]++;

      // 3. Logique de mi-temps et OT (simplifié: juste le changement de côté pour la mi-temps)
      // Ceci est un placeholder, la vraie logique est plus complexe (swap des équipes à R16, etc.)
      // const isHalftime = prev.currentRound === 15;
      
      return {
        ...nextState, // Contient déjà les playerRounds, money et loss streaks mis à jour
        currentRound: prev.currentRound + 1,
        teamScores: newScores,
        roundHistory: [...prev.roundHistory, result],
        phase: 'buy', // Retour à la phase d'achat
      };
    });

    setIsRoundTransitionOpen(false);
  };

  const selectedPlayer = matchState.players.find(p => p.id === selectedPlayerId);

  return (
    <div className="min-h-screen bg-gray-100">
      <MatchDashboard
        currentRound={matchState.currentRound}
        ctScore={matchState.teamScores.CT}
        tScore={matchState.teamScores.T}
        ctLossStreak={matchState.teamLossStreaks.CT}
        tLossStreak={matchState.teamLossStreaks.T}
        players={matchState.players}
        playerRounds={matchState.playerRounds}
      />

      <PlayerTable
        players={matchState.players}
        playerRounds={matchState.playerRounds}
        onPlayerNameChange={updatePlayerName}
        onEquipmentClick={setSelectedPlayerId}
      />

      <div className="max-w-7xl mx-auto px-6 py-6">
        <button
          onClick={() => setIsRoundTransitionOpen(true)}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-3 shadow-lg"
        >
          <span className="text-lg">Entrer les Résultats et Passer au Round Suivant</span>
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      {/* Modale d'Achat d'Équipement */}
      {selectedPlayer && selectedPlayerId && (
        <EquipmentPurchase
          player={selectedPlayer}
          playerRound={matchState.playerRounds[selectedPlayerId]}
          onUpdate={(updates) => updatePlayerRound(selectedPlayerId, updates)}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}

      {/* Modale de Transition de Round */}
      {isRoundTransitionOpen && (
        <RoundTransition
          players={matchState.players}
          playerRounds={matchState.playerRounds}
          // Signature mise à jour pour correspondre au composant
          onNextRound={handleNextRound} 
          onClose={() => setIsRoundTransitionOpen(false)}
          onUpdatePlayerAlive={updatePlayerAlive}
        />
      )}
    </div>
  );
}

export default App;