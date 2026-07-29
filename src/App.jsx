import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { apiFetch, SITE_ORIGIN } from './api';
import { CategoriesPage } from './pages/CategoriesPage';
import { SubcategoryPage } from './pages/SubcategoryPage';
import { ThreadDetailPage } from './pages/ThreadDetailPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { AuthModal } from './components/modals/AuthModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { StaffModal } from './components/modals/StaffModal';

export default function App() {
  const { currentUser, isStaff, logout, checkAuth } = useAuth();
  const [currentView, setCurrentView] = useState('categories');
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);

  useEffect(() => {
    // Handle OAuth Callback & Verification redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'verifyEmail') {
      alert('Email verified successfully!');
      window.history.replaceState({}, document.title, window.location.pathname);
      checkAuth();
    }

    const code = urlParams.get('code');
    if (code && currentUser) {
      apiFetch('/api/user/discord/oauth', {
        method: 'POST',
        body: JSON.stringify({ code, redirectUri: `${SITE_ORIGIN}/discord-callback` })
      })
        .then((res) => {
          alert(`Discord Connected! Role: ${res.roleTag}`);
          window.history.replaceState({}, document.title, window.location.pathname);
          checkAuth();
        })
        .catch((err) => alert('Discord OAuth error: ' + err.message));
    }
  }, [currentUser, checkAuth]);

  const openAuth = (tab) => {
    setAuthTab(tab);
    setAuthModalOpen(true);
  };

  if (currentUser && !currentUser.emailVerified) {
    return (
      <div className="app-root">
        <header className="navbar">
          <div className="brand">
            <i className="fa-solid fa-planet"></i> <span>ASTRAL</span>FORUM
          </div>
          <div className="nav-actions">
            <button className="btn btn-sm btn-danger" onClick={logout}>
              <i className="fa-solid fa-right-from-bracket"></i> Log Out
            </button>
          </div>
        </header>
        <div className="container">
          <VerifyEmailPage />
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">
      {/* NAVBAR */}
      <header className="navbar">
        <div className="brand" onClick={() => setCurrentView('categories')}>
          <i className="fa-solid fa-planet"></i> <span>ASTRAL</span>FORUM
        </div>
        <div className="nav-actions">
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              {isStaff() && (
                <button className="btn btn-warning btn-sm" onClick={() => setStaffModalOpen(true)}>
                  <i className="fa-solid fa-user-shield"></i> ModView Panel
                </button>
              )}
              <img
                className="avatar"
                style={{ width: '38px', height: '38px', margin: 0, cursor: 'pointer' }}
                src={currentUser.avatarUrl || 'https://via.placeholder.com/38'}
                alt="Avatar"
                onClick={() => setProfileModalOpen(true)}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }} onClick={() => setProfileModalOpen(true)}>
                  {currentUser.displayName}
                </div>
                <span className={`role-badge role-${currentUser.role}`}>{currentUser.roleTag || currentUser.role}</span>
              </div>
              <button className="btn btn-sm" onClick={() => setProfileModalOpen(true)}>
                <i className="fa-solid fa-gear"></i>
              </button>
              <button className="btn btn-sm btn-danger" onClick={logout}>
                <i className="fa-solid fa-right-from-bracket"></i>
              </button>
            </div>
          ) : (
            <>
              <button className="btn" onClick={() => openAuth('login')}>
                <i className="fa-solid fa-right-to-bracket"></i> Log In
              </button>
              <button className="btn btn-primary" onClick={() => openAuth('register')}>
                <i className="fa-solid fa-user-plus"></i> Register
              </button>
            </>
          )}
        </div>
      </header>

      {/* HERO BANNER */}
      <div className="hero">
        <h1><i className="fa-solid fa-comments"></i> Welcome to AstralForum</h1>
        <p>Join community discussions, check updates, and connect with players.</p>
      </div>

      {/* MAIN CONTAINER */}
      <div className="container">
        {currentView === 'categories' && (
          <CategoriesPage
            onSelectSubcategory={(id, name) => {
              setSelectedSubcategory({ id, name });
              setCurrentView('subcategory');
            }}
          />
        )}

        {currentView === 'subcategory' && selectedSubcategory && (
          <SubcategoryPage
            subcategory={selectedSubcategory}
            onBack={() => setCurrentView('categories')}
            onSelectThread={(id, title) => {
              setSelectedThread({ id, title });
              setCurrentView('thread');
            }}
          />
        )}

        {currentView === 'thread' && selectedThread && selectedSubcategory && (
          <ThreadDetailPage
            threadId={selectedThread.id}
            title={selectedThread.title}
            subcategory={selectedSubcategory}
            onBackToForums={() => setCurrentView('categories')}
            onBackToSubcategory={() => setCurrentView('subcategory')}
          />
        )}
      </div>

      {/* MODALS */}
      <AuthModal isOpen={authModalOpen} initialTab={authTab} onClose={() => setAuthModalOpen(false)} />
      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
      <StaffModal isOpen={staffModalOpen} onClose={() => setStaffModalOpen(false)} />
    </div>
  );
}
