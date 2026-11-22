import test from 'node:test';
import assert from 'node:assert/strict';
import { projectCardPresence, projectRailOffset, snapProjectIndex } from '../src/components/carousel.js';

test('middle stops reveal adjacent cards on both sides without adding endpoint gaps', () => {
  for (const visibleCount of [1, 2, 3]) {
    const step = 300, width = (visibleCount + .4) * step, count = 9;
    const travel = projectRailOffset(2, step, width, count);
    assert(Math.abs(travel - 540) < .001);
    assert(projectCardPresence(1, step, width, travel) > 0);
    assert(projectCardPresence(2 + visibleCount, step, width, travel) > 0);
    assert.equal(projectRailOffset(0, step, width, count), 0);
    assert.equal(projectRailOffset(count - visibleCount, step, width, count), count * step - width);
    assert.equal(snapProjectIndex(2, -300, 0, step, width, count), 3);
  }
});

test('card prominence follows viewport position rather than project identity', () => {
  const step = 337.5, width = 1080;
  assert.deepEqual([0, 1, 2].map(i => projectCardPresence(i, step, width, 0)), [1, 1, 1]);
  assert(projectCardPresence(3, step, width, 0) < 1);
  assert.equal(projectCardPresence(4, step, width, 0), 0);
  assert.equal(projectCardPresence(4, step, width, 3 * step), 1);
  assert.equal(projectCardPresence(0, step, width, 3 * step), 0);
  assert(projectCardPresence(0, step, width, step / 2) > 0);
  assert(projectCardPresence(0, step, width, step / 2) < 1);
});
