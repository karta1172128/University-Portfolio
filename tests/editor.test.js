import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import content from '../src/data/content.json' with { type: 'json' };
import { splitParagraphs, validateEditorDocument, writeField } from '../src/content/model.js';
import { createEditorMiddleware, editorEndpoint } from '../tooling/editor-plugin.js';
import { documentHistory } from '../src/content/history.js';

test('collection edits add, remove and reorder tags, optional fields, skills and experience links', () => {
  const edited = structuredClone(content);
  edited.projects.PureSpirit.tags = [];
  edited.projects.SaveLunch.tags = ['新標籤', '第二個標籤'];
  edited.projects.PureSpirit.team = '';
  edited.projects.PureSpirit.responsibilities = [];
  edited.projects.SaveLunch.award = '新增獎項';
  edited.projects.SaveLunch.external = 'https://example.com/work';
  edited.projects.SaveLunch.mechanics = [{ title: '新區塊', paragraphs: ['第一段', '第二段'] }];
  edited.profile.facts.reverse();
  edited.profile.paragraphs.push('新增自我介紹');
  edited.skills.push({ name: '新技能', title: '', description: '持續學習中' });
  edited.profile.experiences[0].links = [{ text: '相關作品', href: 'projects/PureSpirit/index.html', afterParagraph: 0 }];
  assert.deepEqual(validateEditorDocument(edited, content), []);
  for (const href of ['javascript:alert(1)', 'http://example.com', 'https://user:password@example.com', '../secret', 'projects/Missing/index.html']) {
    const invalid = structuredClone(edited);
    invalid.profile.experiences[0].links[0].href = href;
    assert(validateEditorDocument(invalid, content).length > 0, href);
  }
  edited.profile.experiences[0].links[0].afterParagraph = 29;
  assert(validateEditorDocument(edited, content).length > 0);
  const many = structuredClone(content);
  many.projects.PureSpirit.tags = Array(21).fill('標籤');
  assert(validateEditorDocument(many, content).length > 0);
});

test('undo and redo restore collection edits and discard the replaced future', () => {
  let state = { past: [], present: content, future: [] };
  state = documentHistory(state, { type: 'replace', value: writeField(content, 'projects.PureSpirit.tags', []) });
  assert.equal(state.present.projects.PureSpirit.tags.length, 0);
  state = documentHistory(state, { type: 'undo' });
  assert.deepEqual(state.present, content);
  state = documentHistory(state, { type: 'redo' });
  assert.equal(state.present.projects.PureSpirit.tags.length, 0);
  state = documentHistory(state, { type: 'undo' });
  state = documentHistory(state, { type: 'replace', value: value => writeField(value, 'site.name', '另一個版本') });
  assert.equal(state.future.length, 0);
  for (let i = 0; i < 60; i++) state = documentHistory(state, { type: 'replace', value: value => writeField(value, 'site.name', String(i)) });
  assert.equal(state.past.length, 50);
});

test('editor preserves protected structure while allowing text and experience management', () => {
  assert.deepEqual(validateEditorDocument(content, content), []);
  const edited = writeField(content, 'profile.name', '測試名字');
  edited.profile.experiences.unshift({ id: 'new-role', category: '', context: '', title: '工具開發', paragraphs: ['整理工具流程。'], links: [] });
  edited.profile.experiences.pop();
  assert.deepEqual(validateEditorDocument(edited, content), []);
  assert.notEqual(content.profile.name, edited.profile.name);
  const invalid = structuredClone(content);
  invalid.projects.PureSpirit.images[0] = '../private-file';
  invalid.profile.experiences[0].links.push({ href: 'javascript:alert(1)', text: '不允許的連結' });
  invalid.site.email = 'invalid';
  assert(validateEditorDocument(invalid, content).length >= 3);
  const missingTitle = structuredClone(edited);
  missingTitle.profile.experiences[0].title = '';
  assert(validateEditorDocument(missingTitle, content).some(error => error.includes('標題')));
});

