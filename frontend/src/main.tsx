import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n';

const lng = localStorage.getItem('language') || 'en';
document.documentElement.lang = lng;
document.documentElement.dir = lng === 'fa' ? 'rtl' : 'ltr';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
