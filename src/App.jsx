import { useLayoutEffect } from 'react';
import { pageId, sitePath } from './paths.js';
import { useContent } from './content/Content.jsx';
import { Header, Footer } from './components/Layout.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { ProjectListPage } from './pages/ProjectListPage.jsx';
import { ProjectPage } from './pages/ProjectPage.jsx';

export default function App() {
  const project = useContent().projects[pageId];
  useLayoutEffect(() => {
    document.body.className = pageId === 'home' ? 'resume-home' : '';
    let hash;
    try { hash = decodeURIComponent(location.hash.slice(1)); }
    catch { return; }
    if (!hash) return;
    const frame = requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'instant' }));
    return () => cancelAnimationFrame(frame);
  }, []);

  let page;
  if (pageId === 'home') page = <HomePage />;
  else if (pageId === 'list') page = <ProjectListPage />;
  else if (project) page = <ProjectPage project={project} />;
  else page = <div className="shell section"><h1>找不到這個作品</h1><a className="text-link" href={sitePath('projects.html')}>返回全部作品</a></div>;

  return <><Header page={pageId} /><main id="main">{page}</main><Footer /></>;
}
