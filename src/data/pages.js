import { projects } from './projects.js';
import { site } from './site.js';

// Both the HTML generator and Vite use this list. URLs stay independent of UI components.
export function createPages(projectList = projects) {
  return [
    { id: 'home', path: 'index.html', title: site.homeTitle, description: site.homeDescription },
    { id: 'list', path: 'projects.html', title: site.listTitle, description: site.listDescription },
    ...projectList.map(project => ({
      id: project.id,
      path: `projects/${project.id}/index.html`,
      title: project.pageTitle || `${project.fullTitle || project.title}｜${site.name}`,
      description: project.summary,
    })),
  ];
}

export const pages = createPages();
