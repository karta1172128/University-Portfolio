import test from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { projects } from '../src/data/projects.js';
import { imageWidths, portraitWidths, optimizedImagePath } from '../src/image-paths.js';

const root = resolve(import.meta.dirname, '..');

test('published image variants decode, preserve proportions and reduce card transfer size', async () => {
  let originalBytes = 0;
  let cardBytes = 0;
  const sources = projects.flatMap(project => project.images.map(file => ({
    path: `projects/${project.id}/${file}`, widths: imageWidths,
  })));
  sources.push({ path: 'images/me2.jpg', widths: portraitWidths });
  for (const source of sources) {
    const original = resolve(root, source.path);
    const metadata = await sharp(original).metadata();
    originalBytes += statSync(original).size;
    for (const width of source.widths) {
      const output = resolve(root, 'dist', optimizedImagePath(source.path, width));
      const image = sharp(output);
      const actual = await image.metadata();
      assert.equal(actual.format, 'webp', output);
      assert.equal(actual.width, Math.min(width, metadata.width), output);
      assert(Math.abs(actual.height / actual.width - metadata.height / metadata.width) < 0.01, output);
      // Decode every generated file, not just its header.
      await image.stats();
      if (width === 640 || width === 480) cardBytes += statSync(output).size;
    }
  }
  assert(cardBytes < originalBytes * 0.25, 'Card images should transfer less than a quarter of the original bytes');
});
