import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api';

export const AuthModal = ({ isOpen, initialTab = 'login', onClose }) => {
  const { checkAuth } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const googleBtnRef = useRef(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Handle Google SDK Initialization inside React Modal
  useEffect(() => {
    if (!isOpen) return;

    const handleGoogleResponse = async (response) => {
      try {
        setLoading(true);
        await apiFetch('/api/auth/google', {
          method: 'POST',
          body: JSON.stringify({ idToken: response.credential })
        });
        await checkAuth();
        onClose();
      } catch (err) {
        alert('Google authentication failed: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    const setupGoogleSignIn = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: '728778108784-c0t5fjar4nhm33dk8oq5bakp1uo5lbe0.apps.googleusercontent.com',
          callback: handleGoogleResponse
        });

        // Programmatically render Google Button into modal container
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black',
          size: 'large',
          width: '350',
          shape: 'rectangular',
          text: 'continue_with'
        });
      }
    };

    // Load Google GSI Script if not already present
    if (window.google?.accounts?.id) {
      // Small timeout to allow DOM node ref to attach
      setTimeout(setupGoogleSignIn, 100);
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setTimeout(setupGoogleSignIn, 100);
      document.head.appendChild(script);
    }
  }, [isOpen, checkAuth, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === 'login') {
        await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
      } else {
        await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ username, email, password })
        });
      }
      await checkAuth();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', width: '100%' }}>
        {/* TABS */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <button
            className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
            style={{ flex: 1, padding: '0.8rem', background: 'none', border: 'none', color: activeTab === 'login' ? 'var(--accent-red)' : 'var(--text-muted)', borderBottom: activeTab === 'login' ? '2px solid var(--accent-red)' : 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            <i className="fa-solid fa-key"></i> Log In
          </button>
          <button
            className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
            style={{ flex: 1, padding: '0.8rem', background: 'none', border: 'none', color: activeTab === 'register' ? 'var(--accent-red)' : 'var(--text-muted)', borderBottom: activeTab === 'register' ? '2px solid var(--accent-red)' : 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            <i className="fa-solid fa-id-card"></i> Register
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          {activeTab === 'register' && (
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Username</label>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }} disabled={loading}>
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : activeTab === 'login' ? <><i className="fa-solid fa-right-to-bracket"></i> Log In</> : <><i className="fa-solid fa-user-plus"></i> Create Account</>}
          </button>
        </form>

        <div className="divider" style={{ margin: '1.5rem 0', borderTop: '1px solid var(--border-color)' }}></div>

        {/* GOOGLE SIGN IN BUTTON CONTAINER */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', minHeight: '44px' }}>
          <div ref={googleBtnRef}></div>
        </div>

        <button className="btn" onClick={onClose} style={{ width: '100%', marginTop: '1rem' }}>
          Close
        </button>
      </div>
    </div>
  );
};
