import { useEffect, useRef, useState } from 'react';

export function Video({ id, title }) {
  const [loaded, setLoaded] = useState(false);
  const frame = useRef(null);
  useEffect(() => { if (loaded) frame.current?.focus(); }, [loaded]);
  return <div className="video-shell">
    {loaded
      ? <iframe ref={frame} title={title} src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen tabIndex={0} />
      : <button className="video-load" type="button" onClick={() => setLoaded(true)} aria-label={`載入並觀看${title}`}><span className="play-symbol" aria-hidden="true">▶</span><span><strong>{title}</strong><small>點擊載入 YouTube 影片</small></span></button>}
  </div>;
}

