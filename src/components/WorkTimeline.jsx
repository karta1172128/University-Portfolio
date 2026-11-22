import { useContext, useEffect, useRef, useState } from 'react';
import { EditorContext, Text, useContent, useEditing } from '../content/Content.jsx';
import { orderedWorkEntries, workPeriod, workPreview } from '../content/work.js';
import { snapWorkIndex, workTrackOffset } from './carousel.js';
import { useHorizontalDrag } from './useHorizontalDrag.js';
import { sitePath } from '../paths.js';
import { InlineList, InlineLinks } from '../content/InlineList.jsx';
import { updateCollection } from '../content/collections.js';

function WorkScroller({ children, rows }) {
  const editor = useContext(EditorContext);
  const editing = useEditing();
  const viewport = useRef(null);
  const [selected, setSelected] = useState(() => rows.at(-1)?.id || '');
  const [width, setWidth] = useState(0);
  const selectedIndex = rows.findIndex(row => row.id === selected);
  const index = selectedIndex < 0 ? rows.length - 1 : selectedIndex;
  const step = Math.min(460, Math.max(260, width * .72));
  const travel = workTrackOffset(index, step, width, rows.length);
  const maxTravel = Math.max(0, rows.length * step - width);
  const select = next => { setSelected(rows[Math.max(0, Math.min(rows.length - 1, next))]?.id || ''); drag.reset(); };
  useEffect(() => {
    const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { if (editor?.workSelection) setSelected(editor.workSelection); }, [editor?.workSelection]);
  const drag = useHorizontalDrag({ travel, maxTravel, resetKey: `${width}:${index}:${rows.length}:${editing}`, onRelease: ({ offset, velocity, cancelled, moved }) => select(cancelled || !moved ? index : snapWorkIndex(index, offset, velocity, step, rows.length, width)) });
  const { offset, dragging } = drag;
  return <>
    <div className="work-directions" aria-label="時間方向：左側為曾經，右側為目前"><span>曾經 <span aria-hidden="true">←</span></span><span><span aria-hidden="true">→</span> 目前</span></div>
    <div ref={viewport} {...drag.handlers} className={`horizontal-rail work-scroll${travel > 0 ? ' has-before' : ''}${travel < maxTravel ? ' has-after' : ''}${dragging ? ' is-dragging' : ''}`} tabIndex={0} role="region" aria-label="經歷時間軸，可左右拖曳或使用方向鍵" onKeyDown={event => {
      if (event.target.closest('[contenteditable],input,textarea,select,button,a')) return;
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        select(event.key === 'Home' ? 0 : event.key === 'End' ? rows.length - 1 : index + (event.key === 'ArrowLeft' ? -1 : 1));
      }
    }} onClick={event => {
      if (event.target.closest('button,a,[contenteditable]')) return;
      const node = event.target.closest('[data-node-index]');
      if (node) select(Number(node.dataset.nodeIndex));
    }}>
      <ol className="horizontal-rail-track work-timeline" style={{ '--work-step': `${step}px`, transform: `translateX(${-travel + offset}px)`, transition: dragging ? 'none' : undefined }}>{children}</ol>
    </div>
  </>;
}

