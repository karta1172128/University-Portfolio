import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { projects, featuredIds, projectGroups, nextProject } from '../src/data/projects.js';
import { pages, createPages } from '../src/data/pages.js';
import { validateContent } from '../tooling/content.js';
import { renderEntry } from '../tooling/prepare-pages.mjs';

const root = resolve(import.meta.dirname, '..');

test('every registered project retains its source screenshots and a valid cover', () => {
  assert(projects.length > 0);
  assert.equal(new Set(projects.map(project => project.id)).size, projects.length);
  for (const project of projects) {
    const folder = resolve(root, 'projects', project.id);
    const originals = readdirSync(folder).filter(file => /^\d+\.png$/.test(file)).sort();
    assert.deepEqual(project.images, originals, project.id);
    assert(project.images.includes(project.cover), `Missing cover for ${project.id}`);
    assert(project.sections.length > 0 && project.sections.every(section => section.paragraphs.length > 0));
    assert(projectGroups.some(group => group.id === project.group));
  }
  assert(featuredIds.every(id => projects.some(project => project.id === id)));
  assert.deepEqual(validateContent(), []);
});

test('the production build retains all registered URLs and locally resolves entry assets', () => {
  for (const { path: entry, id, title, description } of pages) {
    const file = resolve(root, 'dist', entry);
    assert(existsSync(file), `Missing build entry: ${entry}`);
    const html = readFileSync(file, 'utf8');
    for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const url = match[1];
      if (/^(?:[a-z]+:|#|\/\/)/i.test(url)) continue;
      assert(!url.startsWith('/'), `Root-only path breaks project Pages: ${entry} ${url}`);
      assert(existsSync(resolve(dirname(file), url)), `Missing entry asset: ${entry} ${url}`);
    }
    assert(!html.includes('cdnjs.cloudflare.com'));
    assert(html.includes('id="root"'));
    assert(html.includes(`data-page="${id}"`));
    assert(html.includes(title.replaceAll('&', '&amp;')));
    assert(html.includes(description.replaceAll('&', '&amp;').replaceAll('"', '&quot;')));
  }
});

test('adding a project creates its entry without changing route or build code', () => {
  const extended = [...projects, { ...projects[0], id: 'FutureProject', title: 'A & B <作品>', fullTitle: undefined, pageTitle: undefined }];
  const generated = createPages(extended);
  assert.equal(generated.length, pages.length + 1);
  const page = generated.at(-1);
  assert.equal(page.path, 'projects/FutureProject/index.html');
  const html = renderEntry(page);
  assert(html.includes('A &amp; B &lt;作品&gt;'));
  assert(html.includes('src="../../src/main.jsx"'));
  for (const prefix of ['https://example.test/', 'https://example.test/University-Portfolio/']) {
    const entry = new URL(page.path, prefix);
    assert.equal(new URL('../../src/main.jsx', entry).href, new URL('src/main.jsx', prefix).href);
  }
});

test('content validation catches broken references before build', () => {
  const invalid = structuredClone(projects);
  invalid[0].group = 'unknown';
  invalid[0].cover = 'missing.png';
  invalid[0].images.push('missing.png');
  invalid[0].external = 'javascript:alert(1)';
  invalid.push({ ...invalid[1], id: invalid[1].id.toLowerCase() });
  const errors = validateContent({ projectList: invalid, featured: ['UnknownProject'] });
  for (const expected of ['unknown group', 'missing image', 'duplicate project id', 'absolute HTTPS URL', 'Unknown featured project']) {
    assert(errors.some(error => error.includes(expected)), expected);
  }
});

test('next-project navigation follows registry order and wraps at the end', () => {
  assert.equal(nextProject(projects[0].id), projects[1]);
  assert.equal(nextProject(projects.at(-1).id), projects[0]);
  assert.equal(nextProject('missing'), undefined);
});

test('the introduction and experience anchors remain available', () => {
  const source = readFileSync(resolve(root, 'src/components/ProfileSections.jsx'), 'utf8');
  const sections = [...source.matchAll(/<section id="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(sections, ['Introduction', 'Experience']);
  assert.equal(projects.find(project => project.id === 'PureSpirit').mechanics.length, 2);
});
