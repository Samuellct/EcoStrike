// src/main.tsx

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { MatchStateProvider } from './state/MatchContext.tsx'; // Import du Provider

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MatchStateProvider> {/* Enveloppement de l'application */}
      <App />
    </MatchStateProvider>
  </StrictMode>
);