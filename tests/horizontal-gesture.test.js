import test from 'node:test';
import assert from 'node:assert/strict';
import { createHorizontalGesture } from '../src/components/horizontalGesture.js';

function setup(allowLinks = false) {
  let captured = false;
  const releases = [];
  const state = { offset: 0, dragging: false };
  const rail = { hasPointerCapture: () => captured, setPointerCapture: () => { captured = true; }, releasePointerCapture: () => { captured = false; } };
  const child = { closest: () => null };
  const controller = createHorizontalGesture(() => ({
    travel: 300, maxTravel: 900, allowLinks,
    setOffset: value => { state.offset = value; },
    setDragging: value => { state.dragging = value; },
    onRelease: value => releases.push(value),
  }));
  function event(overrides = {}) {
    return { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0,
      clientX: 200, clientY: 200, timeStamp: 0, detail: 1,
      target: child, currentTarget: rail, prevented: false, stopped: false,
      preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; },
      ...overrides };
  }
  return { ...controller, state, releases, rail, child, event };
}

test('touch swipe survives implicit capture transfer from a child and suppresses its following link click', () => {
  const drag = setup(true);
  const link = { closest: selector => selector.endsWith(',a') ? link : null };
  drag.handlers.onPointerDown(drag.event({ target: link }));
  drag.handlers.onPointerMove(drag.event({ clientX: 140, clientY: 203, timeStamp: 30 }));
  drag.handlers.onLostPointerCapture(drag.event({ target: link, timeStamp: 31 }));
  assert.equal(drag.releases.length, 0, 'Bubbled loss on the child must not end the rail swipe');
  drag.handlers.onPointerMove(drag.event({ clientX: 70, clientY: 208, timeStamp: 60 }));
  assert.equal(drag.state.offset, -130);
  drag.handlers.onPointerUp(drag.event({ clientX: 70, timeStamp: 65 }));
  assert.equal(drag.releases.length, 1);
  assert.equal(drag.releases[0].moved, true);
  assert.equal(drag.releases[0].cancelled, false);
  assert.equal(drag.releases[0].offset, -130);
  const click = drag.event({ target: link });
  drag.handlers.onClickCapture(click);
  assert(click.prevented && click.stopped);
  const keyboard = drag.event({ detail: 0 });
  drag.handlers.onClickCapture(keyboard);
  assert.equal(keyboard.prevented, false);
  drag.handlers.onPointerDown(drag.event({ target: link, timeStamp: 100 }));
  drag.handlers.onPointerUp(drag.event({ target: link, timeStamp: 120 }));
  const tap = drag.event({ target: link });
  drag.handlers.onClickCapture(tap);
  assert.equal(tap.prevented, false, 'A separate tap must still open a project');
});

test('vertical scrolling and small finger jitter do not start horizontal dragging', () => {
  const drag = setup();
  drag.handlers.onPointerDown(drag.event());
  const vertical = drag.event({ clientX: 206, clientY: 250, timeStamp: 30 });
  drag.handlers.onPointerMove(vertical);
  drag.handlers.onPointerMove(drag.event({ clientX: 240, clientY: 310, timeStamp: 60 }));
  assert.equal(vertical.prevented, false);
  assert.equal(drag.state.dragging, false);
  assert.equal(drag.state.offset, 0);
  drag.handlers.onPointerCancel(drag.event({ timeStamp: 70 }));
  assert.equal(drag.releases[0].moved, false);
  drag.handlers.onPointerDown(drag.event());
  drag.handlers.onPointerMove(drag.event({ clientX: 204, clientY: 202 }));
  drag.handlers.onPointerUp(drag.event());
  assert.equal(drag.releases[1].moved, false);
});

test('rail capture loss cancels once; a second finger cannot replace an active swipe', () => {
  const drag = setup();
  drag.handlers.onPointerDown(drag.event());
  drag.handlers.onPointerMove(drag.event({ clientX: 250, timeStamp: 30 }));
  drag.handlers.onPointerDown(drag.event({ pointerId: 2, isPrimary: false }));
  drag.handlers.onPointerUp(drag.event({ pointerId: 2 }));
  assert.equal(drag.releases.length, 0);
  drag.handlers.onLostPointerCapture(drag.event({ target: drag.rail, timeStamp: 40 }));
  drag.handlers.onPointerUp(drag.event());
  assert.equal(drag.releases.length, 1);
  assert.equal(drag.releases[0].cancelled, true);
  assert.equal(drag.state.offset, 0);
});

test('mouse dragging still works and editable controls keep their own interaction', () => {
  const drag = setup();
  const control = { closest: () => control };
  drag.handlers.onPointerDown(drag.event({ target: control }));
  assert.equal(drag.isActive(), false);
  drag.handlers.onPointerDown(drag.event({ pointerType: 'mouse' }));
  drag.handlers.onPointerMove(drag.event({ pointerType: 'mouse', clientX: 100, timeStamp: 40 }));
  drag.handlers.onPointerLeave(drag.event({ pointerType: 'mouse' }));
  assert.equal(drag.state.offset, -100);
  drag.handlers.onPointerUp(drag.event({ pointerType: 'mouse', timeStamp: 60 }));
  assert.equal(drag.releases[0].moved, true);
});
