// src/state/MatchContext.tsx (CORRIGÉ ET COMPLET)

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
    PlayerRoundState,
} from '../types/index';
// Import correct de MatchAction et des utilitaires du reducer
import { initialMatchState, matchReducer, MatchAction } from './matchReducer'; 

// 1. Définition du Contexte
interface MatchContextProps {
    state: MatchState;
    // CORRECTION: Le dispatch est correctement typé avec l'action du reducer
    dispatch: React.Dispatch<MatchAction>; 
}

// Initialisation du Contexte avec des valeurs par défaut pour TypeScript
// Le typecast est important pour s'assurer que TypeScript reconnait le type non-null du dispatch
const MatchContext = createContext<MatchContextProps>({
    state: initialMatchState,
    dispatch: () => { throw new Error('dispatch function must be provided by MatchStateProvider'); }, // Meilleure erreur pour le débogage
});

// 2. Le Provider (Fournisseur d'État)
export const MatchStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Utilisation du reducer et de l'état initial
    const [state, dispatch] = useReducer(matchReducer, initialMatchState);

    // [Optional] Logique de simulation de chronomètre (pour la démo)
    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;

        if (state.phase === 'FreezeTime' && state.currentRound > 0) {
            console.log(`Round ${state.currentRound}: FreezeTime (15s) started.`);
            
            // Simuler le passage à RoundDuration après 15s
            timer = setTimeout(() => {
                dispatch({ type: 'SET_PHASE', payload: 'RoundDuration' });
            }, 15000); 
            
        } else if (state.phase === 'RoundDuration') {
            console.log(`Round ${state.currentRound}: Round Duration (1m55s) started.`);
            
            // Simuler la fin de manche après 1m55s
            timer = setTimeout(() => {
                // Déclencher la phase de saisie utilisateur
                dispatch({ type: 'SET_PHASE', payload: 'RoundEndSummary' }); 
            }, 115000); 
        }
        
        return () => {
            if (timer) clearTimeout(timer);
        };
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
        throw new Error('useMatchState must be used within a MatchStateProvider');
    }
    return context;
};