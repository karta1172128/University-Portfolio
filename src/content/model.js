import { editorSchema, validateStructure } from './schema.js';
import { validateWorkExperiences } from './work.js';

export function readField(document, path) {
  return path.split('.').reduce((value, key) => value?.[key], document);
}

export function writeField(document, path, value) {
  const next = structuredClone(document);
  const keys = path.split('.');
  const key = keys.pop();
  const parent = keys.reduce((item, part) => item[part], next);
  parent[key] = value;
  return next;
}

export function splitParagraphs(text) {
  return text.replaceAll('\r\n', '\n').split(/\n[\t ]*\n+/).map(paragraph => paragraph.trim()).filter(Boolean);
}

// Shared validation permits collection edits, while routes and media paths stay protected.
export function validateEditorDocument(next, base) {
  const errors = validateStructure(next, editorSchema(base), next?.projects || {});
  errors.push(...validateWorkExperiences(next?.profile?.workExperiences, next?.projects));
  for (const project of Object.values(next?.projects || {})) {
    if (Array.isArray(project?.images) && (!project.images.includes(project.cover) || new Set(project.images).size !== project.images.length)) errors.push('封面必須位於圖片清單，圖片不可重複。');
  }
  for (const row of Array.isArray(next?.profile?.experiences) ? next.profile.experiences : []) {
    if (Array.isArray(row?.links) && row.links.some(link => link?.afterParagraph !== undefined && link.afterParagraph >= (row.paragraphs?.length || 0))) errors.push('經歷連結的段落位置不存在。');
  }
  return errors;
}
