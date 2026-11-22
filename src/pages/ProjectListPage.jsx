import { sitePath } from '../paths.js';
import { projectOrder, projectGroups } from '../data/projects.js';
import { Text, useContent } from '../content/Content.jsx';
import { ProjectCard } from '../components/ProjectCard.jsx';

export function ProjectListPage() {
  const document = useContent();
  const projectsInGroup = id => projectOrder.map(key => document.projects[key]).filter(project => project.group === id);
  return <div className="shell all-projects">
    <div className="listing-heading"><a className="text-link" href={sitePath('index.html#Portfolio')}>返回個人履歷</a><h1>全部作品</h1><Text as="p" field="site.aiStatement" multiline /></div>
    <nav className="project-group-nav" aria-label="作品分類">{projectGroups.map(({ id, name }) => <a className="button button-quiet" key={id} href={`#${id}`}>{name}</a>)}</nav>
    {projectGroups.map(({ id, name, description }) => <section className="section section-rule" id={id} key={id} aria-labelledby={`${id}-title`}><div className="section-heading"><h2 id={`${id}-title`}>{name}</h2></div>{description && <p className="section-description">{description}</p>}<div className="project-grid project-grid--three">{projectsInGroup(id).map(project => <ProjectCard key={project.id} project={project} />)}</div></section>)}
  </div>;
}