test('project body edits can add paragraphs while preserving line breaks and protected structure', () => {
  const path = 'projects.MillingMachine.sections.0.paragraphs';
  const paragraphs = splitParagraphs('第一段\r\n同段換行\r\n\r\n第二段\n\n第三段');
  assert.deepEqual(paragraphs, ['第一段\n同段換行', '第二段', '第三段']);
  const edited = writeField(content, path, paragraphs);
  assert.deepEqual(validateEditorDocument(edited, content), []);
  for (const value of [[], [''], ['a'.repeat(10001)], Array(31).fill('一段'), [{ html: '<script>' }]]) {
    assert(validateEditorDocument(writeField(content, path, value), content).length > 0);
  }
  const invalid = structuredClone(edited);
  invalid.projects.MillingMachine.sections.push({ title: '新增區塊', paragraphs: ['可以新增區塊'] });
  assert.deepEqual(validateEditorDocument(invalid, content), []);
  const mechanics = writeField(content, 'projects.PureSpirit.mechanics.0.paragraphs', ['玩法一', '玩法二']);
  assert.deepEqual(validateEditorDocument(mechanics, content), []);
});

test('local save API persists valid text, blocks foreign requests and protects concurrent edits', async () => {
  const root = resolve(import.meta.dirname, '..');
  const directory = mkdtempSync(resolve(root, '.editor-test-'));
  const file = resolve(directory, 'content.json');
  writeFileSync(file, `${JSON.stringify(content, null, 2)}\n`);
  const middleware = createEditorMiddleware(file);
  const server = createServer((request, response) => middleware(request, response, () => { response.writeHead(404); response.end(); }));
  try {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const origin = `http://127.0.0.1:${server.address().port}`;
    const url = `${origin}${editorEndpoint}`;
    const snapshot = await (await fetch(url)).json();
    assert.equal((await fetch(url, { headers: { Origin: 'https://foreign.example' } })).status, 403);
    const document = writeField(snapshot.document, 'profile.name', '本機儲存驗證');
    document.projects.MillingMachine.sections[0].paragraphs = ['第一段\n同段換行', '新增的第二段'];
    document.projects.PureSpirit.tags = [];
    document.projects.SaveLunch.tags = ['新增可儲存標籤'];
    document.projects.PureSpirit.responsibilities = [];
    document.profile.workExperiences = [{ id: 'work-api-test', company: '儲存測試公司', title: '工程師', start: '2024-01', end: '', current: true, tools: '', paragraphs: ['工作內容'], links: [] }];
    const body = JSON.stringify({ document, revision: snapshot.revision });
    const headers = { Origin: origin, 'Content-Type': 'application/json', 'X-Editor-Token': snapshot.token };
    assert.equal((await fetch(url, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body })).status, 403);
    const saved = await fetch(url, { method: 'POST', headers, body });
    assert.equal(saved.status, 200);
    assert.equal(JSON.parse(readFileSync(file, 'utf8')).profile.name, '本機儲存驗證');
    assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')).profile.workExperiences, document.profile.workExperiences);
    assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')).projects.PureSpirit.tags, []);
    assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')).projects.SaveLunch.tags, ['新增可儲存標籤']);
    assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')).projects.MillingMachine.sections[0].paragraphs, document.projects.MillingMachine.sections[0].paragraphs);
    assert.equal((await fetch(url, { method: 'POST', headers, body })).status, 409);
    const current = await (await fetch(url)).json();
    const corrupt = structuredClone(current.document);
    corrupt.projects.PureSpirit.id = 'ChangedURL';
    assert.equal((await fetch(url, { method: 'POST', headers, body: JSON.stringify({ document: corrupt, revision: current.revision }) })).status, 422);
    assert.equal(JSON.parse(readFileSync(file, 'utf8')).projects.PureSpirit.id, 'PureSpirit');
  } finally {
    await new Promise(resolve => server.close(resolve));
    // Restrict recursive cleanup to this test's freshly created workspace directory.
    assert.equal(dirname(directory), root);
    assert(basename(directory).startsWith('.editor-test-'));
    rmSync(directory, { recursive: true, force: true });
  }
});

test('published build contains neither editor UI assets nor its local write endpoint', () => {
  const folder = resolve(import.meta.dirname, '../dist/assets');
  for (const file of readdirSync(folder).filter(file => /\.(js|css)$/.test(file))) {
    const source = readFileSync(resolve(folder, file), 'utf8');
    assert(!source.includes('/__portfolio_editor/content'), file);
    assert(!source.includes('editor-toolbar'), file);
    assert(!source.includes('儲存到專案'), file);
    assert(!source.includes('示範公司 A'), file);
  }
});
