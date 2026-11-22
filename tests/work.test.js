import test from 'node:test';
import assert from 'node:assert/strict';
import content from '../src/data/content.json' with { type: 'json' };
import { validateEditorDocument, writeField } from '../src/content/model.js';
import { orderedWorkEntries, workPreview, validateWorkExperiences, workPeriod } from '../src/content/work.js';
import { snapWorkIndex, workTrackOffset } from '../src/components/carousel.js';

const job = () => ({ id: 'work-test', company: '測試公司', title: '工程師', start: '2023-01', end: '', current: true, tools: 'Unity / C#', paragraphs: ['工作說明'], links: [{ text: '作品', href: 'projects/PureSpirit/index.html' }] });

test('chronological display retains original indices so editing updates the correct entry', () => {
  const rows = [job(), { ...job(), id: 'older', start: '2018-09', current: false, end: '2022-06' }];
  const entries = orderedWorkEntries(rows);
  assert.deepEqual(entries.map(entry => entry.row.id), ['older', 'work-test']);
  assert.deepEqual(entries.map(entry => entry.sourceIndex), [1, 0]);
  const edited = writeField({ profile: { workExperiences: rows } }, `profile.workExperiences.${entries[0].sourceIndex}.company`, '修改學校');
  assert.equal(edited.profile.workExperiences[1].company, '修改學校');
  assert.equal(edited.profile.workExperiences[0].company, '測試公司');
  assert.deepEqual(rows.map(row => row.id), ['work-test', 'older']);
});

test('horizontal release retains distance and speed snapping within timeline bounds', () => {
  assert.equal(snapWorkIndex(1, -310, 0, 460, 4), 2);
  assert.equal(snapWorkIndex(1, 110, 0, 460, 4), 1);
  assert.equal(snapWorkIndex(1, -110, -1.5, 460, 4), 2);
  assert.equal(snapWorkIndex(0, 900, 2, 460, 4), 0);
  assert.equal(snapWorkIndex(3, -900, -2, 460, 4), 3);
  assert.equal(workTrackOffset(0, 460, 1080, 3), 0);
  assert.equal(workTrackOffset(1, 460, 1080, 3), 150);
  assert.equal(workTrackOffset(2, 460, 1080, 3), 300);
  assert.equal(workTrackOffset(1, 460, 1080, 2), 0);
  assert.equal(snapWorkIndex(0, -180, 0, 460, 3, 1080), 1);
});

test('work experiences support add, edit, reorder and removal without unlocking other content', () => {
  const first = job();
  const second = { ...job(), id: 'work-second', start: '2021-01', end: '2022-12', current: false };
  for (const rows of [[first], [second, { ...first, company: '修改公司', paragraphs: ['第一段', '新增段落'] }], [second], []]) {
    assert.deepEqual(validateEditorDocument(writeField(content, 'profile.workExperiences', rows), content), []);
  }
  const invalid = writeField(content, 'profile.workExperiences', [first]);
  invalid.projects.PureSpirit.download = 'javascript:alert(1)';
  assert(validateEditorDocument(invalid, content).length > 0);
  assert.equal(workPeriod(first), '2023/01 — 至今');
  assert.equal(workPeriod(second), '2021/01 — 2022/12');
});

test('work validation rejects invalid dates, duplicate identities and unsafe or missing links', () => {
  const mutations = [
    row => { row.start = '2023-13'; },
    row => { row.current = false; row.end = '2020-01'; },
    row => { row.end = '2024-01'; },
    row => { row.company = ''; },
    row => { row.paragraphs = ['']; },
    row => { row.paragraphs = ['x'.repeat(10001)]; },
    row => { row.extra = true; },
    row => { row.links = [{ text: '錯誤', href: 'javascript:alert(1)' }]; },
    row => { row.links = [{ text: '錯誤', href: 'https://user:password@example.com' }]; },
    row => { row.links = [{ text: '錯誤', href: '../private-file' }]; },
    row => { row.links = [{ text: '錯誤', href: 'projects/Missing/index.html' }]; },
  ];
  for (const mutate of mutations) {
    const row = job(); mutate(row);
    assert(validateWorkExperiences([row], content.projects).length > 0);
  }
  assert(validateWorkExperiences([job(), job()]).length > 0);
  assert.deepEqual(validateWorkExperiences([{ ...job(), links: [{ text: '公開作品', href: 'https://example.com/project' }] }]), []);
  assert.deepEqual(validateWorkExperiences([{ ...job(), paragraphs: [], tools: '', links: [] }]), []);
});

test('non-employment entries allow an empty title and long descriptions expose a preview', () => {
  const entry = { ...job(), company: '自主學習', title: '', tools: '', paragraphs: [] };
  assert.deepEqual(validateEditorDocument(writeField(content, 'profile.workExperiences', [entry]), content), []);
  assert(validateWorkExperiences([{ ...entry, title: null }]).length > 0);
  assert.deepEqual(workPreview([]), { text: '', truncated: false });
  assert.deepEqual(workPreview(['第一段', '第二段']), { text: '第一段\n\n第二段', truncated: false });
  const long = ['說明'.repeat(200)];
  assert.equal(workPreview(long).truncated, true);
  assert(workPreview(long).text.length <= 221);
  assert.equal(long[0].length, 400);
  assert.equal(workPreview(Array(6).fill('工作項目')).truncated, true);
});
