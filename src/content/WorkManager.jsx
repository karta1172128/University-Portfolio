import { useContext, useEffect, useRef, useState } from 'react';
import { EditorContext } from './Content.jsx';
import { splitParagraphs } from './model.js';
import { validateWorkExperiences, workPeriod } from './work.js';

export const workDemoRows = [
  { id: 'demo-1', start: '2024-09', end: '', current: true, company: '示範公司 A', title: '遊戲工程師｜互動示範', tools: 'Unity / C#', paragraphs: ['這是用來試看版面與拖曳手感的虛構經歷。', '各段經歷依時間排列，內容較長時可以展開閱讀。'], links: [] },
  { id: 'demo-2', start: '2022-07', end: '2024-08', current: false, company: '示範公司 B', title: '程式開發｜互動示範', tools: '', paragraphs: ['這段經歷示範不同長度的工作說明。', '可以填寫工作內容、使用工具，以及相關作品連結。'], links: [] },
  { id: 'demo-3', start: '2021-07', end: '2022-06', current: false, company: '示範單位 C', title: '專案實習｜互動示範', tools: '', paragraphs: ['所有示範資料都不會加入正式履歷。新增實際經歷時，請填入真實公司、職稱與任職期間。'], links: [] },
];

export default function WorkManager({ mode, onClose, onChoose }) {
  const editor = useContext(EditorContext);
  const rows = editor.document.profile.workExperiences;
  const [editId, setEditId] = useState(mode === 'list' ? null : mode);
  const [message, setMessage] = useState('');
  const dialog = useRef(null);
  const row = rows.find(item => item.id === editId);
  const [current, setCurrent] = useState(Boolean(row?.current));
  useEffect(() => { dialog.current.showModal(); }, []);
  const update = next => editor.setField('profile.workExperiences', next);
  function choose(id) { setEditId(id); setCurrent(Boolean(rows.find(item => item.id === id)?.current)); setMessage(''); }
  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const links = form.get('links').split('\n').map(line => line.trim()).filter(Boolean).map(line => {
      const delimiter = line.search(/[|｜]/);
      return { text: delimiter < 0 ? '' : line.slice(0, delimiter).trim(), href: delimiter < 0 ? line : line.slice(delimiter + 1).trim() };
    });
    const next = { id: row?.id || `work-${crypto.randomUUID()}`, company: form.get('company').trim(), title: form.get('title').trim(), start: form.get('start'), end: current ? '' : form.get('end'), current, tools: form.get('tools').trim(), paragraphs: splitParagraphs(form.get('description')), links };
    const errors = validateWorkExperiences([next], editor.document.projects);
    if (errors.length) { setMessage(errors.join(' ')); return; }
    const result = row ? rows.map(item => item.id === row.id ? next : item) : [next, ...rows].sort((a, b) => b.start.localeCompare(a.start));
    update(result); onChoose(next.id); onClose();
  }
  return <dialog ref={dialog} className="editor-manager work-manager" aria-labelledby="work-manager-title" onCancel={onClose} onClose={onClose}>
    <div className="editor-manager-heading"><h2 id="work-manager-title">{editId ? row ? '編輯經歷' : '新增經歷' : '管理時間軸'}</h2><button type="button" aria-label="關閉經歷管理" onClick={onClose}>×</button></div>
    <p>時間軸依開始年月由早到近排列。變更先呈現在畫面，確認後按「儲存到專案」才會寫入檔案。</p>
    {!editId ? <>
      {!rows.length && <p>尚未新增經歷。</p>}
      <ol className="editor-experiences">{rows.map((item, i) => <li key={item.id}><span>{item.company}{item.title ? ` · ${item.title}` : ''}<small className="work-manager-period">{workPeriod(item)}</small></span><div>
        <button type="button" onClick={() => choose(item.id)}>編輯</button>
        <button type="button" aria-label={`移除工作：${item.company}`} onClick={() => update(rows.filter(value => value.id !== item.id))}>移除</button>
      </div></li>)}</ol>
      <button type="button" onClick={() => choose('new')}>新增經歷</button>
    </> : <form key={editId} className="editor-add-form" onSubmit={submit}>
      <label>經歷標題／公司或學校名稱<input name="company" defaultValue={row?.company || ''} required maxLength={300} /></label>
      <label>職稱（選填）<input name="title" defaultValue={row?.title || ''} placeholder="學生、自學期間可留空" maxLength={300} /></label>
      <div className="work-form-dates"><label>開始年月<input type="month" name="start" defaultValue={row?.start || ''} required /></label><label>結束年月<input type="month" name="end" defaultValue={row?.end || ''} disabled={current} required={!current} /></label></div>
      <label className="work-form-current"><input type="checkbox" checked={current} onChange={event => setCurrent(event.target.checked)} />持續至今</label>
      <div className="work-extra-fields">
        <label>使用工具<input name="tools" defaultValue={row?.tools || ''} placeholder="例如：Unity / C#" maxLength={1000} /></label>
        <label>工作／學習內容（選填）<textarea name="description" defaultValue={row?.paragraphs.join('\n\n') || ''} rows={5} maxLength={10000} placeholder="Enter 換行，空一行分段。" /></label>
        <label>相關作品連結<textarea name="links" defaultValue={row?.links.map(link => `${link.text} | ${link.href}`).join('\n') || ''} rows={2} placeholder="每行一筆：連結文字 | https://網址" maxLength={10000} /></label>
      </div>
      {message && <p role="alert">{message}</p>}
      <div className="editor-actions"><button type="submit">{row ? '套用到畫面' : '加入畫面'}</button><button type="button" onClick={() => choose(null)}>返回清單</button></div>
    </form>}
  </dialog>;
}
