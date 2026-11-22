const palette = (bg, surface, raised, text, muted, subtle, accent, line, soft, tint, onAccent = '#172327', iconSurface = bg, iconAccent = accent) => ({
  '--bg': bg, '--surface': surface, '--surface-raised': raised, '--text': text,
  '--muted': muted, '--subtle': subtle, '--accent': accent, '--line': line,
  '--line-soft': soft, '--section-tint': tint, '--on-accent': onAccent,
  '--icon-surface': iconSurface, '--icon-accent': iconAccent,
});

export const themes = [
  { id: 'teal', name: '青綠', colors: palette('#1c252b', '#232e35', '#29363d', '#dfe7e9', '#b9c6cb', '#9cabb2', '#a0cfc3', '#3b4a52', '#303e46', '#1f2930') },
  { id: 'blue', name: '霧藍', colors: palette('#1c242e', '#24303c', '#2b3947', '#dfe7ef', '#bac7d5', '#9baab9', '#a6c8ee', '#3c4d5e', '#303e4e', '#202b37') },
  { id: 'sand', name: '暖砂', colors: palette('#282421', '#322d28', '#3b342e', '#e8e2d9', '#ccc1b2', '#b0a290', '#dcc09b', '#53483e', '#433b33', '#2d2823') },
  { id: 'graphite', name: '石墨', colors: palette('#232427', '#2c2e32', '#35373c', '#e5e5e7', '#c4c5c8', '#aaaeb4', '#c5cad2', '#494c52', '#3a3d42', '#27292d') },
  { id: 'paper', name: '暖白', light: true, colors: palette('#f5f2eb', '#fffdf8', '#efe9df', '#2c3538', '#4f5b60', '#5f6a70', '#28685e', '#c6cec8', '#dcded6', '#edece4', '#ffffff', '#26323a', '#a0cfc3') },
];
export const defaultTheme = 'blue';
export const themeSwitcherEnabled = false;

const storageKey = 'university-portfolio:theme';
export function readTheme() {
  try { return themes.find(theme => theme.id === localStorage.getItem(storageKey))?.id || defaultTheme; }
  catch { return defaultTheme; }
}
export function applyTheme(id, persist = false) {
  const theme = themes.find(item => item.id === id) || themes.find(item => item.id === defaultTheme);
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  root.style.colorScheme = theme.light ? 'light' : 'dark';
  for (const [key, value] of Object.entries(theme.colors)) root.style.setProperty(key, value);
  if (persist) { try { localStorage.setItem(storageKey, theme.id); } catch { /* Color switching still works when storage is unavailable. */ } }
  return theme.id;
}
