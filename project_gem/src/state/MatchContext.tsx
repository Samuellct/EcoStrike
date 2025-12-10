// src/state/MatchContext.tsx (CORRIGÉ ET COMPLET)

import React, { 
    createContext, 
    useReducer, 
    useContext, 
    ReactNode,
    useEffect,
    useState,
} from 'react';
import { 
    MatchState, 
    Player,
    TeamState,
    PlayerRoundState,
} from '../types/index';
// Import correct de MatchAction et des utilitaires du reducer
import { initialMatchState, matchReducer, MatchAction } from './matchReducer'; 

// 1. Définition du Contexte
interface MatchContextProps {
    state: MatchState;
    dispatch: React.Dispatch<MatchAction>;
    // NOUVEAU: État du timer pour l'affichage du décompte
    timer: { timeLeft: number | null; maxTime: number | null };  
}

// Initialisation du Contexte avec des valeurs par défaut pour TypeScript
// Le typecast est important pour s'assurer que TypeScript reconnait le type non-null du dispatch
const MatchContext = createContext<MatchContextProps>({
    state: initialMatchState,
    dispatch: () => { throw new Error('dispatch function must be provided by MatchStateProvider'); }, // Meilleure erreur pour le débogage
    timer: { timeLeft: null, maxTime: null }, // Initialisation du timer
});

// 2. Le Provider (Fournisseur d'État)
export const MatchStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Utilisation du reducer et de l'état initial
    const [state, dispatch] = useReducer(matchReducer, initialMatchState);

    // État pour le timer
    const [timerState, setTimerState] = useState<{ timeLeft: number | null; maxTime: number | null }>({ timeLeft: null, maxTime: null });

    // Logique pour le chronomètre et les effets de phase
    useEffect(() => {
        let timerInterval: number | undefined;
        let phaseDurationMs = 0;
        let startTime = 0;

        // Nettoyer l'intervalle précédent et réinitialiser l'état du timer à chaque changement de phase
        clearInterval(timerInterval);
        setTimerState({ timeLeft: null, maxTime: null }); 

        if (state.phase === 'FreezeTime' && state.currentRound > 0) {
            phaseDurationMs = 15000;
            startTime = Date.now();
            console.log(`Round ${state.currentRound}: FreezeTime (15s) started.`);

            timerInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const remaining = phaseDurationMs - elapsed;

                if (remaining <= 0) {
                    clearInterval(timerInterval);
                    setTimerState({ timeLeft: 0, maxTime: phaseDurationMs });
                    dispatch({ type: 'SET_PHASE', payload: 'RoundDuration' });
                } else {
                    setTimerState({ timeLeft: remaining, maxTime: phaseDurationMs });
                }
            }, 100); // Mise à jour rapide pour un décompte fluide
        }
        
        if (state.phase === 'RoundDuration') {
            phaseDurationMs = 115000; // 1m55s
            startTime = Date.now();
            console.log(`Round ${state.currentRound}: Round Duration (1m55s) started.`);

            timerInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const remaining = phaseDurationMs - elapsed;

                if (remaining <= 0) {
                    clearInterval(timerInterval);
                    setTimerState({ timeLeft: 0, maxTime: phaseDurationMs });
                    dispatch({ type: 'SET_PHASE', payload: 'RoundEndSummary' }); 
                } else {
                    setTimerState({ timeLeft: remaining, maxTime: phaseDurationMs });
                }
            }, 100);
        }
        
        // Fonction de nettoyage
        return () => clearInterval(timerInterval);

    }, [state.phase, state.currentRound, dispatch]);


    return (
        <MatchContext.Provider value={{ state, dispatch, timer: timerState }}>
            {children}
        </MatchContext.Provider>
    );
};

// 3. Le Hook personnalisé pour l'utilisation dans les composants
export const useMatchState = () => {
    const context = useContext(MatchContext);
    if (context === undefined) {
        throw new Error('useMatchState must be used within a MatchStateProvider');
    }
    return context;
};