import { sitePath } from '../paths.js';
import { optimizedImagePath } from '../image-paths.js';
import { InlineList, InlineLinks } from '../content/InlineList.jsx';
import { Text, useContent, useEditing } from '../content/Content.jsx';

export function Introduction() {
  const { profile } = useContent();
  return <section id="Introduction" className="resume-intro shell" aria-labelledby="hero-title">
    <aside className="identity-panel" aria-label="個人資料">
      <img className="identity-photo" src={sitePath(optimizedImagePath('images/me2.jpg', 240))} srcSet={`${sitePath(optimizedImagePath('images/me2.jpg', 240))} 240w, ${sitePath(optimizedImagePath('images/me2.jpg', 480))} 480w`} sizes="240px" width="240" height="240" alt="阿逸的個人照片" fetchPriority="high" decoding="async" />
      <Text as="p" className="identity-alias" field="profile.alias" />
      <InlineList field="profile.facts" label="基本資料" as="dl" className="identity-facts" max={10} create={{label: '', value: ''}}>{(fact, i) => <>
        <Text as="dt" field={`profile.facts.${i}.label`} placeholder="欄位名稱" /><Text as="dd" field={`profile.facts.${i}.value`} placeholder="欄位內容" />
      </>}</InlineList>
    </aside>
    <div className="intro-text">
      <Text as="p" className="intro-kicker" field="profile.kicker" />
      <h1 id="hero-title"><Text field="profile.greeting" /><Text className="accent" field="profile.name" /></h1>
      <Text as="p" className="intro-lead" field="profile.lead" multiline style={{ whiteSpace: 'pre-line' }} />
      <InlineList field="profile.paragraphs" label="介紹段落" className="intro-paragraphs" itemAs="p">{(_, i) => <Text field={`profile.paragraphs.${i}`} multiline placeholder="新增介紹段落" />}</InlineList>
    </div>
  </section>;
}

export function Experience() {
  const { profile } = useContent();
  const editing = useEditing();
  return <section id="Experience" className="section shell resume-section" aria-labelledby="experience-title">
    <div className="resume-section-heading"><Text as="h2" id="experience-title" field="profile.experienceTitle" /></div>
    <InlineList field="profile.experiences" label="相關經歷" className="experience-list" itemAs="article" max={50} itemClassName={row => `experience-row${!row.category.trim() && !row.context.trim() && !editing ? ' experience-row--plain' : ''}`} create={() => ({id: `experience-${crypto.randomUUID()}`, category: '', context: '', title: '', paragraphs: [''], links: []})}>{(row, i) => {
      const field = `profile.experiences.${i}`;
      const hasContext = Boolean(row.category.trim() || row.context.trim());
      return <>
        {(hasContext || editing) && <div className="experience-context">
          {(row.category.trim() || editing) && <Text field={`${field}.category`} placeholder="類別（可留空）" />}
          {(row.context.trim() || editing) && <Text as="p" field={`${field}.context`} placeholder="補充資訊（可留空）" />}
        </div>}
        <div className="experience-content">
          <Text as="h3" field={`${field}.title`} placeholder="經歷標題" />
          <InlineList field={field + '.paragraphs'} label="經歷說明段落" min={1} className="experience-paragraphs" itemClassName="experience-paragraph">{(_, j) => <>
            <Text as="p" field={field + '.paragraphs.' + j} multiline placeholder="經歷說明" />
            <InlineLinks field={field + '.links'} afterParagraph={j} paragraphCount={row.paragraphs.length} />
          </>}</InlineList>
        </div>
      </>;
    }}</InlineList>
  </section>;
}
