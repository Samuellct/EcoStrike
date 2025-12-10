import { useState, useEffect } from 'react';
import { MatchDashboard } from './components/MatchDashboard';
import { PlayerTable } from './components/PlayerTable';
import { EquipmentPurchase } from './components/EquipmentPurchase';
import { RoundTransition } from './components/RoundTransition';
import { Player, PlayerRound, MatchState, RoundResult } from './types';
import { ECONOMIC_CONSTANTS, STARTING_PISTOLS } from './data/cs2Equipment';
import {
  calculateBuyValue,
  calculateRoundReward,
  getNextLossStreak,
} from './utils/economicCalculations';
import { ArrowRight } from 'lucide-react';

function initializeMatch(): MatchState {
  const players: Player[] = [];
  const playerRounds: Record<string, PlayerRound> = {};

  for (let i = 1; i <= 5; i++) {
    const ctPlayer: Player = {
      id: `ct-${i}`,
      name: '',
      team: 'CT',
      position: i,
      startingPistol: 'USP-S',
    };
    players.push(ctPlayer);

    playerRounds[ctPlayer.id] = {
      playerId: ctPlayer.id,
      money: ECONOMIC_CONSTANTS.startingMoney,
      buyValue: 0,
      isAlive: true,
      armor: 'none',
      primaryWeapon: '',
      secondaryWeapon: '',
      grenades: [],
      hasDefuseKit: false,
      hasZeus: false,
    };
  }

  for (let i = 1; i <= 5; i++) {
    const tPlayer: Player = {
      id: `t-${i}`,
      name: '',
      team: 'T',
      position: i,
      startingPistol: 'Glock-18',
    };
    players.push(tPlayer);

    playerRounds[tPlayer.id] = {
      playerId: tPlayer.id,
      money: ECONOMIC_CONSTANTS.startingMoney,
      buyValue: 0,
      isAlive: true,
      armor: 'none',
      primaryWeapon: '',
      secondaryWeapon: '',
      grenades: [],
      hasDefuseKit: false,
      hasZeus: false,
    };
  }

  return {
    currentRound: 1,
    ctScore: 0,
    tScore: 0,
    ctLossStreak: 0,
    tLossStreak: 0,
    players,
    playerRounds,
  };
}

function App() {
  const [matchState, setMatchState] = useState<MatchState>(() => initializeMatch());
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showRoundTransition, setShowRoundTransition] = useState(false);

  const updatePlayerRound = (playerId: string, updates: Partial<PlayerRound>) => {
    setMatchState(prev => {
      const updatedPlayerRound = { ...prev.playerRounds[playerId], ...updates };
      const buyValue = calculateBuyValue(updatedPlayerRound);
      const originalMoney = prev.playerRounds[playerId].money + prev.playerRounds[playerId].buyValue;
      const newMoney = originalMoney - buyValue;

      return {
        ...prev,
        playerRounds: {
          ...prev.playerRounds,
          [playerId]: {
            ...updatedPlayerRound,
            buyValue,
            money: newMoney,
          },
        },
      };
    });
  };

  const updatePlayerName = (playerId: string, name: string) => {
    setMatchState(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId ? { ...p, name } : p
      ),
    }));
  };

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

  const handleNextRound = (result: RoundResult, survivorIds: string[]) => {
    setMatchState(prev => {
      const ctReward = calculateRoundReward(result, 'CT', prev.ctLossStreak);
      const tReward = calculateRoundReward(result, 'T', prev.tLossStreak);

      const newPlayerRounds: Record<string, PlayerRound> = {};

      prev.players.forEach(player => {
        const currentRound = prev.playerRounds[player.id];
        const isAlive = currentRound.isAlive;
        const reward = player.team === 'CT' ? ctReward : tReward;

        if (isAlive) {
          newPlayerRounds[player.id] = {
            ...currentRound,
            money: currentRound.money + reward,
            buyValue: currentRound.buyValue,
          };
        } else {
          newPlayerRounds[player.id] = {
            playerId: player.id,
            money: currentRound.money + reward,
            buyValue: 0,
            isAlive: true,
            armor: 'none',
            primaryWeapon: '',
            secondaryWeapon: '',
            grenades: [],
            hasDefuseKit: false,
            hasZeus: false,
          };
        }
      });

      return {
        ...prev,
        currentRound: prev.currentRound + 1,
        ctScore: result.winner === 'CT' ? prev.ctScore + 1 : prev.ctScore,
        tScore: result.winner === 'T' ? prev.tScore + 1 : prev.tScore,
        ctLossStreak: getNextLossStreak(prev.ctLossStreak, result.winner === 'CT'),
        tLossStreak: getNextLossStreak(prev.tLossStreak, result.winner === 'T'),
        playerRounds: newPlayerRounds,
      };
    });

    setShowRoundTransition(false);
  };

  const selectedPlayer = matchState.players.find(p => p.id === selectedPlayerId);

  return (
    <div className="min-h-screen bg-gray-100">
      <MatchDashboard
        currentRound={matchState.currentRound}
        ctScore={matchState.ctScore}
        tScore={matchState.tScore}
        ctLossStreak={matchState.ctLossStreak}
        tLossStreak={matchState.tLossStreak}
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
          onClick={() => setShowRoundTransition(true)}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-3 shadow-lg"
        >
          <span className="text-lg">Next Round</span>
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      {selectedPlayer && selectedPlayerId && (
        <EquipmentPurchase
          player={selectedPlayer}
          playerRound={matchState.playerRounds[selectedPlayerId]}
          onUpdate={(updates) => updatePlayerRound(selectedPlayerId, updates)}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}

      {showRoundTransition && (
        <RoundTransition
          players={matchState.players}
          playerRounds={matchState.playerRounds}
          onNextRound={handleNextRound}
          onClose={() => setShowRoundTransition(false)}
          onUpdatePlayerAlive={updatePlayerAlive}
        />
      )}
    </div>
  );
}

export default App;
