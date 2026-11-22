import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { pages } from './src/data/pages.js';
import { projects } from './src/data/projects.js';
import { preparePages } from './tooling/prepare-pages.mjs';
import { portfolioMedia } from './tooling/media-plugin.js';
import { localEditor } from './tooling/editor-plugin.js';

const root = import.meta.dirname;
// Run even when Vite is invoked directly, so dev and production cannot drift.
preparePages();

export default defineConfig(({ mode }) => ({
  base: './',
  publicDir: false,
  plugins: [react(), portfolioMedia(root, projects), ...(mode === 'editor' ? [localEditor(root)] : [])],
  build: {
    rolldownOptions: {
      input: pages.map(page => resolve(root, page.path)),
    },
  },
}));
