// Shared by the browser and build tooling so generated URLs stay in sync.
export const imageWidths = [320, 640, 1280, 2560];
export const portraitWidths = [240, 480];

export function optimizedImagePath(source, width) {
  return `media/${source}-${width}.webp`;
}
