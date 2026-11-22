import { projectPath, projectImage } from '../paths.js';
import { Text, useEditing } from '../content/Content.jsx';
import { InlineList } from '../content/InlineList.jsx';

export function ProjectCard({ project, compact = false }) {
  const editing = useEditing();
  const href = projectPath(project);
  const field = 'projects.' + project.id;
  return <article className={'project-card' + (compact ? ' project-card--compact' : '')}>
    <a className="project-cover" href={href} aria-label={'查看' + project.title}><img src={projectImage(project, project.cover, 640)} srcSet={`${projectImage(project, project.cover, 320)} 320w, ${projectImage(project, project.cover, 640)} 640w`} sizes="(max-width: 600px) 90vw, 440px" alt={project.title + '作品畫面'} loading="lazy" decoding="async" /></a>
    <div className="card-body">
      <p className="project-category"><Text field={field + '.category'} />{(project.award || editing) && <> / <Text field={field + '.award'} placeholder="獎項（選填）" /></>}{(project.team?.trim() || editing) && <> / <Text field={field + '.team'} placeholder="製作背景（選填）" /></>}</p>
      <h3><a href={href}><Text field={field + '.title'} /></a></h3>
      {!compact && <Text as="p" field={field + '.summary'} multiline />}
      {(project.responsibilities.length > 0 || editing) && <div className="role"><span>負責內容</span>
        <InlineList field={field + '.responsibilities'} label="負責項目" className="card-responsibilities" itemAs="p" max={20}>{(_, i) => <Text as="bdi" field={field + '.responsibilities.' + i} multiline placeholder="填寫負責項目" />}</InlineList>
      </div>}
      {!compact && <InlineList field={field + '.tags'} label="標籤" as="ul" itemAs="li" className="tags" aria-label="作品特點" max={20}>{(_, i) => <Text field={field + '.tags.' + i} placeholder="新標籤" />}</InlineList>}
      <a className="text-link project-intro-link" href={href}>查看作品介紹 <span aria-hidden="true">→</span></a>
    </div>
  </article>;
}
