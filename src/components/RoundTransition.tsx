import { X, CheckCircle, XCircle, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Player, PlayerRound, RoundResult, Team, KillInputMode, DetailedKill } from '../types';
import { getAllWeaponNames } from '../data/cs2Equipment';

interface RoundTransitionProps {
  players: Player[];
  playerRounds: Record<string, PlayerRound>;
  onNextRound: (result: RoundResult) => void;
  onClose: () => void;
  onUpdatePlayerRound: (playerId: string, updates: Partial<PlayerRound>) => void;
}

export function RoundTransition({
  players,
  playerRounds,
  onNextRound,
  onClose,
  onUpdatePlayerRound,
}: RoundTransitionProps) {
  const [winner, setWinner] = useState<Team>('CT');
  const [winType, setWinType] = useState<'elimination' | 'objective' | 'time'>('elimination');
  const [bombPlanted, setBombPlanted] = useState(false);
  const [planterId, setPlanterId] = useState<string>('');
  const [defuserId, setDefuserId] = useState<string>(''); // ✅ Ajout défuseur

  const allWeapons = getAllWeaponNames();

  const handleSubmit = () => {
    const survivorIds = players
      .filter(p => playerRounds[p.id]?.isAlive)
      .map(p => p.id);

    onNextRound({
      winner,
      winType,
      bombPlanted,
      planterId: planterId || undefined,
      defuserId: defuserId || undefined, // ✅ Ajout défuseur
      survivorIds,
    });
  };

  const toggleAlive = (playerId: string) => {
    const pr = playerRounds[playerId];
    onUpdatePlayerRound(playerId, { isAlive: !pr.isAlive });
  };

  const toggleKillInputMode = (playerId: string) => {
    const pr = playerRounds[playerId];
    const newMode: KillInputMode = pr.killInputMode === 'raw' ? 'detailed' : 'raw';
    onUpdatePlayerRound(playerId, {
      killInputMode: newMode,
      rawKillReward: 0,
      detailedKills: [],
    });
  };

  const updateRawKillReward = (playerId: string, value: number) => {
    onUpdatePlayerRound(playerId, { rawKillReward: value });
  };

  const addDetailedKill = (playerId: string, weapon: string, count: number) => {
    const pr = playerRounds[playerId];
    const existing = pr.detailedKills.find(k => k.weapon === weapon);
    
    if (existing) {
      const updated = pr.detailedKills.map(k =>
        k.weapon === weapon ? { ...k, count: k.count + count } : k
      );
      onUpdatePlayerRound(playerId, { detailedKills: updated });
    } else {
      onUpdatePlayerRound(playerId, {
        detailedKills: [...pr.detailedKills, { weapon, count }],
      });
    }
  };

  const removeDetailedKill = (playerId: string, weapon: string) => {
    const pr = playerRounds[playerId];
    onUpdatePlayerRound(playerId, {
      detailedKills: pr.detailedKills.filter(k => k.weapon !== weapon),
    });
  };

  const ctPlayers = players.filter(p => p.team === 'CT').sort((a, b) => a.position - b.position);
  const tPlayers = players.filter(p => p.team === 'T').sort((a, b) => a.position - b.position);

  const renderPlayerRow = (player: Player) => {
    const pr = playerRounds[player.id];
    if (!pr) return null;

    const [selectedWeapon, setSelectedWeapon] = useState<string>(allWeapons[0]);
    const [killCount, setKillCount] = useState<number>(1);

    return (
      <div key={player.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        {/* Player Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-bold px-2 py-1 rounded ${
                player.team === 'CT'
                  ? 'bg-cyan-100 text-cyan-700'
                  : 'bg-orange-100 text-orange-700'
              }`}
            >
              {player.team}
            </span>
            <span className="font-semibold text-gray-900">
              {player.name || `${player.team} ${player.position}`}
            </span>
          </div>

          {/* Alive/Dead Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => toggleAlive(player.id)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 text-sm ${
                pr.isAlive
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Vivant
            </button>
            <button
              onClick={() => toggleAlive(player.id)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 text-sm ${
                !pr.isAlive
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <XCircle className="w-4 h-4" />
              Mort
            </button>
          </div>
        </div>

        {/* Kill Input Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Mode de saisie:</span>
          <button
            onClick={() => toggleKillInputMode(player.id)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              pr.killInputMode === 'raw'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Brut ($)
          </button>
          <button
            onClick={() => toggleKillInputMode(player.id)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              pr.killInputMode === 'detailed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Détaillé (Armes)
          </button>
        </div>

        {/* Raw Input Mode */}
        {pr.killInputMode === 'raw' && (
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Montant total des kill rewards ($):
            </label>
            <input
              type="number"
              value={pr.rawKillReward}
              onChange={(e) => updateRawKillReward(player.id, parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
              min="0"
            />
          </div>
        )}

        {/* Detailed Input Mode */}
        {pr.killInputMode === 'detailed' && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <select
                value={selectedWeapon}
                onChange={(e) => setSelectedWeapon(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {allWeapons.map(weapon => (
                  <option key={weapon} value={weapon}>
                    {weapon}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={killCount}
                onChange={(e) => setKillCount(parseInt(e.target.value) || 1)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                min="1"
                placeholder="Nb"
              />
              <button
                onClick={() => {
                  addDetailedKill(player.id, selectedWeapon, killCount);
                  setKillCount(1);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-1 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            {/* Display detailed kills */}
            {pr.detailedKills.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-2 space-y-1">
                {pr.detailedKills.map((kill, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm bg-white px-2 py-1 rounded"
                  >
                    <span>
                      <strong>{kill.count}x</strong> {kill.weapon}
                    </span>
                    <button
                      onClick={() => removeDetailedKill(player.id, kill.weapon)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-2xl font-bold text-gray-900">Transition de Manche</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(90vh-8rem)] overflow-y-auto">
          {/* Winner Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Vainqueur</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setWinner('T')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                    winner === 'T'
                      ? 'border-orange-600 bg-orange-600 text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Terroristes
                </button>
                <button
                  onClick={() => setWinner('CT')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                    winner === 'CT'
                      ? 'border-cyan-600 bg-cyan-600 text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Anti-Terroristes
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Type de victoire</h3>
              <select
                value={winType}
                onChange={(e) => setWinType(e.target.value as any)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="elimination">Élimination</option>
                <option value="objective">Objectif (Bombe)</option>
                <option value="time">Temps écoulé</option>
              </select>
            </div>
          </div>

          {/* Bomb Planted */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={bombPlanted}
                onChange={(e) => {
                  setBombPlanted(e.target.checked);
                  if (!e.target.checked) setPlanterId('');
                }}
                className="w-5 h-5"
              />
              <span className="font-medium text-gray-900">La bombe a été plantée</span>
            </label>

            {bombPlanted && (
              <div>
                <label className="block text-sm text-gray-600 mb-2">Planteur (recevra +$300):</label>
                <select
                  value={planterId}
                  onChange={(e) => setPlanterId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Aucun / Non spécifié</option>
                  {tPlayers.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name || `T ${player.position}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* ✅ AJOUT: Défuseur CT */}
            {winner === 'CT' && winType === 'objective' && (
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm text-gray-600 mb-2">
                  Défuseur CT (recevra +$300):
                </label>
                <select
                  value={defuserId}
                  onChange={(e) => setDefuserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Aucun / Non spécifié</option>
                  {ctPlayers.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name || `CT ${player.position}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Player Status */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Statut des Joueurs et Kill Rewards
            </h3>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-orange-900 mb-2">Terroristes</h4>
              <div className="space-y-2">
                {tPlayers.map(renderPlayerRow)}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-cyan-900 mb-2">Anti-Terroristes</h4>
              <div className="space-y-2">
                {ctPlayers.map(renderPlayerRow)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-white transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Manche Suivante
          </button>
        </div>
      </div>
    </div>
  );
}