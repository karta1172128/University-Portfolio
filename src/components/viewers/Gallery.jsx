import { useEffect, useRef, useState } from 'react';
import { projectImage } from '../../paths.js';

export function Gallery({ project }) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const dialog = useRef(null);
  const mainButton = useRef(null);
  const count = project.images.length;
  const src = projectImage(project, project.images[index]);
  const alt = `${project.title}作品畫面 ${index + 1}`;
  const change = step => setIndex(value => (value + step + count) % count);

  useEffect(() => {
    if (expanded) dialog.current?.showModal();
    else if (dialog.current?.open) dialog.current.close();
  }, [expanded]);

  return <section id="gallery" className="section section-rule project-gallery" aria-labelledby="gallery-title">
    <div className="section-heading"><h2 id="gallery-title">作品畫面</h2><span className="gallery-count" role="status" aria-live="polite">{index + 1} / {count} 張</span></div>
    <button className="gallery-main" type="button" ref={mainButton} aria-label="放大目前作品畫面" onClick={() => setExpanded(true)}>
      <img src={src} alt={alt} fetchPriority="high" decoding="async" />
    </button>
    <div className="gallery-controls"><button className="button button-quiet" type="button" onClick={() => change(-1)}>上一張</button><p>選擇縮圖切換，點擊大圖放大。</p><button className="button button-quiet" type="button" onClick={() => change(1)}>下一張</button></div>
    <div className="gallery-thumbnails" aria-label="選擇作品畫面" style={{ '--gallery-columns': Math.min(count, 8), '--gallery-mobile-columns': Math.min(count, 4) }}>
      {project.images.map((file, i) => <button key={file} type="button" aria-label={`顯示作品畫面 ${i + 1}`} aria-pressed={index === i} onClick={() => setIndex(i)}><img src={projectImage(project, file, 320)} loading="lazy" decoding="async" alt="" /><span>{i + 1}</span></button>)}
    </div>
    <dialog ref={dialog} className="image-viewer" aria-label="作品畫面放大檢視" onCancel={() => setExpanded(false)} onClose={() => { setExpanded(false); mainButton.current?.focus(); }} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setExpanded(false);
    }}>
      <button className="viewer-close" type="button" aria-label="關閉大圖" autoFocus onClick={() => setExpanded(false)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
      {expanded && <img src={projectImage(project, project.images[index], 2560)} alt={`${alt}放大檢視`} decoding="async" />}
    </dialog>
  </section>;
}
