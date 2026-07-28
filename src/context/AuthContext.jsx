import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getRootRedirectUri = () => `${window.location.origin}/`;

  // 1. Session verification
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

  useEffect(() => {
    checkAuth();
  }, []);

  // 2. Intercept OAuth & Auth Redirect Callbacks
  useEffect(() => {
    const handleUrlCallbacks = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const mode = urlParams.get('mode');

      if (mode === 'verifyEmail') {
        alert('Email verified successfully!');
        window.history.replaceState({}, document.title, getRootRedirectUri());
        await checkAuth();
        return;
      }

      if (mode === 'resetPassword') {
        alert('Password reset link processed. You may now log in with your new credentials.');
        window.history.replaceState({}, document.title, getRootRedirectUri());
        return;
      }

      if (code && currentUser) {
        try {
          const redirectUri = getRootRedirectUri();
          const res = await apiFetch('/api/user/discord/oauth', {
            method: 'POST',
            body: JSON.stringify({ code, redirectUri }),
          });

          alert(`Discord Connected! Assigned role: ${res.roleTag}`);
          window.history.replaceState({}, document.title, getRootRedirectUri());
          await checkAuth();
        } catch (err) {
          alert('Discord OAuth failed: ' + err.message);
        }
      }
    };

    handleUrlCallbacks();
  }, [currentUser]);

  // 3. Self-service password reset
  const requestPasswordReset = async (email) => {
    try {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, redirectUri: getRootRedirectUri() })
      });
      alert('Password reset email sent!');
    } catch (err) {
      alert('Error requesting password reset: ' + err.message);
    }
  };

  // 4. Staff Action: Trigger reset link for a specific user
  const staffSendResetEmail = async (targetEmail) => {
    try {
      await apiFetch('/api/staff/user/send-reset-email', {
        method: 'POST',
        body: JSON.stringify({ email: targetEmail, redirectUri: getRootRedirectUri() })
      });
      alert(`Password reset link successfully sent to ${targetEmail}`);
    } catch (err) {
      alert('Failed to send reset email: ' + err.message);
    }
  };

  // 5. Staff Action: Directly overwrite target user's password
  const staffResetUserPassword = async (targetUserId, newPassword) => {
    try {
      await apiFetch('/api/staff/user/reset-password', {
        method: 'POST',
        body: JSON.stringify({ userId: targetUserId, newPassword })
      });
      alert('Password updated successfully for the user.');
    } catch (err) {
      alert('Failed to reset user password: ' + err.message);
    }
  };

  // 6. User Logout
  const logout = () => {
    document.cookie = 'session_id=; Secure; SameSite=None; Path=/; Max-Age=0';
    document.cookie = 'user_id=; Secure; SameSite=None; Path=/; Max-Age=0';
    setCurrentUser(null);
  };

  // 7. Permission Helpers
  const canManageCategories = () => {
    if (!currentUser || !currentUser.emailVerified) return false;
    if (currentUser.permissions?.manageCategories || currentUser.permissions?.full) return true;

    const allowedRoles = [
      'Owner', 'Co-Owner', 'Chief Manager', 'Sr. Manager', 'Manager',
      'Sr. Developer', 'Developer'
    ];

    return allowedRoles.includes(currentUser.roleTag);
  };

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
        requestPasswordReset,
        staffSendResetEmail,
        staffResetUserPassword,
        canManageCategories,
        isStaff,
        getRootRedirectUri,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
