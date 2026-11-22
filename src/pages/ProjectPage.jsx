import { sitePath, projectPath } from '../paths.js';
import { nextProject } from '../data/projects.js';
import { Gallery } from '../components/viewers/Gallery.jsx';
import { Video } from '../components/viewers/Video.jsx';
import { InlineList } from '../content/InlineList.jsx';
import { Text, useEditing } from '../content/Content.jsx';

export function ProjectPage({ project }) {
  const editing = useEditing();
  const next = nextProject(project.id);
  const field = `projects.${project.id}`;
  return <div className="shell">
    <nav className="breadcrumb" aria-label="麵包屑導覽"><a href={sitePath('projects.html')}>全部作品</a><span aria-hidden="true">/</span><span aria-current="page"><Text field={`${field}.title`} /></span></nav>
    <section className="case-intro">
      <p className="eyebrow"><Text field={`${field}.category`} />・<Text field={`${field}.type`} /></p>
      <Text as="h1" className={project.fullTitle ? 'case-title--long' : undefined} field={`${field}.${project.fullTitle ? 'fullTitle' : 'title'}`} multiline />
      {project.client && <Text as="p" className="case-note" field={`${field}.client`} />}
      {project.award && <Text as="p" className="award-note" field={`${field}.award`} />}
      <Text as="p" className="case-lead" field={`${field}.summary`} multiline /><p className="case-note">這個作品在製作過程中沒有使用 AI 輔助。</p>
      <dl className="case-meta">
        <div><dt>作品類型</dt><Text as="dd" field={`${field}.type`} /></div>
        {(project.team?.trim() || editing) && <div><dt>製作背景</dt><Text as="dd" field={`${field}.team`} placeholder="製作背景（選填）" /></div>}
        {(project.responsibilities.length > 0 || editing) && <div><dt>負責內容</dt><InlineList as="dd" field={`${field}.responsibilities`} label="負責項目" itemAs="p" max={20}>{(_, i) => <Text field={`${field}.responsibilities.${i}`} multiline placeholder="填寫負責項目" />}</InlineList></div>}
      </dl>
      {(project.download || project.external) && <div className="actions">
        {project.download && <a className="button button-primary" href={project.download} target="_blank" rel="noopener">下載遊戲<span className="sr-only">（Google Drive，另開分頁）</span></a>}
        {project.external && <a className={project.download ? 'button button-quiet' : 'button button-primary'} href={project.external} target="_blank" rel="noopener">{project.externalLabel ? <Text field={`${field}.externalLabel`} /> : '前往作品網站'}<span className="sr-only">（另開分頁）</span></a>}
      </div>}
    </section>
    <Gallery key={`${project.id}:${project.images.join()}`} project={project} />
    <section id="contribution" className="section case-section section-rule">
      <div>{project.sectionsTitle ? <Text as="h2" field={`${field}.sectionsTitle`} /> : <h2>作品介紹</h2>}</div>
      <InlineList field={`${field}.sections`} label="作品介紹區塊" min={1} itemAs="article" className="contribution-list" create={{ title: '', paragraphs: [''] }}>{(section, i) => <>
        <Text as="h3" field={`${field}.sections.${i}.title`} placeholder="作品介紹標題" />
        <InlineList className="project-body" field={`${field}.sections.${i}.paragraphs`} label="作品介紹段落" min={1} itemAs="p">{(_, j) => <Text field={`${field}.sections.${i}.paragraphs.${j}`} multiline placeholder="填寫介紹段落" />}</InlineList>
      </>}</InlineList>
    </section>
    {(project.mechanics?.length > 0 || editing) && <section className="section section-rule">
      <div className="section-heading">{project.mechanicsTitle ? <Text as="h2" field={`${field}.mechanicsTitle`} /> : <h2>玩法介紹</h2>}</div>
      <InlineList field={`${field}.mechanics`} label="玩法介紹區塊" itemAs="article" className="mechanic-grid" create={{ title: '', paragraphs: [''] }}>{(section, i) => <>
        <Text as="h3" field={`${field}.mechanics.${i}.title`} placeholder="玩法介紹標題" />
        <InlineList className="project-body" field={`${field}.mechanics.${i}.paragraphs`} label="玩法介紹段落" min={1} itemAs="p">{(_, j) => <Text field={`${field}.mechanics.${i}.paragraphs.${j}`} multiline placeholder="填寫玩法段落" />}</InlineList>
      </>}</InlineList>
    </section>}
    {project.video && <section id="demo" className="section section-rule"><div className="section-heading"><h2>遊戲展示影片</h2></div><Video id={project.video} title={`${project.title}快速展示`} /></section>}
    <nav className="case-bottom" aria-label="其他作品"><a className="button button-quiet" href={sitePath('projects.html')}>返回全部作品</a><a className="text-link" href={projectPath(next)}>接著看 <Text field={`projects.${next.id}.title`} /></a></nav>
  </div>;
}
