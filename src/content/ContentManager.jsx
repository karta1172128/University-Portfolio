import { useContext, useEffect, useRef, useState } from 'react';
import { EditorContext } from './Content.jsx';
import { editorSchema } from './schema.js';
import { readField, validateEditorDocument, writeField } from './model.js';

function Field({ schema, value, path, update }) {
  if (['fixed', 'identity', 'work'].includes(schema.type)) return null;
  if (schema.type === 'object') return <div className="content-fields">{Object.entries(schema.fields).map(([key, field]) => <Field key={key} schema={field} value={value?.[key]} path={`${path}.${key}`} update={update} />)}</div>;
  if (schema.type === 'list') {
    const rows = value || [];
    function move(index, step) {
      const next = [...rows];
      [next[index], next[index + step]] = [next[index + step], next[index]];
      update(path, next);
    }
    return <fieldset className="content-collection"><legend>{schema.label}（{rows.length}）</legend>
      {rows.map((row, i) => <div className="content-item" key={row?.id || i}>
        <div className="content-item-actions"><span>第 {i + 1} 項</span>
          <button type="button" aria-label={`上移${schema.label}第 ${i + 1} 項`} disabled={!i} onClick={() => move(i, -1)}>↑</button>
          <button type="button" aria-label={`下移${schema.label}第 ${i + 1} 項`} disabled={i === rows.length - 1} onClick={() => move(i, 1)}>↓</button>
          <button type="button" aria-label={`移除${schema.label}第 ${i + 1} 項`} disabled={rows.length <= schema.min} onClick={() => update(path, rows.filter((_, index) => index !== i))}>移除</button>
        </div>
        <Field schema={schema.item} value={row} path={`${path}.${i}`} update={update} />
      </div>)}
      <button type="button" disabled={rows.length >= schema.max} onClick={() => {
        const item = structuredClone(schema.initial);
        if (item && typeof item === 'object' && 'id' in item) item.id = `experience-${crypto.randomUUID()}`;
        update(path, [...rows, item]);
      }}>新增{schema.label}</button>
      {!rows.length && <p>目前沒有項目，可按上方按鈕新增。</p>}
    </fieldset>;
  }
  const id = `manage-${path}`;
  const label = `${schema.label}${schema.required === false ? '（選填，可留空）' : ''}`;
  const props = { id, 'aria-label': label, value: value ?? '', onChange: event => update(path, event.target.value), maxLength: schema.max || 10000 };
  return <label className="content-field" htmlFor={id}>{label}
    {schema.type === 'number' ? <input id={id} aria-label={label} type="number" min="1" max="30" value={(value ?? 0) + 1} onChange={event => update(path, Number(event.target.value) - 1)} />
      : schema.options ? <select id={id} aria-label={label} value={value ?? ''} onChange={props.onChange}>{schema.required === false && <option value="">不顯示</option>}{schema.options.map(option => <option key={option} value={option}>{({ Special: '計畫與畢業專題', Junior: '大三課程實作', Sophomore: '大二課程實作' })[option] || option}</option>)}</select>
        : schema.multiline ? <textarea {...props} rows={3} /> : <input {...props} />}
    {typeof value === 'string' && value.trim() === 'null' && <small>這是文字「null」，若不需要請清空選填欄位或移除項目。</small>}
  </label>;
}

export default function ContentManager({ initialScope, onClose }) {
  const editor = useContext(EditorContext);
  const [draft, setDraft] = useState(() => structuredClone(editor.document));
  const [schema] = useState(() => editorSchema(editor.document));
  const [scope, setScope] = useState(initialScope || 'profile');
  const [errors, setErrors] = useState([]);
  const dialog = useRef(null);
  useEffect(() => { dialog.current.showModal(); }, []);
  const scopes = [['profile', '自我介紹與相關經歷'], ['skills', '個人技能'], ['site', '網站與聯絡資料'], ...Object.entries(draft.projects).map(([id, project]) => [`projects.${id}`, `作品：${project.title}`])];
  if (!scopes.some(([path]) => path === scope)) scopes.unshift([scope, '目前卡片標籤']);
  const currentSchema = scope.split('.').reduce((node, key) => node.fields[key], schema);
  const changed = JSON.stringify(draft) !== JSON.stringify(editor.document);
  useEffect(() => {
    if (!changed) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [changed]);
  function apply() {
    const issues = validateEditorDocument(draft, editor.document);
    if (issues.length) { setErrors(issues); return; }
    editor.replaceDocument(draft);
    onClose();
  }
  return <dialog ref={dialog} className="editor-manager content-manager" aria-labelledby="content-manager-title" onCancel={onClose} onClose={onClose}>
    <div className="editor-manager-heading"><h2 id="content-manager-title">管理全站內容</h2><button type="button" aria-label="取消並關閉內容管理" onClick={onClose}>×</button></div>
    <p>增刪與排序完成後按「套用到畫面」，再預覽並儲存到專案。關閉此視窗會取消這次尚未套用的調整。</p>
    <label className="content-field">編輯區域<select aria-label="編輯區域" value={scope} onChange={event => setScope(event.target.value)}>{scopes.map(([path, label]) => <option key={path} value={path}>{label}</option>)}</select></label>
    <Field schema={currentSchema} value={readField(draft, scope)} path={scope} update={(path, value) => { setDraft(current => writeField(current, path, value)); setErrors([]); }} />
    {errors.length > 0 && <div role="alert" className="content-errors"><p>尚未套用，請修正：</p><ul>{errors.map((error, i) => <li key={i}>{error}</li>)}</ul></div>}
    <div className="content-manager-footer"><button type="button" disabled={!changed} onClick={apply}>套用到畫面</button><button type="button" onClick={onClose}>取消</button></div>
  </dialog>;
}
