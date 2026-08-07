import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import { filterValue } from '../lib/safeFilter';

const normalizeAuthResponse = (res) => {
  if (!res || !res.userId) return null;
  return {
    id: res.userId,
    email: res.email || '',
    emailVerified: !!res.emailVerified,
    displayName: res.displayName || 'User',
    avatarUrl: res.avatarUrl || '',
    link: res.link || '',
    signature: res.signature || '',
    role: res.role || 'member',
    roleTag: res.roleTag || 'Member',
    discordId: res.discordId || null,
    permissions: res.permissions || {},
    isMuted: !!res.isMuted,
    muteReason: res.muteReason || null,
    mutedUntil: res.mutedUntil || null,
    ignoredUsers: res.ignoredUsers || []
  };
};

export function AuthPage({ mode = 'login', onBack, onSuccess }) {
  const { checkAuth, setCurrentUser, seedAuthCache } = useAuth();

  const [tab, setTab] = useState(mode === 'register' ? 'register' : 'login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const turnstileRef = useRef(null);
  const turnstileWidgetId = useRef(null);
  const googleBtnRef = useRef(null);

  // Sync if the parent switches the requested mode (e.g. after register)
  useEffect(() => {
    setTab(mode === 'register' ? 'register' : 'login');
  }, [mode]);

  // --- Turnstile (rendered per tab, re-armed on every tab/load) ---
  useEffect(() => {
    let isMounted = true;
    let intervalId = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 100;

    const renderTurnstile = () => {
      if (!isMounted || !window.turnstile || !turnstileRef.current) return false;
      if (turnstileWidgetId.current !== null) {
        try { window.turnstile.remove(turnstileWidgetId.current); } catch (e) {}
        turnstileWidgetId.current = null;
      }
      turnstileRef.current.innerHTML = '';
      try {
        turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
          sitekey: '0x4AAAAAADWtJVafyNps0ZGt',
          theme: 'dark',
          callback: (token) => { if (isMounted) setTurnstileToken(token); },
          'expired-callback': () => { if (isMounted) setTurnstileToken(''); },
          'error-callback': () => { if (isMounted) setTurnstileToken(''); }
        });
        return true;
      } catch (err) {
        console.error('Turnstile render error:', err);
        return false;
      }
    };

    intervalId = setInterval(() => {
      attempts += 1;
      if (renderTurnstile() || attempts >= MAX_ATTEMPTS) {
        clearInterval(intervalId);
      }
    }, 100);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
      if (window.turnstile && turnstileWidgetId.current !== null) {
        try { window.turnstile.remove(turnstileWidgetId.current); } catch (e) {}
        turnstileWidgetId.current = null;
      }
    };
  }, [tab]);

  // --- Google Sign-In ---
  useEffect(() => {
    let intervalId = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 100;

    const initGoogle = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return false;
      try {
        window.google.accounts.id.initialize({
          client_id: '728778108784-c0t5fjar4nhm33dk8oq5bakp1uo5lbe0.apps.googleusercontent.com',
          callback: handleGoogleCallback,
        });
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black',
          size: 'large',
        });
        return true;
      } catch (e) {
        console.error('Google Auth Init Error:', e);
        return false;
      }
    };

    intervalId = setInterval(() => {
      attempts += 1;
      if (initGoogle() || attempts >= MAX_ATTEMPTS) {
        clearInterval(intervalId);
      }
    }, 100);

    return () => { if (intervalId) clearInterval(intervalId); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleGoogleCallback = async (response) => {
    try {
      const res = await apiFetch('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken: response.credential })
      });
      const normalizedUser = normalizeAuthResponse(res);
      if (normalizedUser && setCurrentUser) {
        setCurrentUser(normalizedUser);
        seedAuthCache?.({ authenticated: true, user: normalizedUser });
      } else if (checkAuth) {
        await checkAuth({ force: true });
      }
      onSuccess?.();
    } catch (err) {
      alert('Google auth failed: ' + err.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!turnstileToken) {
      alert('Please complete the Turnstile verification check.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword, turnstileToken })
      });
      const normalizedUser = normalizeAuthResponse(res);
      if (normalizedUser && setCurrentUser) {
        setCurrentUser(normalizedUser);
        seedAuthCache?.({ authenticated: true, user: normalizedUser });
      } else if (checkAuth) {
        await checkAuth({ force: true });
      }
      onSuccess?.();
    } catch (err) {
      alert(err.message);
      if (window.turnstile && turnstileWidgetId.current !== null) {
        window.turnstile.reset(turnstileWidgetId.current);
        setTurnstileToken('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!turnstileToken) {
      alert('Please complete the Turnstile verification check.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: filterValue(regUsername),
          email: regEmail,
          password: regPassword,
          turnstileToken
        })
      });
      alert(res.message || 'Registration successful! A verification link has been sent to your email.');
      setTab('login');
      setLoginEmail(regEmail);
      setLoginPassword(regPassword);
    } catch (err) {
      alert(err.message);
      if (window.turnstile && turnstileWidgetId.current !== null) {
        window.turnstile.reset(turnstileWidgetId.current);
        setTurnstileToken('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button className="auth-back" onClick={onBack} type="button" aria-label="Back to forums">
          <i className="fa-solid fa-arrow-left"></i> Back to Forums
        </button>

        <div className="auth-tabs">
          <button
            type="button"
            className={`tab-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => setTab('login')}
          >
            <i className="fa-solid fa-key"></i> Log In
          </button>
          <button
            type="button"
            className={`tab-btn ${tab === 'register' ? 'active' : ''}`}
            onClick={() => setTab('register')}
          >
            <i className="fa-solid fa-id-card"></i> Register
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required autoComplete="current-password" />
            </div>

            <div ref={turnstileRef} style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0', minHeight: '65px' }}></div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? <><i className="fa-solid fa-spinner fa-spin"></i> Logging in...</> : <><i className="fa-solid fa-right-to-bracket"></i> Log In</>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Username</label>
              <input type="text" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} required autoComplete="username" />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required autoComplete="new-password" />
            </div>

            <div ref={turnstileRef} style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0', minHeight: '65px' }}></div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? <><i className="fa-solid fa-spinner fa-spin"></i> Creating...</> : <><i className="fa-solid fa-user-check"></i> Create Account</>}
            </button>
          </form>
        )}

        <div className="divider"></div>

        <div className="google-btn-wrapper" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div ref={googleBtnRef}></div>
        </div>

        <p className="auth-hint">
          {tab === 'login' ? (
            <>New here? <button type="button" className="link-btn" onClick={() => setTab('register')}>Create an account</button></>
          ) : (
            <>Already have an account? <button type="button" className="link-btn" onClick={() => setTab('login')}>Log in</button></>
          )}
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
