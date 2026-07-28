import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal({ initialTab = 'login', onClose }) {
  const [tab, setTab] = useState(initialTab);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const { checkAuth } = useAuth();
  
  const turnstileRef = useRef(null);
  const turnstileWidgetId = useRef(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const googleBtnRef = useRef(null);

  // --- Cloudflare Turnstile Integration ---
  useEffect(() => {
    if (window.turnstile && turnstileRef.current) {
      // Clear previous widget if tab switches
      if (turnstileWidgetId.current !== null) {
        window.turnstile.remove(turnstileWidgetId.current);
      }

      turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: '0x4AAAAAADWtJVafyNps0ZGt',
        callback: (token) => setTurnstileToken(token),
      });
    }

    return () => {
      if (window.turnstile && turnstileWidgetId.current !== null) {
        window.turnstile.remove(turnstileWidgetId.current);
      }
    };
  }, [tab]);

  // --- Google Sign-In Integration ---
  useEffect(() => {
    if (window.google?.accounts?.id && googleBtnRef.current) {
      window.google.accounts.id.initialize({
        client_id: '728778108784-c0t5fjar4nhm33dk8oq5bakp1uo5lbe0.apps.googleusercontent.com',
        callback: handleGoogleCallback,
      });

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'filled_black',
        size: 'large',
      });
    }
  }, []);

  const handleGoogleCallback = async (response) => {
    try {
      await apiFetch('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken: response.credential })
      });
      await checkAuth();
      onClose();
    } catch (err) {
      alert('Google auth failed: ' + err.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          turnstileToken
        })
      });
      await checkAuth();
      onClose();
    } catch (err) {
      alert(err.message);
      if (window.turnstile && turnstileWidgetId.current !== null) {
        window.turnstile.reset(turnstileWidgetId.current);
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: regUsername,
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
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-tabs">
          <button className={`tab-btn ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>
            <i className="fa-solid fa-key"></i> Log In
          </button>
          <button className={`tab-btn ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>
            <i className="fa-solid fa-id-card"></i> Register
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
            </div>

            {/* Turnstile Container */}
            <div ref={turnstileRef} style={{ marginBottom: '1rem' }}></div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <i className="fa-solid fa-right-to-bracket"></i> Log In
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Username</label>
              <input type="text" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
            </div>

            {/* Turnstile Container */}
            <div ref={turnstileRef} style={{ marginBottom: '1rem' }}></div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <i className="fa-solid fa-user-check"></i> Create Account
            </button>
          </form>
        )}

        <div className="divider"></div>

        {/* Google Button Wrapper */}
        <div className="google-btn-wrapper">
          <div ref={googleBtnRef}></div>
        </div>

        <button type="button" className="btn btn-sm" style={{ width: '100%', marginTop: '1rem' }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
