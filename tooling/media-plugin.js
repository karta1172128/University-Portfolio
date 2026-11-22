import { cpSync, createReadStream, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';
import { imageWidths, portraitWidths, optimizedImagePath } from '../src/image-paths.js';

export function portfolioMedia(root, projects) {
  const generated = new Map();
  let preparation;
  // Content-addressed local cache: replacing an original regenerates its variants.
  const prepare = () => preparation ||= (async () => {
    const sources = projects.flatMap(project => project.images.map(file => ({
      path: `projects/${project.id}/${file}`, widths: imageWidths,
    })));
    sources.push({ path: 'images/me2.jpg', widths: portraitWidths });
    for (const source of sources) {
      const input = readFileSync(resolve(root, source.path));
      const key = createHash('sha256').update(input).update('webp-v1-quality84').digest('hex');
      for (const width of source.widths) {
        const output = optimizedImagePath(source.path, width);
        const cached = resolve(root, 'node_modules/.cache/portfolio-media', key, `${width}.webp`);
        if (!existsSync(cached)) {
          mkdirSync(dirname(cached), { recursive: true });
          await sharp(input).rotate().resize({ width, withoutEnlargement: true })
            .webp({ quality: 84, effort: 5 }).toFile(cached);
        }
        generated.set(output, cached);
      }
    }
  })();
  return {
    name: 'optimize-portfolio-media',
    async buildStart() { await prepare(); },
    async configureServer(server) {
      await prepare();
      server.middlewares.use((req, res, next) => {
        const path = new URL(req.url, 'http://localhost').pathname.slice(1);
        const file = generated.get(path);
        if (!file) return next();
        res.setHeader('Content-Type', 'image/webp');
        createReadStream(file).pipe(res);
      });
      server.watcher.add(projects.map(project => resolve(root, 'projects', project.id)));
      server.watcher.add(resolve(root, 'images/me2.jpg'));
      server.watcher.on('change', file => {
        if (!/\.(png|jpe?g|webp)$/i.test(file)) return;
        preparation = undefined;
        prepare().then(() => server.ws.send({ type: 'full-reload' })).catch(error => server.config.logger.error(error.message));
      });
    },
    async closeBundle() {
      await prepare();
      for (const [path, file] of generated) {
        const target = resolve(root, 'dist', path);
        mkdirSync(dirname(target), { recursive: true });
        cpSync(file, target);
      }
      // Preserve vector artwork and the favicon; original photos stay in the source.
      cpSync(resolve(root, 'images/skills'), resolve(root, 'dist/images/skills'), { recursive: true });
      cpSync(resolve(root, 'images/logo.ico'), resolve(root, 'dist/images/logo.ico'));
    },
  };
}
