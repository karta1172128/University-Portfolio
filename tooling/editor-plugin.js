import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateEditorDocument } from '../src/content/model.js';

export const editorEndpoint = '/__portfolio_editor/content';
export const contentRevision = text => createHash('sha256').update(text).digest('hex');

export function createEditorMiddleware(filePath) {
  const token = randomUUID();
  return async (request, response, next) => {
    if (request.url?.split('?')[0] !== editorEndpoint) return next();
    const send = (status, value) => {
      response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      response.end(JSON.stringify(value));
    };
    let origin;
    try { origin = new URL(`http://${request.headers.host}`); }
    catch { return send(403, { error: '僅允許本機編輯。' }); }
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname) || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.socket.remoteAddress)) return send(403, { error: '僅允許本機編輯。' });
    if (request.headers.origin && request.headers.origin !== origin.origin) return send(403, { error: '請從編輯頁面儲存。' });
    if (request.method === 'GET') {
      try {
        const text = readFileSync(filePath, 'utf8');
        return send(200, { document: JSON.parse(text), revision: contentRevision(text), token });
      } catch { return send(500, { error: '無法讀取專案文字資料，請確認檔案格式與權限。' }); }
    }
    if (request.method !== 'POST') return send(405, { error: '不支援的操作。' });
    if (request.headers.origin !== origin.origin || request.headers['x-editor-token'] !== token || !request.headers['content-type']?.startsWith('application/json')) return send(403, { error: '編輯連線已失效，請重新開啟頁面。' });
    let temporary;
    try {
      let body = '';
      for await (const chunk of request) {
        body += chunk;
        if (Buffer.byteLength(body) > 256 * 1024) return send(413, { error: '文字資料過大，尚未儲存。' });
      }
      const payload = JSON.parse(body);
      const previous = readFileSync(filePath, 'utf8');
      if (payload.revision !== contentRevision(previous)) return send(409, { error: '專案資料已被其他視窗或程式修改。請先保留你的文字，再重新載入最新內容；此次沒有覆寫。' });
      const errors = validateEditorDocument(payload.document, JSON.parse(previous));
      if (errors.length) return send(422, { error: errors.slice(0, 5).join('\n') });
      const text = `${JSON.stringify(payload.document, null, 2)}\n`;
      // One fixed JSON file, atomic replacement; clients cannot choose a file to write.
      temporary = `${filePath}.editor-tmp-${randomUUID()}`;
      writeFileSync(temporary, text, { flag: 'wx' });
      renameSync(temporary, filePath);
      temporary = undefined;
      send(200, { revision: contentRevision(text) });
    } catch {
      send(400, { error: '無法儲存，請確認資料格式與專案檔案權限。' });
    } finally {
      if (temporary) { try { unlinkSync(temporary); } catch { /* Preserve the original error. */ } }
    }
  };
}

export function localEditor(root) {
  return {
    name: 'local-portfolio-editor',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(createEditorMiddleware(resolve(root, 'src/data/content.json')));
    },
  };
}
