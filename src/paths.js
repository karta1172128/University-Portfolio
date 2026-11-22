export const pageId = document.body.dataset.page || 'home';
const root = new URL(pageId === 'home' || pageId === 'list' ? './' : '../../', document.baseURI);

export function sitePath(path = '') {
  return new URL(path, root).href;
}

export function projectPath(project) {
  return sitePath(`projects/${project.id}/index.html`);
}

export function projectImage(project, file) {
  return sitePath(`projects/${project.id}/${file}`);
}
