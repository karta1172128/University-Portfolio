// DOM-event controller shared by both rails. Kept separate so touch event order
// (including implicit capture on a child link/image) can be regression tested.
export function createHorizontalGesture(options) {
  let gesture = null;
  let suppressClick = false;
  function reset() {
    const previous = gesture;
    gesture = null;
    if (previous?.element.hasPointerCapture(previous.id)) previous.element.releasePointerCapture(previous.id);
    options().setOffset(0);
    options().setDragging(false);
  }
  function finish(event, cancelled = false) {
    const drag = gesture;
    if (!drag || drag.id !== event.pointerId) return;
    const velocity = event.timeStamp - drag.time > 100 ? 0 : drag.velocity;
    const moved = drag.axis === 'horizontal';
    reset();
    options().onRelease({ offset: drag.offset, velocity, cancelled, moved });
  }
  return { reset, isActive: () => gesture !== null, handlers: {
    onPointerDown(event) {
      if (gesture || event.isPrimary === false) return;
      suppressClick = false;
      const { maxTravel, allowLinks } = options();
      if (!maxTravel || event.button !== 0 || event.target.closest(`[contenteditable],button,input,textarea,select${allowLinks ? '' : ',a'}`)) return;
      if (event.pointerType === 'mouse') event.preventDefault();
      gesture = { element: event.currentTarget, id: event.pointerId, startX: event.clientX, startY: event.clientY, last: event.clientX, time: event.timeStamp, velocity: 0, offset: 0, axis: null };
    },
    onPointerMove(event) {
      const drag = gesture;
      if (!drag || drag.id !== event.pointerId || drag.axis === 'vertical') return;
      const delta = event.clientX - drag.startX;
      const vertical = event.clientY - drag.startY;
      if (!drag.axis) {
        if (Math.max(Math.abs(delta), Math.abs(vertical)) <= 8) return;
        if (Math.abs(vertical) > Math.abs(delta)) {
          drag.axis = 'vertical';
          return; // touch-action: pan-y leaves page scrolling to the browser.
        }
        drag.axis = 'horizontal';
        suppressClick = true;
        drag.element.setPointerCapture(drag.id);
        options().setDragging(true);
      }
      const { travel, maxTravel, setOffset } = options();
      drag.offset = delta > travel ? travel + (delta - travel) * .24 : delta < travel - maxTravel ? travel - maxTravel + (delta - travel + maxTravel) * .24 : delta;
      drag.velocity = (event.clientX - drag.last) / Math.max(1, event.timeStamp - drag.time);
      drag.last = event.clientX;
      drag.time = event.timeStamp;
      setOffset(drag.offset);
    },
    onPointerUp: finish,
    onPointerCancel: event => finish(event, true),
    onLostPointerCapture(event) {
      // Touch starts with implicit capture on a descendant. Its bubbled loss
      // when capture moves to this rail must not cancel the rail's own gesture.
      if (event.target === event.currentTarget) finish(event, true);
    },
    onPointerLeave(event) {
      if (event.pointerType === 'mouse' && !event.currentTarget.hasPointerCapture(event.pointerId)) reset();
    },
    onDragStart: event => event.preventDefault(),
    onClickCapture(event) {
      if (suppressClick && event.detail !== 0) {
        event.preventDefault();
        event.stopPropagation();
        // Keep suppression until the next pointerdown, including delayed taps
        // synthesized by mobile browsers. Keyboard activation still works.
      }
    },
  } };
}
