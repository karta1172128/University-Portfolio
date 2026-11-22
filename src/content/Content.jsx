import { createContext, useContext, useLayoutEffect, useRef } from 'react';
import content from '../data/content.json';
import { readField, splitParagraphs } from './model.js';

export const EditorContext = createContext(null);
export function useContent() {
  return useContext(EditorContext)?.document || content;
}
export function useEditing() {
  return Boolean(useContext(EditorContext)?.editing);
}

export function Text({ field, as: Tag = 'span', multiline = false, paragraphs = false, placeholder = '', ...props }) {
  const editor = useContext(EditorContext);
  const document = useContent();
  const source = readField(document, field) ?? '';
  const value = paragraphs ? source.join('\n\n') : source;
  const element = useRef(null);
  const editing = editor?.editing;
  const style = multiline || paragraphs ? { whiteSpace: 'pre-line', ...props.style } : props.style;
  useLayoutEffect(() => {
    if (editing && element.current && window.document.activeElement !== element.current) element.current.textContent = value;
  }, [value, editing]);

  if (!editing && paragraphs) return <Tag key="reading" {...props}>{source.map((paragraph, i) => <p key={i} style={{ whiteSpace: 'pre-line' }}>{paragraph}</p>)}</Tag>;
  if (!editing) return <Tag key="reading" {...props} style={style}>{value}</Tag>;
  return <Tag key="editing" {...props} style={style} ref={element} contentEditable="plaintext-only" suppressContentEditableWarning
    data-edit-field={field} data-placeholder={placeholder} role="textbox" aria-label={`編輯：${value.slice(0, 32) || placeholder}`} aria-multiline={multiline || paragraphs} tabIndex={0}
    onInput={event => {
      const text = event.currentTarget.innerText.replaceAll('\r\n', '\n');
      editor.setField(field, paragraphs ? splitParagraphs(text) : text);
    }}
    onClick={event => { event.preventDefault(); event.stopPropagation(); }}
    onKeyDown={event => {
      if (event.key === 'Escape' || (event.key === 'Enter' && !multiline && !paragraphs && !event.nativeEvent.isComposing)) {
        event.preventDefault(); event.currentTarget.blur();
      }
    }} />;
}
