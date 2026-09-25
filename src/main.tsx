import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register PWA service worker immediately for install prompt qualification
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((reg) => {
      if (reg.installing) {
        console.log('PWA Service Worker installing');
      } else if (reg.active) {
        console.log('PWA Service Worker active');
      }
    })
    .catch((err) => {
      console.warn('PWA Service Worker registration warning:', err);
    });
}
