import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';

export const VerifyEmailPage = () => {
  const { currentUser, checkAuth, logout } = useAuth();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    try {
      const res = await apiFetch('/api/auth/resend-verification', { method: 'POST' });
      alert(res.message || 'Verification link dispatched! Check your inbox and SPAM folder.');
      setCooldown(60);
    } catch (err) {
      alert(err.message);
      if (err.message.includes('second(s)')) {
        const match = err.message.match(/(\d+)\s*second/);
        if (match && match[1]) setCooldown(parseInt(match[1]));
      }
    }
  };

  return (
    <div className="verify-card">
      <i className="fa-solid fa-envelope-circle-check verify-icon"></i>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.75rem',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '0.75rem',
          color: 'var(--text-main)'
        }}
      >
        Verify Your Email Address
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.25rem', lineHeight: '1.6' }}>
        We have sent a verification link to <strong style={{ color: 'var(--accent-gold)' }}>{currentUser?.email}</strong>.
        Please verify your email address to unlock full access to AstralForum.
      </p>

      <div className="spam-notice">
        <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.4rem' }}></i> <strong>Can't find the email?</strong><br />
        Please check your <strong>SPAM</strong> or <strong>Junk</strong> folder! Email providers filter automated verification links.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.75rem' }}>
        <button className="btn btn-primary" onClick={handleResend} disabled={cooldown > 0}>
          {cooldown > 0 ? (
            <><i className="fa-solid fa-clock"></i> Resend in {cooldown}s</>
          ) : (
            <><i className="fa-solid fa-paper-plane"></i> Resend Verification Email</>
          )}
        </button>
        <button className="btn" onClick={checkAuth}>
          <i className="fa-solid fa-arrows-rotate"></i> I've Verified, Refresh Status
        </button>
        <button className="btn btn-danger" onClick={logout}>
          <i className="fa-solid fa-right-from-bracket"></i> Log Out
        </button>
      </div>
    </div>
  );
};