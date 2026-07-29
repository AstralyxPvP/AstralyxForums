// src/components/modals/AuthModal.jsx
import React, { useState, useEffect } from 'react';
import Turnstile from '../Turnstile';

export function AuthModal({ isOpen, onClose, activeTab: propActiveTab, setActiveTab, onAuthSuccess }) {
  const [localTab, setLocalTab] = useState('login');
  
  // Guarantee activeTab always has a valid string value
  const activeTab = propActiveTab || localTab || 'login';

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [turnstileToken, setTurnstileToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (propActiveTab) {
      setLocalTab(propActiveTab);
    }
  }, [propActiveTab]);

  if (!isOpen) return null;

  const handleTabSwitch = (tab) => {
    if (setActiveTab) setActiveTab(tab);
    setLocalTab(tab);
    setTurnstileToken('');
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!turnstileToken) {
      alert('Please complete the Turnstile verification check.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (onAuthSuccess) {
        await onAuthSuccess('login', {
          email: loginEmail,
          password: loginPassword,
          turnstileToken
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed');
      setTurnstileToken('');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!turnstileToken) {
      alert('Please complete the Turnstile verification check.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (onAuthSuccess) {
        await onAuthSuccess('register', {
          username: regUsername,
          email: regEmail,
          password: regPassword,
          turnstileToken
        });
      }
      alert('Registration successful! A verification link has been sent to your email.');
      handleTabSwitch('login');
    } catch (err) {
      setError(err.message || 'Registration failed');
      setTurnstileToken('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay active">
      <div className="modal">
        <div className="modal-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('login')}
          >
            <i className="fa-solid fa-key"></i> Log In
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('register')}
          >
            <i className="fa-solid fa-id-card"></i> Register
          </button>
        </div>

        {error && (
          <div style={{ color: 'var(--accent-danger)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {/* Ternary condition guarantees one of the forms is ALWAYS rendered */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <Turnstile
              onVerify={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken('')}
            />

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              <i className="fa-solid fa-right-to-bracket"></i> {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
              />
            </div>

            <Turnstile
              onVerify={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken('')}
            />

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              <i className="fa-solid fa-user-check"></i> {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        )}

        <button
          type="button"
          className="btn btn-sm"
          style={{ width: '100%', marginTop: '1rem' }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default AuthModal;