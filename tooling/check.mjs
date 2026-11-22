import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { projectRoot } from './content.js';

const steps = [
  ['node_modules/vite/bin/vite.js', 'build'],
  ['--test', ...readdirSync(`${projectRoot}/tests`).filter(file => file.endsWith('.test.js')).map(file => `tests/${file}`)],
];
for (const args of steps) {
  const result = spawnSync(process.execPath, args, { cwd: projectRoot, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
