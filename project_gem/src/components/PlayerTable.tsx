// src/components/PlayerTable.tsx

import { ShoppingCart, Shield, Skull, HandHelping, Banknote } from 'lucide-react';
import { useMemo } from 'react';
import { useMatchState } from '../state/MatchContext';
import { Player } from '../types'; // Import de Player
import { getItemById } from '../data/cs2Equipment'; // Utile pour afficher les noms d'items

// Interface des props simplifiée (le reste vient du contexte)
interface PlayerTableProps {
  // onPlayerNameChange et onEquipmentClick ne sont plus des callbacks directes
  // onEquipmentClick est maintenant géré dans App.tsx (setSelectedPlayerId)
  onEquipmentClick: (playerId: string) => void; 
}

export function PlayerTable({
  onEquipmentClick,
}: PlayerTableProps) {
  // Récupération de l'état global et du dispatch
  const { state, dispatch } = useMatchState();
  const { players, playerRoundStates } = state;

  // Fonctions de tri mémorisées
  const ctPlayers = useMemo(() => 
    players.filter(p => p.team === 'CT').sort((a, b) => a.position - b.position), 
    [players]
  );
  
  const tPlayers = useMemo(() => 
    players.filter(p => p.team === 'T').sort((a, b) => a.position - b.position), 
    [players]
  );
  
  // Fonction de gestion du changement de nom
  const handlePlayerNameChange = (playerId: string, newName: string) => {
    // Cette fonction ne modifie pas l'état économique, mais l'état `Player` global.
    // Pour l'instant, nous ne gérons pas cette action dans le Reducer, car elle est purement cosmétique.
    // Si nous devions la gérer dans le Reducer (pour l'immutabilité complète), ce serait une action `UPDATE_PLAYER_NAME`.
    // Pour rester fonctionnel rapidement, nous ne laissons que le hook qui sera implémenté dans un futur `MatchContext`.
    console.log(`ACTION REQUIRED: Implement UPDATE_PLAYER_NAME for player ${playerId}`);
  };

  /**
   * Extrait et formate l'équipement d'un joueur à partir de son inventaire GameItem[].
   */
  const getEquipmentSummary = (player: Player) => {
    const pr = playerRoundStates[player.id];
    if (!pr || pr.inventory.length === 0) return { summary: 'No equipment', color: 'text-gray-400' };

    let primary = pr.inventory.find(item => ['Rifle', 'Sniper', 'Shotgun', 'LMG'].includes(item.type));
    let secondary = pr.inventory.find(item => item.type === 'Pistol' && item.id !== player.defaultPistol.toLowerCase());
    let armor = pr.inventory.find(item => item.type === 'Armor');
    let grenades = pr.inventory.filter(item => item.type === 'Grenade').length;
    let kit = pr.inventory.find(item => item.id === 'defusekit');
    let zeus = pr.inventory.find(item => item.id === 'zeus');

    const summaryParts: string[] = [];

    if (armor) summaryParts.push(armor.name.replace('Armure ', '')); // Ex: Vest+Helmet
    if (primary) summaryParts.push(primary.name);
    if (secondary) summaryParts.push(secondary.name);
    if (grenades > 0) summaryParts.push(`${grenades} nades`);
    if (kit) summaryParts.push('Kit');
    if (zeus) summaryParts.push('Zeus');

    return { summary: summaryParts.join(', '), color: 'text-gray-600' };
  };
  
  /**
   * Affiche l'argent minimum garanti.
   */
  const renderGuaranteedMoney = (playerId: string) => {
      const pr = playerRoundStates[playerId];
      if (!pr || pr.minimumGuaranteedNextRound === 0) return null;
      
      return (
          <span title="Minimum guaranteed money next round (if loss)" className="ml-2 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Banknote className="w-3 h-3" />
              ${pr.minimumGuaranteedNextRound.toLocaleString()}
          </span>
      );
  };
  

  const renderPlayerRow = (player: Player) => {
    const pr = playerRoundStates[player.id];
    if (!pr) return null;

    const { summary, color } = getEquipmentSummary(player);
    const teamColor = player.team === 'CT' ? 'blue' : 'red';

    return (
      <tr key={player.id} className="hover:bg-gray-50 transition-colors">
        {/* Nom du Joueur */}
        <td className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${player.team === 'CT' ? 'text-blue-600' : 'text-red-600'}`}>
              {player.team}
            </span>
            <input
              type="text"
              value={player.name}
              // Temporairement, nous appelons une console.log/stub
              onChange={(e) => handlePlayerNameChange(player.id, e.target.value)} 
              placeholder={`${player.team} Player ${player.position}`}
              className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
            />
          </div>
        </td>

        {/* Argent Actuel */}
        <td className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className={`text-lg font-bold ${pr.money < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              ${pr.money.toLocaleString()}
            </div>
             {renderGuaranteedMoney(player.id)}
          </div>
        </td>

        {/* Valeur d'Achat */}
        <td className="px-4 py-3 border-b border-gray-200">
          <div className="text-lg font-semibold text-gray-700">
            ${pr.buyValue.toLocaleString()}
          </div>
        </td>

        {/* Équipement */}
        <td className="px-4 py-3 border-b border-gray-200">
          <div className={`flex items-center gap-2 text-sm ${color}`}>
            <Shield className="w-4 h-4" />
            <span>{summary}</span>
          </div>
        </td>

        {/* Action (Bouton Buy) */}
        <td className="px-4 py-3 border-b border-gray-200">
          {/* Le bouton Buy n'est actif que pendant le FreezeTime ou OvertimeStart */}
          {(state.phase === 'FreezeTime' || state.phase === 'OvertimeStart') ? (
              <button
                onClick={() => onEquipmentClick(player.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  player.team === 'CT'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                Buy
              </button>
          ) : (
             <button
                disabled
                className="px-4 py-2 rounded-lg font-medium text-gray-400 bg-gray-100 cursor-not-allowed flex items-center gap-2"
             >
                <ShoppingCart className="w-4 h-4" />
                Buy Disabled
             </button>
          )}
        </td>

        {/* Statut */}
        <td className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {pr.isAlive ? (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Alive
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium flex items-center gap-1">
                <Skull className="w-3 h-3" />
                Dead
              </span>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Player</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Money</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Buy Value</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Equipment</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-blue-50">
              <td colSpan={6} className="px-4 py-2">
                <div className="text-sm font-bold text-blue-900">Counter-Terrorists</div>
              </td>
            </tr>
            {ctPlayers.map(renderPlayerRow)}
            <tr className="bg-red-50">
              <td colSpan={6} className="px-4 py-2">
                <div className="text-sm font-bold text-red-900">Terrorists</div>
              </td>
            </tr>
            {tPlayers.map(renderPlayerRow)}
          </tbody>
        </table>
      </div>
    </div>
  );
}