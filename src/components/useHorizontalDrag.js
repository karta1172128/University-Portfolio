import { useEffect, useRef, useState } from 'react';
import { createHorizontalGesture } from './horizontalGesture.js';

// Pointer handling shared by the timeline and portfolio; each rail owns its snap geometry.
export function useHorizontalDrag({ travel, maxTravel, resetKey, onRelease, allowLinks = false }) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const latest = useRef(null);
  latest.current = { travel, maxTravel, onRelease, allowLinks, setOffset, setDragging };
  const controller = useRef(null);
  if (!controller.current) controller.current = createHorizontalGesture(() => latest.current);
  const { reset, handlers, isActive } = controller.current;
  useEffect(reset, [resetKey, reset]);
  return { offset, dragging, reset, handlers, isActive };
}
