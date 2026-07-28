import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Check current login session
  const checkAuth = async () => {
    try {
      const res = await apiFetch('/api/auth/me');
      if (res.authenticated) {
        setCurrentUser(res.user);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial load authentication check
  useEffect(() => {
    checkAuth();
  }, []);

  // 2. Intercept Discord OAuth redirect callback code in URL
  useEffect(() => {
    const handleDiscordOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code && currentUser) {
        try {
          const redirectUri = window.location.origin + window.location.pathname;
          const res = await apiFetch('/api/user/discord/oauth', {
            method: 'POST',
            body: JSON.stringify({ code, redirectUri }),
          });

          alert(`Discord Connected! Assigned role: ${res.roleTag}`);
          
          // Clean the OAuth code parameter from the browser address bar
          window.history.replaceState({}, document.title, window.location.pathname);
          await checkAuth();
        } catch (err) {
          alert('Discord OAuth failed: ' + err.message);
        }
      }
    };

    handleDiscordOAuthCallback();
  }, [currentUser]);

  // 3. User logout handler
  const logout = () => {
    document.cookie = 'session_id=; Secure; SameSite=None; Path=/; Max-Age=0';
    document.cookie = 'user_id=; Secure; SameSite=None; Path=/; Max-Age=0';
    setCurrentUser(null);
  };

  // 4. Permission helper: Category management
  const canManageCategories = () => {
    if (!currentUser || !currentUser.emailVerified) return false;
    if (currentUser.permissions?.manageCategories || currentUser.permissions?.full) return true;

    const allowedRoles = [
      'Owner', 'Co-Owner', 'Chief Manager', 'Sr. Manager', 'Manager',
      'Sr. Developer', 'Developer'
    ];

    return allowedRoles.includes(currentUser.roleTag);
  };

  // 5. Permission helper: General staff panel access
  const isStaff = () => {
    if (!currentUser || !currentUser.emailVerified) return false;
    return (
      canManageCategories() ||
      currentUser.permissions?.ban ||
      currentUser.permissions?.kick ||
      currentUser.permissions?.delete
    );
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        loading,
        checkAuth,
        logout,
        canManageCategories,
        isStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
