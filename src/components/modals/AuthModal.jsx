import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';

export function AuthModal({ initialTab = 'login', isOpen = true, onClose, activeTab, setActiveTab }) {
  const currentTab = activeTab || initialTab;
  const [tab, setTab] = useState(currentTab);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const { checkAuth } = useAuth();
  
  // Dedicated Turnstile containers for each form tab
  const loginTurnstileRef = useRef(null);
  const registerTurnstileRef = useRef(null);
  const turnstileWidgetId = useRef(null);
  const [turnstileToken, setTurnstileToken] = useState('');

  const googleBtnRef = useRef(null);

  // Sync external tab changes if controlled by parent
  useEffect(() => {
    if (activeTab) setTab(activeTab);
  }, [activeTab]);

  const handleTabSwitch = (newTab) => {
    setTab(newTab);
    if (setActiveTab) setActiveTab(newTab);
    setTurnstileToken(''); // Clear token when switching tabs
  };

  // --- Cloudflare Turnstile Integration (Handles Login & Register) ---
  useEffect(() => {
    let isMounted = true;
    let intervalId = null;

    const renderTurnstile = () => {
      if (!isMounted || !window.turnstile) return;

      // Select target container based on current active tab
      const targetContainer = tab === 'login' ? loginTurnstileRef.current : registerTurnstileRef.current;
      if (!targetContainer) return;

      // Cleanup existing widget instance if switching tabs
      if (turnstileWidgetId.current !== null) {
        try {
          window.turnstile.remove(turnstileWidgetId.current);
          turnstileWidgetId.current = null;
        } catch (e) {
          // Ignore cleanup error
        }
      }

      targetContainer.innerHTML = '';

      try {
        turnstileWidgetId.current = window.turnstile.render(targetContainer, {
          sitekey: '0x4AAAAAADWtJVafyNps0ZGt',
          theme: 'dark',
          callback: (token) => {
            if (isMounted) setTurnstileToken(token);
          },
          'expired-callback': () => {
            if (isMounted) setTurnstileToken('');
          },
          'error-callback': () => {
            if (isMounted) setTurnstileToken('');
          }
        });
      } catch (err) {
        console.error('Turnstile render error:', err);
      }
    };

    if (window.turnstile) {
      renderTurnstile();
    } else {
      intervalId = setInterval(() => {
        if (window.turnstile) {
          clearInterval(intervalId);
          renderTurnstile();
        }
      }, 100);
    }

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
      if (window.turnstile && turnstileWidgetId.current !== null) {
        try {
          window.turnstile.remove(turnstileWidgetId.current);
          turnstileWidgetId.current = null;
        } catch (e) {
          // Ignore cleanup error
        }
      }
    };
  }, [tab]);

  // --- Google Sign-In Integration ---
  useEffect(() => {
    let intervalId = null;

    const initGoogle = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
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
        } catch (e) {
          console.error('Google Auth Init Error:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      intervalId = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(intervalId);
          initGoogle();
        }
      }, 100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [tab]);

  const handleGoogleCallback = async (response) => {
    try {
      await apiFetch('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken: response.credential })
      });
      if (checkAuth) await checkAuth({ force: true });
      if (onClose) onClose();
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

    try {
      await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          turnstileToken
        })
      });
      if (checkAuth) await checkAuth({ force: true });
      if (onClose) onClose();
    } catch (err) {
      alert(err.message);
      if (window.turnstile && turnstileWidgetId.current !== null) {
        window.turnstile.reset(turnstileWidgetId.current);
        setTurnstileToken('');
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!turnstileToken) {
      alert('Please complete the Turnstile verification check.');
      return;
    }

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
      handleTabSwitch('login');
      setLoginEmail(regEmail);
      setLoginPassword(regPassword);
    } catch (err) {
      alert(err.message);
      if (window.turnstile && turnstileWidgetId.current !== null) {
        window.turnstile.reset(turnstileWidgetId.current);
        setTurnstileToken('');
      }
    }
  };

  if (isOpen === false) return null;

  return (
    <div className="modal-overlay active">
      <div className="modal">
        <div className="modal-tabs">
          <button 
            type="button" 
            className={`tab-btn ${tab === 'login' ? 'active' : ''}`} 
            onClick={() => handleTabSwitch('login')}
          >
            <i className="fa-solid fa-key"></i> Log In
          </button>
          <button 
            type="button" 
            className={`tab-btn ${tab === 'register' ? 'active' : ''}`} 
            onClick={() => handleTabSwitch('register')}
          >
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

            {/* Dedicated Turnstile Container for Login */}
            <div ref={loginTurnstileRef} style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0', minHeight: '65px' }}></div>

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

            {/* Dedicated Turnstile Container for Register */}
            <div ref={registerTurnstileRef} style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0', minHeight: '65px' }}></div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <i className="fa-solid fa-user-check"></i> Create Account
            </button>
          </form>
        )}

        <div className="divider"></div>

        {/* Google Button Wrapper */}
        <div className="google-btn-wrapper" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div ref={googleBtnRef}></div>
        </div>

        <button type="button" className="btn btn-sm" style={{ width: '100%', marginTop: '0.5rem' }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default AuthModal;
