// src/components/RoundTimer.tsx (NOUVEAU)

import React from 'react';
import { useMatchState } from '../state/MatchContext';
import { Clock } from 'lucide-react';

// Fonction utilitaire pour formater les millisecondes en M:SS (ex: 1:55 ou 0:15)
const formatTime = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    // Formatage : M:SS
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Composant pour afficher le compte à rebours de la manche (FreezeTime ou RoundDuration).
 */
export function RoundTimer() {
    // Récupère l'état du match et le nouvel état du timer
    const { state, timer } = useMatchState(); 
    const { timeLeft, maxTime } = timer;
    
    // N'affiche le timer que pendant les phases de jeu actives
    if (state.phase !== 'FreezeTime' && state.phase !== 'RoundDuration') {
        return null; 
    }
    
    const isFreezeTime = state.phase === 'FreezeTime';
    // Utilise maxTime du context ou une valeur par défaut
    const totalTime = maxTime || (isFreezeTime ? 15000 : 115000); 
    const remainingTime = timeLeft === null ? totalTime : timeLeft;
    
    // Calcul de la progression (de 0 à 100)
    const progress = (remainingTime / totalTime) * 100;

    // Définition des classes de couleur
    let progressBarClass = 'bg-green-600';
    let textClass = 'text-green-800';
    
    if (isFreezeTime) {
        // FreezeTime (15s)
        progressBarClass = 'bg-blue-500';
        textClass = 'text-blue-800';
    } else {
        // Round Duration (1m55s)
        progressBarClass = 'bg-green-600';
        textClass = 'text-green-800';
        // Avertissement de temps (moins de 20s)
        if (remainingTime <= 20000) { 
            progressBarClass = 'bg-red-500';
            textClass = 'text-red-700';
        } else if (remainingTime <= 40000) {
            progressBarClass = 'bg-yellow-500';
            textClass = 'text-yellow-700';
        }
    }

    return (
        <div className="w-full max-w-sm mx-auto my-4 p-3 bg-white border border-gray-200 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
                <div className={`flex items-center gap-2 font-semibold ${textClass}`}>
                    <Clock className="w-5 h-5" />
                    {isFreezeTime ? 'ACHAT (Freeze Time)' : 'DURÉE DE MANCHE'}
                </div>
                <div className={`text-xl font-extrabold ${textClass}`}>
                    {formatTime(remainingTime)}
                </div>
            </div>
            {/* Barre de progression */}
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-100 ${progressBarClass}`} 
                    style={{ width: `${progress}%` }} 
                />
            </div>
        </div>
    );
}