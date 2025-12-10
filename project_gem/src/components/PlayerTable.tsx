// src/components/PlayerTable.tsx (CORRIGÉ ET COMPLET)

import { ShoppingCart, Shield, Skull, Banknote, Edit, Swords } from 'lucide-react'; 
import React, { useMemo } from 'react';
import { useMatchState } from '../state/MatchContext';
import { Player, GameItem, PlayerRoundState, KillEntry } from '../types/index'; 
import { getItemById } from '../data/cs2Equipment';

interface InternalPlayerTableProps {
    onEquipmentClick: (playerId: string) => void;
    onPlayerNameChange: (playerId: string, name: string) => void;
}

export function PlayerTable({
  onEquipmentClick,
}: InternalPlayerTableProps) {
  const { state } = useMatchState(); 
  const { players, playerRoundStates } = state;

  // Séparer les joueurs et trier
  const ctPlayers = useMemo(() => 
    players.filter(p => p.team === 'CT').sort((a, b) => a.position - b.position), 
    [players]
  );
  
  const tPlayers = useMemo(() => 
    players.filter(p => p.team === 'T').sort((a, b) => a.position - b.position), 
    [players]
  );
  
  // Fonction utilitaire pour l'affichage des Kills
  const renderKills = (kills: KillEntry[]) => {
      const totalKills = kills.reduce((sum, entry) => sum + entry.count, 0);
      return (
          <div className='flex items-center gap-1'>
              <Swords className='w-4 h-4 text-gray-500' />
              {totalKills}
          </div>
      );
  };
  
  // Fonction utilitaire pour l'affichage de l'inventaire avec vérification 'i &&' avant d'accéder à 'i.type'
  const renderInventory = (inventory: GameItem[]) => {
    const primary = inventory.find(i => i && ['Rifle', 'Sniper', 'SMG', 'Shotgun', 'Heavy'].includes(i.type));
    const secondary = inventory.find(i => i && i.type === 'Pistol');
    const armor = inventory.find(i => i && i.type === 'Armor');
    const utility = inventory.filter(i => i && (i.type === 'Grenade' || i.id === 'defusekit' || i.id === 'zeus'));

    const elements: JSX.Element[] = [];

    if (primary) {
        elements.push(
            <span key="primary" className="text-xs px-2 py-0.5 bg-gray-200 rounded-full truncate">
                {primary.name}
            </span>
        );
    }
    if (secondary && secondary.id !== 'glock' && secondary.id !== 'usps' && secondary.id !== 'p2000') {
        elements.push(
            <span key="secondary" className="text-xs px-2 py-0.5 bg-gray-200 rounded-full truncate">
                {secondary.name}
            </span>
        );
    }
    if (armor) {
        elements.push(
            <span key="armor" className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                <Shield className='w-3 h-3 inline-block mr-1'/> {armor.name}
            </span>
        );
    }
    if (utility.length > 0) {
        elements.push(
            <span key="utility" className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                {utility.length} Utilités
            </span>
        );
    }
    
    return (
        <div className="flex flex-wrap gap-1">
            {elements.length > 0 ? elements : <span className='text-xs text-gray-400'>Inventaire vide</span>}
        </div>
    );
  };
  
  // Rendu de chaque ligne de joueur
  const renderPlayerRow = (player: Player) => {
    const pr = playerRoundStates[player.id];
    if (!pr) return null; // Ne pas afficher si l'état rond n'est pas trouvé

    // Le nom du pistolet par défaut pour l'affichage
    const defaultPistolName = getItemById(player.defaultPistol.toLowerCase())?.name || player.defaultPistol;

    return (
      <tr key={player.id} className="hover:bg-gray-50 transition-colors">
        
        {/* Nom du Joueur */}
        <td className="px-4 py-3 border-b border-gray-200 w-1/4">
          <div className="flex items-center gap-3">
            <span className={`font-semibold text-lg ${player.team === 'CT' ? 'text-blue-700' : 'text-red-700'}`}>
              {player.name}
            </span>
          </div>
        </td>
        
        {/* Argent */}
        <td className="px-4 py-3 border-b border-gray-200 text-right">
          <div className="text-xl font-bold text-gray-900 flex items-center justify-end gap-1">
            <Banknote className='w-4 h-4 text-green-600'/> {pr.money.toLocaleString()}
          </div>
        </td>
        
        {/* Buy Value */}
        <td className="px-4 py-3 border-b border-gray-200 text-right">
          <div className="text-md font-medium text-gray-700">
            ${pr.buyValue.toLocaleString()}
          </div>
        </td>
        
        {/* Kills */}
        <td className="px-4 py-3 border-b border-gray-200 text-center">
             {renderKills(pr.kills)}
        </td>
        
        {/* Inventaire */}
        <td className="px-4 py-3 border-b border-gray-200">
            {renderInventory(pr.inventory)}
        </td>
        
        {/* État (Alive/Dead) */}
        <td className="px-4 py-3 border-b border-gray-200 w-[120px]">
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
        
        {/* Action Achat */}
        <td className="px-4 py-3 border-b border-gray-200 text-center">
            {/* L'achat est uniquement disponible pendant FreezeTime/OvertimeStart */}
            {(state.phase === 'FreezeTime' || state.phase === 'OvertimeStart') && (
                <button
                    onClick={() => onEquipmentClick(player.id)}
                    className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                    title={`Acheter pour ${player.name}`}
                >
                    <ShoppingCart className="w-5 h-5" />
                </button>
            )}
        </td>
      </tr>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                Joueur (Position)
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Argent ($)
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valeur d'Achat ($)
              </th>
               <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kills
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Inventaire
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                Statut
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">
                Achat
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* CT Table Section */}
            <tr className="bg-blue-50">
              <td colSpan={7} className="px-4 py-2">
                <div className="text-sm font-bold text-blue-900">Counter-Terrorists</div>
              </td>
            </tr>
            {ctPlayers.map(renderPlayerRow)}
            
            {/* T Table Section */}
            <tr className="bg-red-50">
              <td colSpan={7} className="px-4 py-2">
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