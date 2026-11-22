const text = (label, options = {}) => ({ type: 'text', label, required: true, ...options });
const optional = (label, options = {}) => text(label, { required: false, ...options });
const object = (label, fields) => ({ type: 'object', label, fields });
const list = (label, item, initial, min = 0, max = 30) => ({ type: 'list', label, item, initial, min, max });
const paragraphs = (label, min = 1) => list(label, text('段落', { multiline: true }), '新增段落', min);
const section = object('內容區塊', { title: text('標題'), paragraphs: paragraphs('段落') });
const link = object('連結', { text: text('連結文字'), href: text('網址', { format: 'link' }), afterParagraph: { type: 'number', label: '顯示於第幾段之後（從 1 開始）', optional: true } });

export function editorSchema(base) {
  const projects = Object.fromEntries(Object.entries(base.projects).map(([id, project]) => [id, object(project.title, {
    id: { type: 'fixed', value: id }, title: text('卡片名稱'), fullTitle: optional('作品頁完整標題', { multiline: true }),
    category: text('作品類別'), group: text('列表分組', { options: ['Special', 'Junior', 'Sophomore'] }),
    type: text('作品類型'), team: optional('製作背景／合作方式（人數選填）', { multiline: true }), responsibilities: list('負責內容', text('負責項目', { multiline: true }), '', 0, 20),
    summary: text('作品摘要', { multiline: true }), tags: list('標籤', text('標籤', { max: 100 }), '新標籤', 0, 20),
    award: optional('獎項'), client: optional('委託／計畫單位'), pageTitle: optional('瀏覽器標題'),
    sectionsTitle: optional('作品介紹區標題'), mechanicsTitle: optional('玩法介紹區標題'),
    sections: list('作品介紹區塊', section, { title: '新增區塊', paragraphs: ['新增段落'] }, 1),
    mechanics: { ...list('玩法介紹區塊', section, { title: '新增區塊', paragraphs: ['新增段落'] }), optional: true },
    video: optional('YouTube 影片 ID', { format: 'video' }), download: optional('下載網址', { format: 'https' }), external: optional('作品網站網址', { format: 'https' }), externalLabel: optional('外部連結按鈕文字'),
    cover: text('卡片封面', { options: project.images }),
    images: list('作品圖片（已有素材，可排序或移除）', text('圖片檔名', { options: project.images }), project.images[0], 1, 100),
  })]));
  return object('全站內容', {
    schemaVersion: { type: 'fixed', value: base.schemaVersion },
    site: object('網站與聯絡資料', {
      name: text('頁尾名稱'), email: text('電子郵件', { format: 'email' }), homeTitle: text('首頁瀏覽器標題'), homeDescription: text('首頁搜尋摘要'),
      listTitle: text('作品列表瀏覽器標題'), listDescription: text('作品列表搜尋摘要'), aiStatement: text('作品集聲明', { multiline: true }),
      skillsTitle: text('技能區標題'), portfolioTitle: text('作品集區標題'),
      showreel: object('作品展示影片', { id: text('YouTube 影片 ID', { format: 'video' }), title: text('影片名稱'), heading: text('區塊標題'), description: text('說明', { multiline: true }) }),
      workingNote: object('持續學習', { title: text('標題'), description: text('說明', { multiline: true }) }),
      contact: object('聯絡區', { title: text('標題'), description: text('說明', { multiline: true }) }),
    }),
    profile: object('自我介紹與相關經歷', {
      alias: text('照片下方名稱'), kicker: optional('介紹小標題'), greeting: text('招呼語'), name: text('介紹姓名'), lead: text('自我介紹重點', { multiline: true }),
      facts: list('基本資料', object('資料', { label: text('標籤'), value: text('內容') }), { label: '新資料', value: '請填寫' }, 0, 10),
      paragraphs: paragraphs('自我介紹段落', 0), workExperienceTitle: text('時間軸標題'), workExperiences: { type: 'work', label: '時間軸' }, experienceTitle: text('相關經歷標題'),
      experiences: list('相關經歷', object('經歷', {
        id: { type: 'identity' }, category: optional('類別'), context: optional('補充資訊'), title: text('標題'), paragraphs: paragraphs('說明段落'), links: list('作品連結', link, { text: '查看作品', href: 'https://example.com', afterParagraph: 0 }, 0, 10),
      }), { id: '', category: '', context: '', title: '新增經歷', paragraphs: ['請填寫經歷'], links: [] }, 0, 50),
    }),
    skills: list('個人技能', object('技能', { name: text('技能名稱（如 Unity／C#）'), title: optional('備用小標題'), description: text('說明', { multiline: true }) }), { name: '新技能', title: '', description: '請填寫技能說明' }, 0, 20),
    projects: object('作品卡片與作品頁', projects),
  });
}

export function validateStructure(value, schema, projects, path = '') {
  const errors = [];
  const error = message => errors.push(`${schema.label || path}：${message}`);
  if (value === undefined && (schema.required === false || schema.optional)) return errors;
  if (schema.type === 'fixed') { if (value !== schema.value) error('固定識別資料不能變更。'); }
  else if (schema.type === 'identity') { if (typeof value !== 'string' || !/^[\w-]{1,80}$/.test(value)) error('識別碼無效。'); }
  else if (schema.type === 'work') return errors;
  else if (schema.type === 'text') {
    if (typeof value !== 'string' || value.length > (schema.max || 10000) || (schema.required && !value.trim())) error('請填入適當長度的文字。');
    else if (value.trim()) {
      if (schema.options && !schema.options.includes(value)) error('請選擇現有選項。');
      if (schema.format === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error('信箱格式不正確。');
      if (schema.format === 'video' && !/^[\w-]{11}$/.test(value)) error('需為 11 字元的 YouTube 影片 ID。');
      if (['https', 'link'].includes(schema.format)) {
        let safe = false;
        try { const url = new URL(value); safe = url.protocol === 'https:' && !url.username && !url.password; } catch { /* Check local project below. */ }
        if (!safe && schema.format === 'link') { const match = /^projects\/([A-Za-z][\w-]*)\/index\.html$/.exec(value); safe = Boolean(match && Object.hasOwn(projects, match[1])); }
        if (!safe) error('請使用 HTTPS 網址或現有作品路徑。');
      }
    }
  } else if (schema.type === 'number') {
    if (!Number.isInteger(value) || value < 0 || value > 29) error('請選擇有效段落。');
  } else if (schema.type === 'list') {
    if (!Array.isArray(value) || value.length < schema.min || value.length > schema.max) error(`數量需介於 ${schema.min} 至 ${schema.max} 項。`);
    else {
      value.forEach((item, i) => errors.push(...validateStructure(item, schema.item, projects, `${path}.${i}`)));
      if (schema.item.type === 'text' && value.join('\n\n').length > 10000) error('文字總長度過長。');
      if (schema.item.fields?.id && new Set(value.map(item => item?.id)).size !== value.length) error('識別碼重複。');
    }
  } else if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) error('資料格式錯誤。');
    else {
      if (Object.keys(value).some(key => !Object.hasOwn(schema.fields, key))) error('含未允許的欄位。');
      for (const [key, field] of Object.entries(schema.fields)) errors.push(...validateStructure(value[key], field, projects, path ? `${path}.${key}` : key));
    }
  }
  return errors;
}
