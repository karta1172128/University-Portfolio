import { InlineList } from '../content/InlineList.jsx';
import { Text, useContent } from '../content/Content.jsx';
import unity from '../../images/skills/unity.svg?raw';
import csharp from '../../images/skills/csharp.svg?raw';
import html from '../../images/skills/html5.svg?raw';
import css from '../../images/skills/css.svg?raw';
import javascript from '../../images/skills/javascript.svg?raw';

const icons = { Unity: unity, 'C#': csharp, HTML: html, CSS: css, JavaScript: javascript };

const iconCredits = {
  HTML: 'HTML5 Logo by W3C — https://www.w3.org/html/logo/ — CC BY 3.0: https://creativecommons.org/licenses/by/3.0/',
  Unity: '本網站未獲 Unity Technologies 或其關係企業贊助，亦與其無隸屬關係。Unity 與 Unity 標誌為其在美國及其他地區的商標或註冊商標。',
};

export function Skills() {
  const { skills } = useContent();
  return <section id="Ability" className="section section-tint" aria-labelledby="skills-title"><div className="shell">
    <div className="section-heading"><Text as="h2" id="skills-title" field="site.skillsTitle" /></div>
    <div className="skill-grid"><InlineList field="skills" label="技能" itemAs="article" itemClassName="skill-card" className="inline-skill-list" max={20} create={{name: '', title: '', description: ''}}>{(skill, i) => <>
      <div className="skill-label"><span className="skill-icons" aria-hidden="true">{skill.name.split('／').map(name => <span className="skill-icon-frame" key={name} title={iconCredits[name]}><span className="brand-icon" data-brand={name} dangerouslySetInnerHTML={Object.hasOwn(icons, name) ? { __html: icons[name] } : undefined}>{Object.hasOwn(icons, name) ? undefined : name.slice(0, 2)}</span></span>)}</span><Text as="h3" field={`skills.${i}.name`} placeholder="技能名稱" /></div>
      <Text as="p" field={`skills.${i}.description`} multiline placeholder="技能說明" />
    </>}</InlineList>
    <article className="skill-card">
      <div className="skill-label"><span className="skill-icon-frame"><svg className="learning-icon" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M12 6.5C9.2 4.7 5.4 4.6 3 5.5v13c2.4-.9 6.2-.8 9 1 2.8-1.8 6.6-1.9 9-1v-13c-2.4-.9-6.2-.8-9 1Z" />
        <path d="M12 6.5v13M6 9l3 1M6 12l3 1M15 10l3-1M15 13l3-1" />
      </svg></span><Text as="h3" field="site.workingNote.title" /></div>
      <Text as="p" field="site.workingNote.description" multiline />
    </article></div>
  </div></section>;
}
