import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { apiFetch, SITE_ORIGIN, formatAuthorName } from './api';
import { Avatar } from './components/Avatar';
import { CategoriesPage } from './pages/CategoriesPage';
import { SubcategoryPage } from './pages/SubcategoryPage';
import { ThreadDetailPage } from './pages/ThreadDetailPage';
import { UserProfilePage } from './pages/UserProfilePage'; // NEW
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { AuthModal } from './components/modals/AuthModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { StaffModal } from './components/modals/StaffModal';

export default function App() {
  const { currentUser, isStaff, logout, checkAuth } = useAuth();
  
  const [currentView, setCurrentView] = useState('categories');
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [selectedProfileId, setSelectedProfileId] = useState(null); // NEW

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const parseRouteFromUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;

    const threadId = params.get('thread') || (path.startsWith('/thread/') ? path.split('/thread/')[1] : null);
    const subcatId = params.get('subcat') || (path.startsWith('/subcat/') ? path.split('/subcat/')[1] : null);
    const userId = params.get('user') || (path.startsWith('/user/') ? path.split('/user/')[1] : null); // NEW

    if (threadId) {
      setSelectedThread((prev) => (prev?.id === threadId ? prev : { id: threadId, title: '' }));
      setCurrentView('thread');
    } else if (subcatId) {
      setSelectedSubcategory((prev) => (prev?.id === subcatId ? prev : { id: subcatId, name: '' }));
      setSelectedThread(null);
      setCurrentView('subcategory');
    } else if (userId) { // NEW
      setSelectedProfileId(userId);
      setCurrentView('profile');
    } else {
      setSelectedSubcategory(null);
      setSelectedThread(null);
      setSelectedProfileId(null);
      setCurrentView('categories');
    }
  }, []);

  useEffect(() => {
    parseRouteFromUrl();
    window.addEventListener('popstate', parseRouteFromUrl);
    return () => window.removeEventListener('popstate', parseRouteFromUrl);
  }, [parseRouteFromUrl]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'verifyEmail') {
      alert('Email verified successfully!');
      window.history.replaceState({}, document.title, window.location.pathname);
      checkAuth({ force: true });
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
          checkAuth({ force: true });
        })
        .catch((err) => alert('Discord OAuth error: ' + err.message));
    }
  }, [currentUser, checkAuth]);

  const navigateToCategories = () => {
    window.history.pushState({}, '', '/');
    setSelectedSubcategory(null);
    setSelectedThread(null);
    setSelectedProfileId(null);
    setCurrentView('categories');
  };

  const navigateToSubcategory = (id, name = '') => {
    window.history.pushState({}, '', `/?subcat=${id}`);
    setSelectedSubcategory({ id, name });
    setSelectedThread(null);
    setSelectedProfileId(null);
    setCurrentView('subcategory');
  };

  const navigateToThread = (threadId, title = '') => {
    window.history.pushState({}, '', `/?thread=${threadId}`);
    setSelectedThread({ id: threadId, title });
    setSelectedProfileId(null);
    setCurrentView('thread');
  };

  const navigateToProfile = (userId) => { // NEW
    window.history.pushState({}, '', `/?user=${userId}`);
    setSelectedProfileId(userId);
    setSelectedThread(null);
    setSelectedSubcategory(null);
    setCurrentView('profile');
  };

  const openAuth = (tab) => {
    setAuthTab(tab);
    setAuthModalOpen(true);
  };

  if (currentUser && !currentUser.emailVerified) {
    return (
      <div className="app-root">
      <header className={"navbar" + (scrolled ? " scrolled" : "")}>
        <div className="brand" onClick={navigateToCategories}>
            <img
              className="brand-logo"
              src="https://www.astralyxpvp.int.yt/Assets/logo-compress.png"
              alt="AstralyxPvP"
            />
            <div className="brand-text">
              <span className="brand-top">AstralyxPvP</span>
              <span className="brand-sub">Forums</span>
            </div>
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
      <header className={"navbar" + (scrolled ? " scrolled" : "")}>
        <div className="brand" onClick={() => { navigateToCategories(); setMenuOpen(false); }}>
          <img
            className="brand-logo"
            src="https://www.astralyxpvp.int.yt/Assets/logo-compress.png"
            alt="AstralyxPvP"
          />
          <div className="brand-text">
            <span className="brand-top">AstralyxPvP</span>
            <span className="brand-sub">Forums</span>
          </div>
        </div>
        <div className="nav-actions">
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              {isStaff() && (
                <button className="btn btn-warning btn-sm" onClick={() => setStaffModalOpen(true)}>
                  <i className="fa-solid fa-user-shield"></i> ModView Panel
                </button>
              )}
              <Avatar
                src={currentUser.avatarUrl}
                name={currentUser.displayName}
                size={38}
                onClick={() => setProfileModalOpen(true)}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }} onClick={() => setProfileModalOpen(true)}>
                  {formatAuthorName(currentUser.displayName)}
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
        {/* Hamburger — mobile */}
        <button
          className={"hamburger" + (menuOpen ? " open" : "")}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>
      </header>

      {/* Mobile menu */}
      <div className={"mobile-menu" + (menuOpen ? " open" : "")}>
        {currentUser ? (
          <>
            <div className="mobile-user-row">
              <Avatar src={currentUser.avatarUrl} name={currentUser.displayName} size={36} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{currentUser.displayName}</div>
                <span className={"role-badge role-" + currentUser.role}>{currentUser.roleTag || currentUser.role}</span>
              </div>
            </div>
            {isStaff() && (
              <button className="btn btn-warning" onClick={() => { setStaffModalOpen(true); setMenuOpen(false); }}>
                <i className="fa-solid fa-user-shield" /> Staff Panel
              </button>
            )}
            <button className="btn" onClick={() => { setProfileModalOpen(true); setMenuOpen(false); }}>
              <i className="fa-solid fa-gear" /> Profile
            </button>
            <button className="btn btn-danger" onClick={() => { logout(); setMenuOpen(false); }}>
              <i className="fa-solid fa-right-from-bracket" /> Log Out
            </button>
          </>
        ) : (
          <>
            <button className="btn" onClick={() => { openAuth('login'); setMenuOpen(false); }}>
              <i className="fa-solid fa-right-to-bracket" /> Log In
            </button>
            <button className="btn btn-primary" onClick={() => { openAuth('register'); setMenuOpen(false); }}>
              <i className="fa-solid fa-user-plus" /> Register
            </button>
          </>
        )}
      </div>

      {/* HERO BANNER */}
      <div className="hero">
        <h1><i className="fa-solid fa-comments"></i> Welcome to AstralForum</h1>
        <p>Join community discussions, check updates, and connect with players.</p>
      </div>

      {/* MAIN CONTAINER */}
      <div className="container">
        {currentView === 'categories' && (
          <CategoriesPage
            onSelectSubcategory={(id, name) => navigateToSubcategory(id, name)}
          />
        )}

        {currentView === 'subcategory' && selectedSubcategory && (
          <SubcategoryPage
            subcategory={selectedSubcategory}
            onBack={navigateToCategories}
            onSelectThread={(id, title) => navigateToThread(id, title)}
            onOpenProfile={navigateToProfile} // NEW
          />
        )}

        {currentView === 'thread' && selectedThread && (
          <ThreadDetailPage
            threadId={selectedThread.id}
            title={selectedThread.title}
            subcategory={selectedSubcategory}
            onBackToForums={navigateToCategories}
            onBackToSubcategory={(subId, subName) => {
              if (subId) navigateToSubcategory(subId, subName);
              else navigateToCategories();
            }}
            onOpenProfile={navigateToProfile} // NEW
          />
        )}

        {currentView === 'profile' && selectedProfileId && ( // NEW
          <UserProfilePage
            userId={selectedProfileId}
            onBackToForums={navigateToCategories}
            onOpenThread={(id, title) => navigateToThread(id, title)}
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
