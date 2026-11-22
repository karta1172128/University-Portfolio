import { useEffect, useReducer, useState } from 'react';
import initialContent from '../data/content.json';
import { EditorContext } from './Content.jsx';
import { validateEditorDocument, writeField } from './model.js';
import './editor.css';
import { workDemoRows } from './WorkManager.jsx';

import ContentManager from './ContentManager.jsx';
import { documentHistory } from './history.js';

const endpoint = '/__portfolio_editor/content';

export default function Editor({ children }) {
  const [history, dispatch] = useReducer(documentHistory, { past: [], present: initialContent, future: [] });
  const document = history.present;
  const setDocument = value => dispatch({ type: 'replace', value });
  const [contentScope, setContentScope] = useState(null);
  const [saved, setSaved] = useState(initialContent);
  const [connection, setConnection] = useState(null);
  const [editing, setEditing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('正在連接本機專案…');
  const [workDemo, setWorkDemo] = useState(false);
  const [workSelection, setWorkSelection] = useState('');
  const dirty = JSON.stringify(document) !== JSON.stringify(saved);

  useEffect(() => {
    const controller = new AbortController();
    fetch(endpoint, { signal: controller.signal, cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error('本機編輯服務未啟動，請使用 npm.cmd run edit。');
      const data = await response.json();
      dispatch({ type: 'reset', value: data.document }); setSaved(data.document); setConnection({ token: data.token, revision: data.revision });
      setMessage('點選虛線文字直接編輯，用＋新增項目；完成後預覽並儲存到專案。');
    }).catch(error => { if (error.name !== 'AbortError') setMessage(error.message); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const unload = event => { event.preventDefault(); event.returnValue = ''; };
    const navigate = event => {
      const link = event.target.closest('a[href]');
      if (!link || event.defaultPrevented || link.target === '_blank' || event.target.closest('[contenteditable]')) return;
      const next = new URL(link.href, location.href);
      if (next.pathname !== location.pathname || next.origin !== location.origin) {
        event.preventDefault(); setMessage('還有未儲存的修改。請先儲存或放棄修改，再切換頁面。');
      }
    };
    window.addEventListener('beforeunload', unload);
    window.document.addEventListener('click', navigate, true);
    return () => { window.removeEventListener('beforeunload', unload); window.document.removeEventListener('click', navigate, true); };
  }, [dirty]);

  async function save() {
    if (!connection || !dirty || saving) return;
    const errors = validateEditorDocument(document, saved);
    if (errors.length) { setMessage(`尚未儲存：\n${errors.slice(0, 5).join('\n')}`); return; }
    setSaving(true); setMessage('正在儲存到本機專案…');
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Editor-Token': connection.token },
        body: JSON.stringify({ document, revision: connection.revision }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '儲存失敗。');
      setSaved(document); setConnection(value => ({ ...value, revision: data.revision }));
      setMessage('已儲存到專案。重新開啟頁面後仍會保留。');
    } catch (error) { setMessage(error.message); }
    finally { setSaving(false); }
  }

  const setField = (field, value) => setDocument(current => writeField(current, field, value));
  return <EditorContext.Provider value={{ document, replaceDocument: setDocument, openContentManager: setContentScope, editing: editing && Boolean(connection) && !saving, setField, workDemo: workDemo ? workDemoRows : null, setWorkDemo, workSelection, selectWork: setWorkSelection }}>
    {children}
    {contentScope && <ContentManager initialScope={contentScope} onClose={() => setContentScope(null)} />}
    <aside className="editor-toolbar" aria-label="本機文字編輯工具">
      <div className="editor-status"><strong>本機內容編輯</strong><span className={dirty ? 'editor-dirty' : ''}>{dirty ? '尚未儲存' : '與專案一致'}</span></div>
      <div className="editor-actions">
        <button type="button" onClick={() => setEditing(value => !value)} disabled={!connection || saving}>{editing ? '預覽排版' : '繼續編輯'}</button>
        <button type="button" disabled={!connection || saving} onClick={() => setContentScope(window.document.body.dataset.page && document.projects[window.document.body.dataset.page] ? `projects.${window.document.body.dataset.page}` : 'profile')}>進階設定</button>
        <button type="button" disabled={!history.past.length || saving} onClick={() => dispatch({ type: 'undo' })}>復原</button>
        <button type="button" disabled={!history.future.length || saving} onClick={() => dispatch({ type: 'redo' })}>重做</button>

        <button type="button" disabled={!dirty || saving} onClick={() => { setDocument(saved); setMessage('已放棄尚未儲存的修改。'); }}>放棄修改</button>
        <button className="editor-save" type="button" disabled={!connection || !dirty || saving} onClick={save}>{saving ? '儲存中…' : '儲存到專案'}</button>
      </div>
      <p role="status" aria-live="polite">{message}</p>
    </aside>
  </EditorContext.Provider>;
}
