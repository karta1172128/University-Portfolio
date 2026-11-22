import { useEffect, useRef, useState } from 'react';

// Pointer handling shared by the timeline and portfolio; each rail owns its snap geometry.
export function useHorizontalDrag({ travel, maxTravel, resetKey, onRelease, allowLinks = false }) {
  const gesture = useRef(null);
  const suppressClick = useRef(false);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  function reset() {
    const drag = gesture.current;
    gesture.current = null;
    if (drag?.element.hasPointerCapture(drag.id)) drag.element.releasePointerCapture(drag.id);
    setOffset(0);
    setDragging(false);
  }
  useEffect(reset, [resetKey]);
  function finish(event, cancelled = false) {
    const drag = gesture.current;
    if (!drag || drag.id !== event.pointerId) return;
    const velocity = event.timeStamp - drag.time > 100 ? 0 : drag.velocity;
    reset();
    onRelease({ offset: drag.offset, velocity, cancelled, moved: suppressClick.current });
  }
  return { offset, dragging, reset, handlers: {
    onPointerDown(event) {
      suppressClick.current = false;
      if (!maxTravel || event.button !== 0 || event.target.closest(`[contenteditable],button,input,textarea,select${allowLinks ? '' : ',a'}`)) return;
      if (event.pointerType === 'mouse') event.preventDefault();
      gesture.current = { element: event.currentTarget, id: event.pointerId, start: event.clientX, last: event.clientX, time: event.timeStamp, velocity: 0, offset: 0 };
    },
    onPointerMove(event) {
      const drag = gesture.current;
      if (!drag || drag.id !== event.pointerId) return;
      const delta = event.clientX - drag.start;
      if (Math.abs(delta) <= 5 && !suppressClick.current) return;
      suppressClick.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
      drag.offset = delta > travel ? travel + (delta - travel) * .24 : delta < travel - maxTravel ? travel - maxTravel + (delta - travel + maxTravel) * .24 : delta;
      drag.velocity = (event.clientX - drag.last) / Math.max(1, event.timeStamp - drag.time);
      drag.last = event.clientX; drag.time = event.timeStamp;
      setOffset(drag.offset);
    },
    onPointerUp: finish,
    onPointerCancel: event => finish(event, true),
    onLostPointerCapture: event => finish(event, true),
    onPointerLeave(event) { if (!event.currentTarget.hasPointerCapture(event.pointerId)) gesture.current = null; },
    onDragStart: event => event.preventDefault(),
    onClickCapture(event) {
      if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; }
    },
  } };
}
