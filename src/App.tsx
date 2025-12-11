import { useState, useEffect } from 'react';
import { Settings, Play } from 'lucide-react';
import { MatchDashboard } from './components/MatchDashboard';
import { PlayerTable } from './components/PlayerTable';
import { EquipmentPurchase } from './components/EquipmentPurchase';
import { RoundTransition } from './components/RoundTransition';
import { Player, PlayerRound, MatchState, RoundResult, GameMode, GamePhase } from './types';
import { ECONOMIC_CONSTANTS } from './data/cs2Equipment';
import {
  calculateBuyValue,
  calculateRoundReward,
  getNextLossStreak,
  calculatePlayerKillReward,
  calculateTotalTKills,
} from './utils/economicCalculations';

function initializeMatch(gameMode: GameMode): MatchState {
  const players: Player[] = [];
  const playerRounds: Record<string, PlayerRound> = {};
  const ctSideIds: string[] = [];
  const tSideIds: string[] = [];

  for (let i = 1; i <= 5; i++) {
    const ctPlayer: Player = {
      id: `ct-${i}`,
      name: '',
      team: 'CT',
      position: i,
      startingPistol: 'USP-S',
    };
    players.push(ctPlayer);
    ctSideIds.push(ctPlayer.id);

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
      killInputMode: 'raw',
      rawKillReward: 0,
      detailedKills: [],
      savedEquipment: null,
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
    tSideIds.push(tPlayer.id);

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
      killInputMode: 'raw',
      rawKillReward: 0,
      detailedKills: [],
      savedEquipment: null,
    };
  }

  return {
    gameMode,
    gamePhase: 'config',
    currentRound: 1,
    ctScore: 0,
    tScore: 0,
    ctLossStreak: 0,
    tLossStreak: 0,
    players,
    playerRounds,
    roundHistory: [],
    timer: 15,
    isOvertime: false,
    overtimeRounds: 0,
    ctSideIds,
    tSideIds,
  };
}

