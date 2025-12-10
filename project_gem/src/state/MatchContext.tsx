// src/state/MatchContext.tsx

import React, { 
    createContext, 
    useReducer, 
    useContext, 
    ReactNode,
    useEffect,
} from 'react';
import { 
    MatchState, 
    Player,
    TeamState,
    PlayerRoundState
} from '../types';
import { initialMatchState, matchReducer, MatchAction } from './matchReducer';

// 1. Définition du Contexte
interface MatchContextProps {
    state: MatchState;
    dispatch: React.Dispatch<MatchAction>;
    // Fonctions utilitaires si besoin, mais ici on expose surtout le dispatch.
}

// Initialisation du Contexte avec des valeurs par défaut pour TypeScript
const MatchContext = createContext<MatchContextProps>({
    state: initialMatchState,
    dispatch: () => null,
});

// 2. Le Provider (Fournisseur d'État)
export const MatchStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(matchReducer, initialMatchState);

    // [Optional] Logique pour le chronomètre ou les effets de phase pourrait aller ici
    // Exemple : Déclencher le décompte de FreezeTime/RoundDuration
    useEffect(() => {
        if (state.phase === 'FreezeTime' && state.currentRound > 0) {
            console.log(`Round ${state.currentRound}: FreezeTime (15s) started.`);
            
            // Simuler le passage à RoundDuration après 15s
            const timer = setTimeout(() => {
                dispatch({ type: 'SET_PHASE', payload: 'RoundDuration' });
            }, 15000); // 15 secondes
            
            return () => clearTimeout(timer);
        }
        
        if (state.phase === 'RoundDuration') {
            console.log(`Round ${state.currentRound}: Round Duration (1m55s) started.`);
            
            // Simuler la fin de manche après 1m55s
            const timer = setTimeout(() => {
                // La fin de manche doit afficher le bouton "Manche Suivante" en surbrillance.
                // On met une phase temporaire pour l'interaction utilisateur.
                dispatch({ type: 'SET_PHASE', payload: 'RoundEndSummary' }); 
            }, 115000); // 1 minute 55 secondes
            
            return () => clearTimeout(timer);
        }
    }, [state.phase, state.currentRound]);


    return (
        <MatchContext.Provider value={{ state, dispatch }}>
            {children}
        </MatchContext.Provider>
    );
};

// 3. Le Hook personnalisé pour l'utilisation dans les composants
export const useMatchState = () => {
    const context = useContext(MatchContext);
    if (context === undefined) {
        throw new Error('useMatchState doit être utilisé à l\'intérieur de MatchStateProvider');
    }
    return context;
};