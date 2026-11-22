import { useEffect, useRef, useState } from 'react';
import { sitePath } from '../paths.js';
import { useContent } from '../content/Content.jsx';
import { themeSwitcherEnabled } from '../theme.js';
import { ThemeSwitcher } from './ThemeSwitcher.jsx';

export function Header({ page }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  const header = useRef(null);
  const toggle = useRef(null);
  const { profile } = useContent();
  const homeLinks = [['Introduction', '自我介紹'], ...(profile.workExperiences.length ? [['WorkExperience', '工作經歷']] : []), ['Experience', '相關經歷'], ['Ability', '個人技能'], ['Portfolio', '作品集'], ['Connection', '聯絡我']];
  const links = page === 'home'
    ? homeLinks.map(([id, label]) => ({ href: `#${id}`, label, id }))
    : [
      { href: sitePath('index.html'), label: '個人履歷' },
      { href: sitePath('projects.html'), label: '全部作品' },
      ...(page !== 'list' ? [{ href: '#gallery', label: '作品畫面', id: 'gallery' }, { href: '#contribution', label: '作品介紹', id: 'contribution' }] : []),
      { href: sitePath('index.html#Connection'), label: '聯絡我' },
    ];

  useEffect(() => {
    const closeOutside = event => { if (!header.current?.contains(event.target)) setOpen(false); };
    const escape = event => {
      if (event.key === 'Escape') {
        setOpen(false);
        if (open) toggle.current?.focus();
      }
    };
    const media = matchMedia('(max-width: 720px)');
    const resize = () => setOpen(false);
    document.addEventListener('click', closeOutside);
    document.addEventListener('keydown', escape);
    media.addEventListener('change', resize);
    return () => {
      document.removeEventListener('click', closeOutside);
      document.removeEventListener('keydown', escape);
      media.removeEventListener('change', resize);
    };
  }, [open]);

  useEffect(() => {
    const sections = [...document.querySelectorAll('main section[id]')];
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
    }, { rootMargin: '-15% 0px -55% 0px' });
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [page, profile.workExperiences.length]);

  return <>
    <a className="skip-link" href="#main">跳至主要內容</a>
    <header className="site-header" ref={header}>
      <div className="shell nav-wrap">
        <a className="wordmark" href={sitePath('index.html')} aria-label="AYi 個人履歷首頁">AYi<span> / 個人履歷</span></a>
        <button ref={toggle} className="menu-toggle" type="button" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen(value => !value)}>選單 <span aria-hidden="true">☰</span></button>
        <nav id="site-nav" aria-label="主要導覽" className={open ? 'is-open' : ''}>
          {links.map(link => <a key={link.href} href={link.href} className={link.label === '聯絡我' ? 'nav-contact' : undefined} aria-current={active === link.id ? 'location' : undefined} onClick={() => setOpen(false)}>{link.label}</a>)}
        </nav>
        {themeSwitcherEnabled && <ThemeSwitcher />}
      </div>
    </header>
  </>;
}

export function Footer() {
  const { site } = useContent();
  return <footer className="site-footer"><div className="shell">
    <p className="footer-copyright">© {new Date().getFullYear()} {site.name} Portfolio</p>
  </div></footer>;
}
