import { useContext } from 'react';
import { EditorContext, Text, useContent } from './Content.jsx';
import { readField } from './model.js';
import { updateCollection } from './collections.js';
import { sitePath } from '../paths.js';

export function InlineList({ field, label, as: Tag = 'div', itemAs: Item = 'div', itemClassName, create = '', min = 0, max = 30, filter, children, keepEmpty = false, ...props }) {
  const editor = useContext(EditorContext);
  const rows = readField(useContent(), field) || [];
  const editing = editor?.editing;
  if ((!rows.length || (filter && !rows.some(filter))) && !editing && !keepEmpty) return null;
  const change = action => editor.replaceDocument(current => updateCollection(current, field, action));
  const add = () => {
    change({ type: 'add', value: typeof create === 'function' ? create() : structuredClone(create) });
    requestAnimationFrame(() => window.document.querySelector(`[data-edit-field="${field}.${rows.length}"], [data-edit-field^="${field}.${rows.length}."]`)?.focus());
  };
  const AddTag = Tag === 'ul' || Tag === 'ol' ? 'li' : 'div';
  return <Tag {...props} data-edit-list={editing ? field : undefined}>
    {rows.map((row, i) => (!filter || filter(row, i)) && <Item key={row?.id || i} className={`${typeof itemClassName === 'function' ? itemClassName(row, i) : itemClassName || ''}${editing ? ' inline-edit-item' : ''}`}>
      {children(row, i)}
      {editing && <span className="inline-item-tools">
        <button type="button" title="上移" aria-label={`上移${label}第 ${i + 1} 項`} disabled={i === 0} onClick={() => change({ type: 'move', index: i, step: -1 })}>↑</button>
        <button type="button" title="下移" aria-label={`下移${label}第 ${i + 1} 項`} disabled={i === rows.length - 1} onClick={() => change({ type: 'move', index: i, step: 1 })}>↓</button>
        <button type="button" title="移除" aria-label={`移除${label}第 ${i + 1} 項`} disabled={rows.length <= min} onClick={() => change({ type: 'remove', index: i })}>×</button>
      </span>}
    </Item>)}
    {editing && <AddTag className="inline-add"><button type="button" disabled={rows.length >= max} aria-label={`新增${label}`} onClick={add}>＋<span>{label}</span></button></AddTag>}
  </Tag>;
}

export function InlineLinks({ field, afterParagraph, paragraphCount, className = 'experience-links' }) {
  const editor = useContext(EditorContext);
  return <InlineList field={field} label="連結" className={className} itemClassName="inline-link-item" max={10}
    filter={afterParagraph === undefined ? undefined : link => (link.afterParagraph ?? paragraphCount - 1) === afterParagraph}
    create={() => ({ text: '', href: '', ...(afterParagraph === undefined ? {} : { afterParagraph }) })}>
    {(link, i) => editor?.editing ? <>
      <Text field={`${field}.${i}.text`} placeholder="連結文字" />
      <input aria-label={`連結網址第 ${i + 1} 項`} placeholder="https://… 或現有作品路徑" value={link.href} onChange={event => editor.setField(`${field}.${i}.href`, event.target.value)} />
    </> : <a className="button button-quiet experience-project-link" href={link.href.startsWith('https:') ? link.href : sitePath(link.href)}>{link.text}</a>}
  </InlineList>;
}