function App() {
  const [matchState, setMatchState] = useState<MatchState>(() => initializeMatch('competitive'));
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showRoundTransition, setShowRoundTransition] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // ============ TIMER LOGIC ============
  useEffect(() => {
    if (matchState.gamePhase !== 'freezetime' && matchState.gamePhase !== 'round') {
      return;
    }

    const interval = setInterval(() => {
      setMatchState(prev => {
        if (prev.timer <= 1) {
          if (prev.gamePhase === 'freezetime') {
            return { ...prev, gamePhase: 'round', timer: 115 };
          } else {
            return { ...prev, gamePhase: 'ended', timer: 0 };
          }
        }
        return { ...prev, timer: prev.timer - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [matchState.gamePhase, matchState.timer]);

  // ============ CONFIGURATION ============
  const handleStartGame = () => {
    setMatchState(prev => ({
      ...prev,
      gamePhase: 'freezetime',
      timer: 15,
    }));
  };

  const updatePlayerPistol = (playerId: string, pistol: string) => {
    setMatchState(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId ? { ...p, startingPistol: pistol } : p
      ),
      playerRounds: {
        ...prev.playerRounds,
        [playerId]: {
          ...prev.playerRounds[playerId],
          secondaryWeapon: '',
        },
      },
    }));
  };

  // ============ PLAYER UPDATES ============
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

  // ============ ROUND TRANSITION ============
  const handleNextRound = (result: RoundResult) => {
    setMatchState(prev => {
      const newCTScore = result.winner === 'CT' ? prev.ctScore + 1 : prev.ctScore;
      const newTScore = result.winner === 'T' ? prev.tScore + 1 : prev.tScore;
      const newRoundHistory = [...prev.roundHistory, result.winner];

      // Calculer le bonus CT partagé (si des T sont morts)
      const tPlayerIds = prev.players.filter(p => p.team === 'T').map(p => p.id);
      const totalTKills = calculateTotalTKills(tPlayerIds, prev.playerRounds);
      const ctSharedBonus = totalTKills * ECONOMIC_CONSTANTS.ctTeamKillBonus;

      // Nouveaux loss streaks
      const newCTLossStreak = getNextLossStreak(prev.ctLossStreak, result.winner === 'CT');
      const newTLossStreak = getNextLossStreak(prev.tLossStreak, result.winner === 'T');

      // Calculer les rewards
      const newPlayerRounds: Record<string, PlayerRound> = {};

      prev.players.forEach(player => {
        const currentRound = prev.playerRounds[player.id];
        const isAlive = result.survivorIds.includes(player.id);
        
        // Kill rewards
        const killReward = calculatePlayerKillReward(currentRound);
        
        // Bonus CT partagé (50$ par mort // A VERIF)
        const sharedBonus = player.team === 'CT' ? ctSharedBonus : 0;
        
        // Round reward
        const roundReward = calculateRoundReward(
          result,
          player.team,
          player.team === 'CT' ? prev.ctLossStreak : prev.tLossStreak,
          player.id
        );

        const totalReward = killReward + sharedBonus + roundReward;

        if (isAlive) {
          // Survivant: garde son equipement
          newPlayerRounds[player.id] = {
            ...currentRound,
            money: currentRound.money + totalReward,
            killInputMode: 'raw',
            rawKillReward: 0,
            detailedKills: [],
            savedEquipment: null,
          };
        } else {
          // Mort: perd tout sauf argent
          newPlayerRounds[player.id] = {
            playerId: player.id,
            money: currentRound.money + totalReward,
            buyValue: 0,
            isAlive: true,
            armor: 'none',
            primaryWeapon: '',
            secondaryWeapon: '',
            grenades: [],
            hasDefuseKit: false,
            hasZeus: false,
            killInputMode: 'raw',
            rawKillReward: 0,
            detailedKills: [],
            savedEquipment: null,
          };
        }
      });

      const nextRound = prev.currentRound + 1;

      // ============ HALFTIME : Round 13 ============
      if (nextRound === 13) {
        // Swap sides
        const newCTSideIds = [...prev.tSideIds];
        const newTSideIds = [...prev.ctSideIds];

        // Reset money à 800$
        Object.keys(newPlayerRounds).forEach(playerId => {
          const player = prev.players.find(p => p.id === playerId)!;
          const newTeam = newCTSideIds.includes(playerId) ? 'CT' : 'T';
          const pistol = player.startingPistol;

          newPlayerRounds[playerId] = {
            playerId,
            money: ECONOMIC_CONSTANTS.halftimeMoney,
            buyValue: 0,
            isAlive: true,
            armor: 'none',
            primaryWeapon: '',
            secondaryWeapon: '',
            grenades: [],
            hasDefuseKit: false,
            hasZeus: false,
            killInputMode: 'raw',
            rawKillReward: 0,
            detailedKills: [],
            savedEquipment: null,
          };
        });

        // Update player teams
        const newPlayers = prev.players.map(p => ({
          ...p,
          team: newCTSideIds.includes(p.id) ? 'CT' as const : 'T' as const,
        }));

        return {
          ...prev,
          currentRound: nextRound,
          ctScore: newCTScore,
          tScore: newTScore,
          roundHistory: newRoundHistory,
          ctLossStreak: 0,
          tLossStreak: 0,
          playerRounds: newPlayerRounds,
          players: newPlayers,
          ctSideIds: newCTSideIds,
          tSideIds: newTSideIds,
          gamePhase: 'freezetime',
          timer: 15,
        };
      }

      // ============ GAME END / OVERTIME ============
      let shouldEnterOvertime = false;
      let gameOver = false;

      if (prev.gameMode === 'competitive') {
        if (newCTScore === 13 || newTScore === 13) {
          gameOver = true;
        } else if (newCTScore === 12 && newTScore === 12) {
          gameOver = true;
        }
      } else if (prev.gameMode === 'premier') {
        if (!prev.isOvertime) {
          if (newCTScore === 13 || newTScore === 13) {
            gameOver = true;
          } else if (newCTScore === 12 && newTScore === 12) {
            shouldEnterOvertime = true;
          }
        } else {
          if (newCTScore === 16 || newTScore === 16) {
            gameOver = true;
          } else if (newCTScore === 15 && newTScore === 15) {
            gameOver = true;
          }

          // Swap every 3 overtime rounds
          const newOvertimeRounds = prev.overtimeRounds + 1;
          if (newOvertimeRounds % 3 === 0 && !gameOver) {
            const swappedCTIds = [...prev.tSideIds];
            const swappedTIds = [...prev.ctSideIds];

            const swappedPlayers = prev.players.map(p => ({
              ...p,
              team: swappedCTIds.includes(p.id) ? 'CT' as const : 'T' as const,
            }));

            return {
              ...prev,
              currentRound: nextRound,
              ctScore: newCTScore,
              tScore: newTScore,
              roundHistory: newRoundHistory,
              ctLossStreak: newCTLossStreak,
              tLossStreak: newTLossStreak,
              playerRounds: newPlayerRounds,
              players: swappedPlayers,
              ctSideIds: swappedCTIds,
              tSideIds: swappedTIds,
              overtimeRounds: newOvertimeRounds,
              gamePhase: 'freezetime',
              timer: 15,
            };
          }
        }
      }

      if (gameOver) {
        alert(`Match terminé! Score final: CT ${newCTScore} - ${newTScore} T`);
      }

      // ============ ENTER OVERTIME ============
      if (shouldEnterOvertime) {
        Object.keys(newPlayerRounds).forEach(playerId => {
          newPlayerRounds[playerId] = {
            ...newPlayerRounds[playerId],
            money: ECONOMIC_CONSTANTS.overtimeMoney,
            buyValue: 0,
            armor: 'none',
            primaryWeapon: '',
            secondaryWeapon: '',
            grenades: [],
            hasDefuseKit: false,
            hasZeus: false,
          };
        });

        return {
          ...prev,
          currentRound: nextRound,
          ctScore: newCTScore,
          tScore: newTScore,
          roundHistory: newRoundHistory,
          ctLossStreak: 0,
          tLossStreak: 0,
          playerRounds: newPlayerRounds,
          isOvertime: true,
          overtimeRounds: 0,
          gamePhase: 'freezetime',
          timer: 15,
        };
      }

      // ============ NORMAL ROUND PROGRESSION ============
      return {
        ...prev,
        currentRound: nextRound,
        ctScore: newCTScore,
        tScore: newTScore,
        roundHistory: newRoundHistory,
        ctLossStreak: newCTLossStreak,
        tLossStreak: newTLossStreak,
        playerRounds: newPlayerRounds,
        gamePhase: 'freezetime',
        timer: 15,
      };
    });

    setShowRoundTransition(false);
  };

  const selectedPlayer = matchState.players.find(p => p.id === selectedPlayerId);

  // ============ CONFIG SCREEN ============
  if (matchState.gamePhase === 'config') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          <h1 className="text-5xl font-bold text-center mb-2">
            <span className="text-orange-500">Eco</span>
            <span className="text-cyan-500">Strike</span>
            <span className="text-gray-400">.gg</span>
          </h1>
          <p className="text-center text-gray-400 mb-8">CS2 Economy Tracker & Simulator</p>

          <div className="bg-gray-800 rounded-xl p-8 shadow-2xl space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Mode de Jeu</label>
              <select
                value={matchState.gameMode}
                onChange={(e) => setMatchState(prev => ({ ...prev, gameMode: e.target.value as GameMode }))}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="competitive">Compétitif Standard (MR12)</option>
                <option value="premier">Premier (MR12 + Overtime)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Pistolets CT par Défaut
              </label>
              {matchState.players.filter(p => matchState.ctSideIds.includes(p.id)).map(player => (
                <div key={player.id} className="flex items-center justify-between mb-2 bg-gray-700 rounded-lg px-4 py-2">
                  <span className="text-cyan-400 font-medium">CT Player {player.position}</span>
                  <select
                    value={player.startingPistol}
                    onChange={(e) => updatePlayerPistol(player.id, e.target.value)}
                    className="bg-gray-600 text-white px-3 py-1 rounded border border-gray-500"
                  >
                    <option value="USP-S">USP-S</option>
                    <option value="P2000">P2000</option>
                  </select>
                </div>
              ))}
            </div>

            <button
              onClick={handleStartGame}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-3 shadow-lg"
            >
              <Play size={24} />
              Démarrer le Match
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ MAIN GAME UI ============
  return (
    <div className="min-h-screen bg-gray-100">
      <MatchDashboard
        matchState={matchState}
        onShowConfig={() => setShowConfig(true)}
      />

      <PlayerTable
        players={matchState.players}
        playerRounds={matchState.playerRounds}
        ctLossStreak={matchState.ctLossStreak}
        tLossStreak={matchState.tLossStreak}
        onPlayerNameChange={updatePlayerName}
        onEquipmentClick={setSelectedPlayerId}
      />

      <div className="max-w-7xl mx-auto px-6 py-6">
        <button
          onClick={() => setShowRoundTransition(true)}
          disabled={matchState.gamePhase !== 'ended'}
          className={`w-full font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-3 shadow-lg ${
            matchState.gamePhase === 'ended'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white animate-pulse'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span className="text-lg">Manche Suivante</span>
        </button>
      </div>

      {selectedPlayer && selectedPlayerId && (
        <EquipmentPurchase
          player={selectedPlayer}
          playerRound={matchState.playerRounds[selectedPlayerId]}
          allPlayers={matchState.players}
          allPlayerRounds={matchState.playerRounds}
          onUpdate={(updates) => updatePlayerRound(selectedPlayerId, updates)}
          onGift={(fromId, toId, item, cost) => {
            // Déduire l'argent de l'acheteur
            setMatchState(prev => ({
              ...prev,
              playerRounds: {
                ...prev.playerRounds,
                [fromId]: {
                  ...prev.playerRounds[fromId],
                  money: prev.playerRounds[fromId].money - cost,
                  buyValue: prev.playerRounds[fromId].buyValue + cost,
                },
              },
            }));
          }}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}

      {showRoundTransition && (
        <RoundTransition
          players={matchState.players}
          playerRounds={matchState.playerRounds}
          onNextRound={handleNextRound}
          onClose={() => setShowRoundTransition(false)}
          onUpdatePlayerRound={updatePlayerRound}
        />
      )}
    </div>
  );
}

export default App;