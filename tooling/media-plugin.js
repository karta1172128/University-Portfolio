import { cpSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const imageFile = /\.(png|jpe?g|webp|gif|svg|ico)$/i;

export function portfolioMedia(root, projects) {
  return {
    name: 'copy-portfolio-media',
    closeBundle() {
      cpSync(resolve(root, 'images'), resolve(root, 'dist/images'), {
        recursive: true,
        filter: source => statSync(source).isDirectory() || imageFile.test(source),
      });
      for (const project of projects) {
        const folder = resolve(root, 'projects', project.id);
        for (const file of readdirSync(folder, { withFileTypes: true })) {
          if (file.isFile() && imageFile.test(file.name)) {
            cpSync(resolve(folder, file.name), resolve(root, 'dist/projects', project.id, file.name));
          }
        }
      }
    },
  };
}
