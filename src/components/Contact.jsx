import { useState } from 'react';
import { Text, useContent } from '../content/Content.jsx';

export function Contact() {
  const { site: { email } } = useContent();
  const [status, setStatus] = useState('');
  async function copy() {
    try { await navigator.clipboard.writeText(email); setStatus('已複製電子信箱。'); }
    catch { setStatus(`請選取信箱文字複製：${email}`); }
  }
  return <section id="Connection" className="section contact-section" aria-labelledby="contact-title"><div className="shell contact-inner">
    <div><Text as="h2" id="contact-title" field="site.contact.title" /><Text as="p" field="site.contact.description" multiline /></div>
    <div className="contact-actions"><p className="contact-label">電子郵件</p><p className="contact-email"><svg className="contact-email-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg><Text field="site.email" /></p><div className="actions"><a className="button button-primary" href={`mailto:${email}`}>寄送電子郵件</a><button className="button button-quiet" type="button" onClick={copy}>複製信箱</button></div><p className="copy-status" role="status" aria-live="polite">{status}</p></div>
  </div></section>;
}
