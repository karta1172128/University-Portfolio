import { useEffect, useRef, useState } from 'react';
import { useHorizontalDrag } from './useHorizontalDrag.js';
import { ProjectCard } from './ProjectCard.jsx';
import { projectCardPresence, projectRailOffset, snapProjectIndex } from './carousel.js';

export function ProjectCarousel({ projects }) {
  const viewport = useRef(null);
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState(0);
  const visibleCount = width >= 960 ? 3 : width >= 620 ? 2 : 1;
  const step = width / (visibleCount + .4);
  const maxTravel = Math.max(0, projects.length * step - width);
  const maxIndex = Math.max(0, projects.length - visibleCount);
  const index = Math.min(selected, maxIndex);
  const travel = projectRailOffset(index, step, width, projects.length);
  const select = next => { setSelected(Math.max(0, Math.min(maxIndex, next))); drag.reset(); };
  useEffect(() => {
    const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  const drag = useHorizontalDrag({ travel, maxTravel, allowLinks: true, resetKey: `${width}:${index}:${projects.length}`, onRelease: ({ offset, velocity, cancelled, moved }) => select(cancelled || !moved ? index : snapProjectIndex(index, offset, velocity, step, width, projects.length)) });
  const { offset, dragging } = drag;
  useEffect(() => { viewport.current.scrollLeft = 0; }, [width, index]);
  return <div className="project-carousel">
    <div ref={viewport} {...drag.handlers} className={`horizontal-rail project-carousel-viewport${travel > 0 ? ' has-before' : ''}${travel < maxTravel ? ' has-after' : ''}${dragging ? ' is-dragging' : ''}`} tabIndex={0} role="region" aria-label="作品卡片，可左右拖曳或使用方向鍵"
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
          event.preventDefault();
          select(event.key === 'Home' ? 0 : event.key === 'End' ? maxIndex : index + (event.key === 'ArrowLeft' ? -1 : 1));
        }
      }} onFocusCapture={event => {
        const card = event.target.closest('[data-project-index]');
        if (!card) return;
        const bounds = viewport.current.getBoundingClientRect();
        const rect = card.getBoundingClientRect();
        if (rect.left < bounds.left || rect.right > bounds.right) select(Number(card.dataset.projectIndex));
      }}>
      <div className="horizontal-rail-track project-carousel-track" style={{ '--project-step': `${step || 320}px`, transform: `translateX(${-travel + offset}px)`, transition: dragging || !width ? 'none' : undefined }}>
        {projects.map((project, i) => <div key={project.id} data-project-index={i} className="project-carousel-item" style={{ '--card-presence': projectCardPresence(i, step, width, travel - offset) }}><ProjectCard project={project} /></div>)}
      </div>
    </div>
  </div>;
}
