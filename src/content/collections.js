import { readField, writeField } from './model.js';

export function updateCollection(document, field, action) {
  const rows = [...(readField(document, field) || [])];
  if (action.type !== 'add' && (!Number.isInteger(action.index) || action.index < 0 || action.index >= rows.length)) return document;
  if (action.type === 'add') rows.push(action.value);
  else if (action.type === 'remove') rows.splice(action.index, 1);
  else if (action.type === 'move') {
    const target = action.index + action.step;
    if (target < 0 || target >= rows.length) return document;
    [rows[action.index], rows[target]] = [rows[target], rows[action.index]];
  } else return document;
  const next = writeField(document, field, rows);
  // Keep related links attached to the same paragraph when paragraphs move.
  const match = /^profile\.experiences\.(\d+)\.paragraphs$/.exec(field);
  if (match && action.type !== 'add') {
    const row = next.profile.experiences[Number(match[1])];
    row.links = row.links.map(link => {
      if (link.afterParagraph === undefined) return link;
      let index = link.afterParagraph;
      if (action.type === 'remove') index = index > action.index ? index - 1 : Math.min(index, rows.length - 1);
      else if (index === action.index) index += action.step;
      else if (index === action.index + action.step) index -= action.step;
      return { ...link, afterParagraph: Math.max(0, index) };
    });
  }
  return next;
}
