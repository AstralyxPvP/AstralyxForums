import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';

export const AuthModal = ({ isOpen, initialTab = 'login', onClose }) => {
  const { checkAuth } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  // Expose Google Callback Globally for GSI
  useEffect(() => {
    window.handleGoogleCallback = async (response) => {
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
  }, [checkAuth, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const turnstileInput = e.target.querySelector('[name="cf-turnstile-response"]');
    const turnstileToken = turnstileInput ? turnstileInput.value : '';

    const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = tab === 'login'
      ? { email, password, turnstileToken }
      : { username, email, password, turnstileToken };

    try {
      const res = await apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) });

      if (tab === 'register') {
        alert(res.message || 'Registration successful! Verification email sent.');
        setTab('login');
        return;
      }

      await checkAuth();
      onClose();
    } catch (err) {
      alert(err.message);
      if (window.turnstile) window.turnstile.reset();
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
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="cf-turnstile" data-sitekey="0x4AAAAAADWtJVafyNps0ZGt" style={{ marginBottom: '1rem' }}></div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <i className="fa-solid fa-right-to-bracket"></i> Log In
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="cf-turnstile" data-sitekey="0x4AAAAAADWtJVafyNps0ZGt" style={{ marginBottom: '1rem' }}></div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <i className="fa-solid fa-user-check"></i> Create Account
            </button>
          </form>
        )}

        <div className="divider"></div>

        <div className="google-btn-wrapper">
          <div
            id="g_id_onload"
            data-client_id="728778108784-c0t5fjar4nhm33dk8oq5bakp1uo5lbe0.apps.googleusercontent.com"
            data-callback="handleGoogleCallback"
            data-auto_prompt="false"
          ></div>
          <div className="g_id_signin" data-type="standard" data-theme="filled_black" data-size="large"></div>
        </div>

        <button type="button" className="btn btn-sm" style={{ width: '100%', marginTop: '1rem' }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};
