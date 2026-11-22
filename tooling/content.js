import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { projects, projectGroups, featuredIds } from '../src/data/projects.js';
import content from '../src/data/content.json' with { type: 'json' };
import { validateWorkExperiences } from '../src/content/work.js';

export const projectRoot = resolve(import.meta.dirname, '..');

// Return actionable diagnostics before generating entries or starting a build.
export function validateContent({ root = projectRoot, projectList = projects, groups = projectGroups, featured = featuredIds } = {}) {
  const errors = [];
  const ids = new Set();
  const groupIds = new Set(groups.map(group => group.id));
  for (const project of projectList) {
    const label = project.id || '(missing id)';
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(project.id || '') || ['home', 'list'].includes(project.id)) errors.push(`${label}: invalid or reserved project id`);
    if (ids.has(project.id?.toLowerCase())) errors.push(`${label}: duplicate project id (case-insensitive)`);
    ids.add(project.id?.toLowerCase());
    for (const field of ['title', 'category', 'type', 'summary']) {
      if (typeof project[field] !== 'string' || !project[field].trim()) errors.push(`${label}: ${field} is required`);
    }
    if (!groupIds.has(project.group)) errors.push(`${label}: unknown group ${project.group}`);
    if (!Array.isArray(project.tags) || project.tags.some(tag => typeof tag !== 'string' || !tag.trim())) errors.push(`${label}: tags are required`);
    if (!Array.isArray(project.responsibilities) || project.responsibilities.length > 20 || project.responsibilities.some(item => typeof item !== 'string' || !item.trim())) errors.push(`${label}: responsibilities must be a list of up to 20 texts; use [] when empty`);
    if (!Array.isArray(project.images) || !project.images.length) errors.push(`${label}: images are required`);
    if (!project.images?.includes(project.cover)) errors.push(`${label}: cover must appear in images`);
    if (new Set(project.images).size !== project.images?.length) errors.push(`${label}: duplicate image`);
    for (const file of project.images || []) {
      if (!/^[\w-]+\.(png|jpe?g|webp|gif|svg)$/i.test(file)) errors.push(`${label}: invalid image filename ${file}`);
      else if (!existsSync(resolve(root, 'projects', label, file))) errors.push(`${label}: missing image ${file}`);
    }
    for (const field of ['sections', 'mechanics']) {
      const sections = project[field];
      if (field === 'sections' && (!Array.isArray(sections) || !sections.length)) errors.push(`${label}: sections are required`);
      if (sections && (!Array.isArray(sections) || sections.some(section => !section.title || !Array.isArray(section.paragraphs) || !section.paragraphs.length || section.paragraphs.some(p => typeof p !== 'string' || !p.trim())))) errors.push(`${label}: invalid ${field}`);
    }
    for (const field of ['download', 'external']) {
      if (!project[field]) continue;
      try { if (new URL(project[field]).protocol !== 'https:') throw new Error(); }
      catch { errors.push(`${label}: ${field} must be an absolute HTTPS URL`); }
    }
    if (project.video && !/^[\w-]{11}$/.test(project.video)) errors.push(`${label}: invalid YouTube video id`);
  }
  if (!projectList.length) errors.push('At least one project is required');
  if (new Set(featured).size !== featured.length) errors.push('Duplicate featured project');
  for (const id of featured) if (!projectList.some(project => project.id === id)) errors.push(`Unknown featured project: ${id}`);
  return errors;
}

export function assertValidContent() {
  const errors = [...validateContent(), ...validateWorkExperiences(content.profile.workExperiences, content.projects)];
  if (errors.length) throw new Error(`Portfolio content is invalid:\n- ${errors.join('\n- ')}`);
}
