export function workPeriod(row) {
  return `${row.start.replace('-', '/')} — ${row.current ? '至今' : row.end.replace('-', '/')}`;
}

export function orderedWorkEntries(rows) {
  return rows.map((row, sourceIndex) => ({ row, sourceIndex })).sort((a, b) => a.row.start.localeCompare(b.row.start));
}

export function workPreview(paragraphs) {
  const text = paragraphs.join('\n\n');
  const lines = text.split('\n');
  if (text.length <= 260 && lines.length <= 5) return { text, truncated: false };
  const excerpt = lines.slice(0, 3).join('\n').slice(0, 220).trimEnd();
  return { text: `${excerpt}…`, truncated: true };
}

export function validateWorkExperiences(rows, projects = null) {
  if (!Array.isArray(rows) || rows.length > 50) return ['工作經歷需為清單，最多 50 項。'];
  const errors = [];
  const ids = new Set();
  const text = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 10000;
  const month = value => typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
  for (const row of rows) {
    if (!row || typeof row !== 'object' || Object.keys(row).sort().join('|') !== 'company|current|end|id|links|paragraphs|start|title|tools') { errors.push('工作經歷欄位不完整。'); continue; }
    if (typeof row.id !== 'string' || !/^[\w-]{1,80}$/.test(row.id) || ids.has(row.id)) errors.push('工作經歷識別碼無效或重複。');
    ids.add(row.id);
    if (!text(row.company)) errors.push('請填寫經歷標題或公司／單位。');
    if (typeof row.title !== 'string' || row.title.length > 10000) errors.push('職稱需為文字，可留空。');
    if (!month(row.start) || typeof row.current !== 'boolean' || (row.current ? row.end !== '' : !month(row.end) || row.end < row.start)) errors.push('請填寫正確的任職年月，結束時間不可早於開始時間。');
    if (typeof row.tools !== 'string' || row.tools.length > 10000) errors.push('使用工具需為文字，可留空。');
    if (!Array.isArray(row.paragraphs) || row.paragraphs.length > 30 || !row.paragraphs.every(text) || row.paragraphs.join('\n\n').length > 10000) errors.push('工作內容最多 30 段、合計 10000 字，可留空。');
    if (!Array.isArray(row.links) || row.links.length > 10 || row.links.some(link => {
      if (!link || Object.keys(link).sort().join('|') !== 'href|text' || !text(link.text) || typeof link.href !== 'string') return true;
      try { const url = new URL(link.href); return url.protocol !== 'https:' || Boolean(url.username || url.password); }
      catch {
        const match = /^projects\/([A-Za-z][\w-]*)\/index\.html$/.exec(link.href);
        return !match || Boolean(projects && !Object.hasOwn(projects, match[1]));
      }
    })) errors.push('作品連結需使用 HTTPS 網址或本機作品路徑，最多 10 個。');
  }
  return errors;
}
