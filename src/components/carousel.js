export function workTrackOffset(index, step, width, count) {
  return Math.max(0, Math.min(Math.max(0, count * step - width), index * step - (width - step) / 2));
}

export function snapWorkIndex(index, offset, velocity, step, count, width = step) {
  if (step <= 0 || count < 1) return 0;
  const projected = workTrackOffset(index, step, width, count) - offset - Math.max(-2, Math.min(2, velocity)) * 140;
  let best = index;
  for (let i = 0; i < count; i++) {
    if (Math.abs(workTrackOffset(i, step, width, count) - projected) < Math.abs(workTrackOffset(best, step, width, count) - projected)) best = i;
  }
  return best;
}

export function projectRailOffset(index, step, width, count) {
  if (step <= 0) return 0;
  const visibleCount = Math.max(1, Math.floor(width / step));
  const peek = Math.max(0, (width - visibleCount * step) / 2);
  return Math.max(0, Math.min(count * step - width, index * step - peek));
}

export function snapProjectIndex(index, offset, velocity, step, width, count) {
  if (step <= 0) return 0;
  const maxIndex = Math.max(0, count - Math.max(1, Math.floor(width / step)));
  const projected = projectRailOffset(index, step, width, count) - offset - Math.max(-2, Math.min(2, velocity)) * 140;
  let best = Math.min(index, maxIndex);
  for (let i = 0; i <= maxIndex; i++) {
    if (Math.abs(projectRailOffset(i, step, width, count) - projected) < Math.abs(projectRailOffset(best, step, width, count) - projected)) best = i;
  }
  return best;
}

export function projectCardPresence(index, step, width, travel) {
  if (step <= 0 || width <= 0) return 1;
  const left = index * step - travel;
  const visible = Math.max(0, Math.min(width, left + step) - Math.max(0, left));
  return Math.min(1, visible / step / .85);
}
