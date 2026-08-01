import React, { useState, useEffect } from 'react';

const SHARE_NETWORKS = [
  { key: 'whatsapp', label: 'WhatsApp', icon: 'fa-brands fa-whatsapp', color: '#25D366' },
  { key: 'telegram', label: 'Telegram', icon: 'fa-brands fa-telegram', color: '#229ED9' },
  { key: 'x', label: 'X / Twitter', icon: 'fa-brands fa-x-twitter', color: '#E7E9EA' },
  { key: 'facebook', label: 'Facebook', icon: 'fa-brands fa-facebook', color: '#1877F2' },
  { key: 'reddit', label: 'Reddit', icon: 'fa-brands fa-reddit', color: '#FF4500' },
  { key: 'email', label: 'Email', icon: 'fa-solid fa-envelope', color: '#EA4335' },
];

const buildShareUrl = (network, title, url) => {
  const enc = encodeURIComponent;
  switch (network) {
    case 'whatsapp': return `https://wa.me/?text=${enc(`${title} ${url}`)}`;
    case 'telegram': return `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`;
    case 'x': return `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`;
    case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`;
    case 'reddit': return `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(title)}`;
    case 'email': return `mailto:?subject=${enc(title)}&body=${enc(url)}`;
    default: return url;
  }
};

export const ShareModal = ({ isOpen, title, url, onClose }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCopied(false);
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      prompt('Copy this link:', url);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal share-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <i className="fa-solid fa-xmark"></i>
        </button>
        <h2><i className="fa-solid fa-share-nodes"></i> Share</h2>
        <p className="share-title" title={title}>{title}</p>
        <div className="share-grid">
          {SHARE_NETWORKS.map((n) => (
            <a
              key={n.key}
              className="share-btn"
              style={{ '--brand': n.color }}
              href={buildShareUrl(n.key, title, url)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className={n.icon}></i>
              <span>{n.label}</span>
            </a>
          ))}
        </div>
        <div className="share-copy">
          <input type="text" readOnly value={url} onFocus={(e) => e.target.select()} />
          <button className={`btn ${copied ? 'btn-success' : 'btn-primary'}`} onClick={handleCopy}>
            <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i> {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  );
};
