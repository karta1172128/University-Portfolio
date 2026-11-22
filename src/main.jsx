import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';
import { applyTheme, defaultTheme, readTheme, themeSwitcherEnabled } from './theme.js';

// While the switcher is hidden, use the chosen site palette even for returning visitors.
applyTheme(themeSwitcherEnabled ? readTheme() : defaultTheme);

async function start() {
  let app = <App />;
  if (import.meta.env.DEV && import.meta.env.MODE === 'editor') {
    const { default: Editor } = await import('./content/Editor.jsx');
    app = <Editor>{app}</Editor>;
  }
  createRoot(document.getElementById('root')).render(<StrictMode>{app}</StrictMode>);
}

start();
