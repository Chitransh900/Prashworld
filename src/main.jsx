import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/reset.css';
import './styles/index.css';
import './styles/animations.css';

// Initialize theme from localStorage
const savedTheme = localStorage.getItem('prashworld-theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.setAttribute('data-theme', 'dark');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
