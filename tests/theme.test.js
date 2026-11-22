import test from 'node:test';
import assert from 'node:assert/strict';
import { themes, readTheme, applyTheme } from '../src/theme.js';

const luminance = hex => {
  const rgb = hex.slice(1).match(/../g).map(channel => parseInt(channel, 16) / 255)
    .map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
};
const contrast = (a, b) => {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + .05) / (values[1] + .05);
};

test('theme text and primary buttons retain readable contrast in every palette', () => {
  for (const { id, colors } of themes) {
    for (const foreground of ['--text', '--muted', '--subtle', '--accent']) {
      for (const background of ['--bg', '--surface', '--surface-raised', '--section-tint']) {
        assert.ok(contrast(colors[foreground], colors[background]) >= 4.5, `${id}: ${foreground} on ${background}`);
      }
    }
    assert.ok(contrast(colors['--on-accent'], colors['--accent']) >= 4.5, `${id}: primary button`);
  }
});

const replaceGlobal = (t, key, value) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, key);
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  t.after(() => original ? Object.defineProperty(globalThis, key, original) : delete globalThis[key]);
};

test('theme preference handles invalid values and unavailable browser storage', t => {
  replaceGlobal(t, 'localStorage', { getItem: () => 'removed-theme' });
  assert.equal(readTheme(), 'blue');
  globalThis.localStorage.getItem = () => 'paper';
  assert.equal(readTheme(), 'paper');
  globalThis.localStorage.getItem = () => { throw new Error('Storage disabled'); };
  assert.equal(readTheme(), 'blue');
});

test('theme switching applies all colors and stores only the selected palette', t => {
  const saved = [];
  const variables = new Map();
  const root = { dataset: {}, style: { setProperty: (key, value) => variables.set(key, value) } };
  replaceGlobal(t, 'document', { documentElement: root });
  replaceGlobal(t, 'localStorage', { setItem: (...args) => saved.push(args) });
  assert.equal(applyTheme('paper', true), 'paper');
  assert.equal(root.style.colorScheme, 'light');
  assert.deepEqual(Object.fromEntries(variables), themes.find(theme => theme.id === 'paper').colors);
  assert.deepEqual(saved, [['university-portfolio:theme', 'paper']]);
  applyTheme('blue');
  assert.equal(root.dataset.theme, 'blue');
  assert.equal(root.style.colorScheme, 'dark');
  assert.equal(saved.length, 1);
  globalThis.localStorage.setItem = () => { throw new Error('Storage disabled'); };
  assert.doesNotThrow(() => applyTheme('sand', true));
  assert.equal(applyTheme('invalid'), 'blue');
});
