import { Player, PlayerRound, Team } from '../types';
import { calculateLossBonus } from '../utils/economicCalculations'; // Nouvelle fonction importée

interface MatchDashboardProps {
  currentRound: number;
  // Les scores et séries de défaites sont passés séparément pour la clarté de l'UI
  ctScore: number;
  tScore: number;
  ctLossStreak: number;
  tLossStreak: number;
  players: Player[];
  playerRounds: Record<string, PlayerRound>;
}

export function MatchDashboard({
  currentRound,
  ctScore,
  tScore,
  ctLossStreak,
  tLossStreak,
  players,
  playerRounds,
}: MatchDashboardProps) {
  const ctPlayers = players.filter(p => p.team === 'CT');
  const tPlayers = players.filter(p => p.team === 'T');

  // --- Calculs des Totaux d'Équipe ---

  const ctTotalMoney = ctPlayers.reduce((sum, p) => {
    const pr = playerRounds[p.id];
    return sum + (pr?.money || 0);
  }, 0);

  const tTotalMoney = tPlayers.reduce((sum, p) => {
    const pr = playerRounds[p.id];
    return sum + (pr?.money || 0);
  }, 0);

  // Utilisation de equipmentValue à la place de buyValue
  const ctTotalEquipmentValue = ctPlayers.reduce((sum, p) => {
    const pr = playerRounds[p.id];
    return sum + (pr?.equipmentValue || 0);
  }, 0);

  // Utilisation de equipmentValue à la place de buyValue
  const tTotalEquipmentValue = tPlayers.reduce((sum, p) => {
    const pr = playerRounds[p.id];
    return sum + (pr?.equipmentValue || 0);
  }, 0);
  
  // --- Bonus de Perte Garanti pour le Prochain Round ---
  // On calcule le bonus de perte que l'équipe recevra si elle perd le round ACTUEL.
  // Note: ctLossStreak et tLossStreak représentent la série de défaites AVANT le round actuel.
  // Si ctLossStreak = 0, la prochaine perte (série 1) donnera $1400.
  
  // La série de défaites pour le prochain round sera (série actuelle + 1), clampée à 4
  const ctLossStreakForNextRound = Math.min(4, ctLossStreak + 1);
  const tLossStreakForNextRound = Math.min(4, tLossStreak + 1);
  
  // On utilise la fonction de calcul mise à jour (doit être importée)
  const ctGuaranteedBonus = calculateLossBonus(ctLossStreakForNextRound);
  const tGuaranteedBonus = calculateLossBonus(tLossStreakForNextRound);


  return (
    <div className="bg-white border-b border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          
          {/* Logo / Titre */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">EcoStrike.gg</h1>
            <p className="text-sm text-gray-500 mt-1">CS2 Economy Tracker</p>
          </div>
          
          {/* Round Actuel */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Round</div>
            <div className="text-4xl font-bold text-gray-900">{currentRound}</div>
          </div>
          
          {/* Score */}
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-sm text-blue-600 font-medium mb-1">CT Score</div>
              <div className="text-3xl font-bold text-blue-600">{ctScore}</div>
            </div>
            <div className="text-2xl text-gray-400">-</div>
            <div className="text-center">
              <div className="text-sm text-red-600 font-medium mb-1">T Score</div>
              <div className="text-3xl font-bold text-red-600">{tScore}</div>
            </div>
          </div>
        </div>

        {/* Détails Économiques des Équipes */}
        <div className="grid grid-cols-2 gap-6">
          
          {/* CT Panel */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-blue-900">Counter-Terrorists</h3>
              <div className="text-md font-semibold text-blue-700">Loss Streak: **{ctLossStreak}**</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-blue-700 mb-1">Team Cash</div>
                <div className="text-2xl font-bold text-blue-900">${ctTotalMoney.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-blue-700 mb-1">Team Value (Total Buy)</div>
                <div className="text-2xl font-bold text-blue-900">${ctTotalEquipmentValue.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-blue-700 mb-1">Guaranteed Loss Bonus (Next Round)</div>
                <div className="text-xl font-bold text-blue-900">${ctGuaranteedBonus.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* T Panel */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-red-900">Terrorists</h3>
              <div className="text-md font-semibold text-red-700">Loss Streak: **{tLossStreak}**</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-red-700 mb-1">Team Cash</div>
                <div className="text-2xl font-bold text-red-900">${tTotalMoney.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-red-700 mb-1">Team Value (Total Buy)</div>
                <div className="text-2xl font-bold text-red-900">${tTotalEquipmentValue.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-red-700 mb-1">Guaranteed Loss Bonus (Next Round)</div>
                <div className="text-xl font-bold text-red-900">${tGuaranteedBonus.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}