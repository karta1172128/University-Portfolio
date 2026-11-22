import { sitePath } from '../paths.js';
import { projectOrder } from '../data/projects.js';
import { Text, useContent } from '../content/Content.jsx';
import { Introduction, Experience } from '../components/ProfileSections.jsx';
import { Skills } from '../components/Skills.jsx';
import { Contact } from '../components/Contact.jsx';
import { ProjectCarousel } from '../components/ProjectCarousel.jsx';
import { Video } from '../components/viewers/Video.jsx';
import { WorkTimeline } from '../components/WorkTimeline.jsx';

export function HomePage() {
  const document = useContent();
  const projects = projectOrder.map(id => document.projects[id]);
  const { site } = document;
  return <>
    <Introduction /><WorkTimeline /><Experience /><Skills />
    <section id="Portfolio" className="section shell" aria-labelledby="works-title">
      <div className="section-heading"><Text as="h2" id="works-title" field="site.portfolioTitle" /><a className="button button-quiet portfolio-all-link" href={sitePath('projects.html')}>瀏覽全部 {projects.length} 項作品 <span aria-hidden="true">→</span></a></div>
      <Text as="p" className="section-description" field="site.aiStatement" multiline />
      <ProjectCarousel projects={projects} />
      <div className="showreel"><div><Text as="h3" field="site.showreel.heading" /><Text as="p" field="site.showreel.description" multiline /></div><Video id={site.showreel.id} title={site.showreel.title} /></div>
    </section>
    <Contact />
  </>;
}

