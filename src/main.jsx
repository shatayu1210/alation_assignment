import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/global.css';
import App from './App';

// Use the Gmail logo as the tab icon when it's available locally (it isn't committed).
// The logo isn't square, so it's drawn centered on a square canvas to avoid stretching.
const logo = new Image();
logo.onload = () => {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const scale = Math.min(size / logo.width, size / logo.height);
  const w = logo.width * scale;
  const h = logo.height * scale;
  ctx.drawImage(logo, (size - w) / 2, (size - h) / 2, w, h);

  const favicon = document.getElementById('favicon');
  if (favicon) {
    favicon.type = 'image/png';
    favicon.href = canvas.toDataURL('image/png');
  }
};
logo.src = '/gmail-logo.png';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
