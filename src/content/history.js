export function documentHistory(state, action) {
  if (action.type === 'undo' && state.past.length) return { past: state.past.slice(0, -1), present: state.past.at(-1), future: [state.present, ...state.future].slice(0, 50) };
  if (action.type === 'redo' && state.future.length) return { past: [...state.past, state.present].slice(-50), present: state.future[0], future: state.future.slice(1) };
  if (action.type === 'replace') {
    const next = typeof action.value === 'function' ? action.value(state.present) : action.value;
    if (JSON.stringify(next) === JSON.stringify(state.present)) return state;
    return { past: [...state.past, state.present].slice(-50), present: next, future: [] };
  }
  if (action.type === 'reset') return { past: [], present: action.value, future: [] };
  return state;
}
