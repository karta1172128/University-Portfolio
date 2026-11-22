import { useEffect, useRef, useState } from 'react';
import { applyTheme, readTheme, themes } from '../theme.js';

export function ThemeSwitcher() {
  const [selected, setSelected] = useState(readTheme);
  const menu = useRef(null);
  useEffect(() => {
    const outside = event => { if (!menu.current.contains(event.target)) menu.current.open = false; };
    const escape = event => { if (event.key === 'Escape' && menu.current.open) { menu.current.open = false; menu.current.querySelector('summary').focus(); } };
    document.addEventListener('click', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('click', outside); document.removeEventListener('keydown', escape); };
  }, []);
  return <details className="theme-switcher" ref={menu}>
    <summary>配色 <span className="theme-current-swatch" aria-hidden="true" /></summary>
    <div className="theme-options" role="group" aria-label="網頁配色">
      {themes.map(theme => <button type="button" key={theme.id} aria-pressed={theme.id === selected} onClick={() => setSelected(applyTheme(theme.id, true))}>
        <span className="theme-swatch" style={{ backgroundColor: theme.colors['--accent'] }} aria-hidden="true" /><span>{theme.name}</span><span className="theme-check" aria-hidden="true">{theme.id === selected ? '✓' : ''}</span>
      </button>)}
    </div>
  </details>;
}
