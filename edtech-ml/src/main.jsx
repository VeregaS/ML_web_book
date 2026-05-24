import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ProgressProvider } from './context/ProgressContext'
import { ThemeProvider } from './context/ThemeContext'
import { TooltipProvider } from './context/TooltipContext'
import './index.css' 
import App from './App.jsx'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <TooltipProvider>
        <ProgressProvider>
          <App />
        </ProgressProvider>
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
)