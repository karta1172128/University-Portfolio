import test from 'node:test';
import assert from 'node:assert/strict';
import content from '../src/data/content.json' with { type: 'json' };
import { updateCollection } from '../src/content/collections.js';
import { validateEditorDocument } from '../src/content/model.js';

test('inline contributions and tags support zero items, addition and reordering without changing the source', () => {
  const field = 'projects.Lathe.responsibilities';
  let next = structuredClone(content);
  while (next.projects.Lathe.responsibilities.length) next = updateCollection(next, field, { type: 'remove', index: 0 });
  next = updateCollection(next, field, { type: 'add', value: '新增任務一' });
  next = updateCollection(next, field, { type: 'add', value: '新增任務二' });
  next = updateCollection(next, field, { type: 'move', index: 1, step: -1 });
  assert.deepEqual(next.projects.Lathe.responsibilities, ['新增任務二', '新增任務一']);
  assert.notDeepEqual(next.projects.Lathe.responsibilities, content.projects.Lathe.responsibilities);
  assert.deepEqual(validateEditorDocument(next, content), []);
  const tags = updateCollection(content, 'projects.GloriousBottle.tags', { type: 'remove', index: 0 });
  assert.equal(tags.projects.GloriousBottle.tags.length, content.projects.GloriousBottle.tags.length - 1);
  assert.deepEqual(validateEditorDocument(tags, content), []);
  const invalid = structuredClone(content);
  delete invalid.projects.Lathe.responsibilities;
  assert(validateEditorDocument(invalid, content).length > 0);
  delete invalid.projects.Lathe.tags;
  assert(validateEditorDocument(invalid, content).length >= 2);
});

test('paragraph movement and deletion retain links on the corresponding surviving paragraph', () => {
  const before = structuredClone(content);
  before.profile.experiences = [{ id: 'links-test', category: '', context: '', title: '經歷', paragraphs: ['第一段', '第二段', '第三段'], links: [
    { text: '第一個', href: 'https://example.com/one', afterParagraph: 0 },
    { text: '第二個', href: 'https://example.com/two', afterParagraph: 1 },
    { text: '最後一段', href: 'https://example.com/last' },
  ] }];
  const field = 'profile.experiences.0.paragraphs';
  const moved = updateCollection(before, field, { type: 'move', index: 0, step: 1 });
  assert.deepEqual(moved.profile.experiences[0].paragraphs, ['第二段', '第一段', '第三段']);
  assert.deepEqual(moved.profile.experiences[0].links.map(link => link.afterParagraph), [1, 0, undefined]);
  const removed = updateCollection(moved, field, { type: 'remove', index: 0 });
  assert.deepEqual(removed.profile.experiences[0].links.map(link => link.afterParagraph), [0, 0, undefined]);
  assert.deepEqual(validateEditorDocument(removed, before), []);
  assert.deepEqual(before.profile.experiences[0].paragraphs, ['第一段', '第二段', '第三段']);
});