function WorkEntry({ row, index, sourceIndex, demo }) {
  const editor = useContext(EditorContext);
  const editing = useEditing();
  const [expanded, setExpanded] = useState(false);
  const field = `profile.workExperiences.${sourceIndex}`;
  const preview = workPreview(row.paragraphs);
  const full = editing || expanded || !preview.truncated;
  const descriptionId = `work-description-${row.id}`;
  return <li className={`work-entry${row.current ? ' is-present' : ''}`} data-node-index={index}>
    <div className="work-period-line"><p className="work-period">{workPeriod(row)}</p></div>
    <div className="work-entry-body">
      <span className="work-entry-dot" aria-hidden="true" />
      {demo ? <h3>{row.company}</h3> : <Text as="h3" field={`${field}.company`} placeholder="經歷標題／公司或學校名稱" />}
      {(row.title || row.tools || editing) && <div className="work-meta">
        {(row.title || editing) && (demo ? row.title && <p className="work-role">{row.title}</p> : <Text as="p" className="work-role" field={`${field}.title`} placeholder="職稱（選填）" />)}
        {(row.tools || editing) && (demo ? row.tools && <p className="work-tools">{row.tools}</p> : <Text as="p" className="work-tools" field={`${field}.tools`} placeholder="使用工具（選填）" />)}
      </div>}
      {(row.paragraphs.length > 0 || editing) && <div id={descriptionId} className="work-description">
        {full ? demo ? row.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>) : <InlineList field={`${field}.paragraphs`} label="工作／學習內容" itemAs="p">{(_, i) => <Text field={`${field}.paragraphs.${i}`} multiline placeholder="填寫工作、學習或實作內容" />}</InlineList> : <p>{preview.text}</p>}
      </div>}
      {!editing && preview.truncated && <button type="button" className="work-disclosure" aria-expanded={expanded} aria-controls={descriptionId} onClick={() => setExpanded(value => !value)}>{expanded ? '收合內容' : '更多內容'}<span aria-hidden="true">{expanded ? ' −' : ' ＋'}</span></button>}
      {!demo && editing ? <InlineLinks field={`${field}.links`} className="work-project-links" /> : row.links.length > 0 && <div className="work-project-links">{row.links.map((link, i) => {
        const external = link.href.startsWith('https:');
        return <a key={i} className="button button-quiet experience-project-link" href={external ? link.href : sitePath(link.href)} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
          {demo ? link.text : <Text field={`${field}.links.${i}.text`} />}{external && <span className="work-link-hint">（另開分頁）</span>}
        </a>;
      })}</div>}
      {editing && !demo && <div className="inline-work-settings">
        <label>開始<input type="month" aria-label={`開始年月：${row.company}`} value={row.start} onChange={event => editor.setField(`${field}.start`, event.target.value)} /></label>
        {!row.current && <label>結束<input type="month" aria-label={`結束年月：${row.company}`} value={row.end} onChange={event => editor.setField(`${field}.end`, event.target.value)} /></label>}
        <label><input type="checkbox" checked={row.current} onChange={event => editor.replaceDocument(current => {
          const next = structuredClone(current); Object.assign(next.profile.workExperiences[sourceIndex], {current: event.target.checked, end: event.target.checked ? '' : row.start}); return next;
        })} />持續至今</label>
        <button type="button" aria-label={`移除經歷：${row.company}`} onClick={() => editor.replaceDocument(current => updateCollection(current, 'profile.workExperiences', {type: 'remove', index: sourceIndex}))}>× 移除此段經歷</button>
      </div>}
    </div>
  </li>;
}

export function WorkTimeline() {
  const { profile } = useContent();
  const editor = useContext(EditorContext);
  const editing = useEditing();
  const demo = Boolean(editor?.workDemo);
  const entries = orderedWorkEntries(demo ? editor.workDemo : profile.workExperiences);
  const rows = entries.map(entry => entry.row);
  if (!rows.length && !editing) return null;
  return <section id="WorkExperience" className="section shell resume-section" aria-labelledby="work-title">
    <div className="section-heading work-heading"><Text as="h2" id="work-title" field="profile.workExperienceTitle" />{editing && <div className="work-editor-actions"><button type="button" className="button button-quiet" onClick={() => {
      const now = new Date(); const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
      const id = `work-${crypto.randomUUID()}`; editor.setWorkDemo(false);
      editor.replaceDocument(current => updateCollection(current, 'profile.workExperiences', {type: 'add', value: {id, company: '', title: '', tools: '', start: month, end: month, current: false, paragraphs: [''], links: []}}));
      editor.selectWork?.(id);
    }}>＋ 經歷</button><button type="button" className="work-small-button" onClick={() => editor.setWorkDemo(!demo)}>{demo ? '結束示範' : '試看內容示範'}</button></div>}</div>
    {demo && <p className="work-demo-note" role="status">版面示範：以下為虛構內容，不會儲存到履歷。</p>}
    {!rows.length ? <div className="work-empty"><p>新增經歷後，就會在這裡顯示。</p><p>可以填寫正式工作、在學或自主學習期間，職稱選填。</p></div> : <WorkScroller rows={rows} key={demo ? 'demo' : 'actual'}>{entries.map(({row, sourceIndex}, i) => <WorkEntry key={row.id} row={row} index={i} sourceIndex={sourceIndex} demo={demo} />)}</WorkScroller>}
  </section>;
}
