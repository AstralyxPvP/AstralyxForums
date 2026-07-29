import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await apiFetch('/api/auth/me');
      if (res.authenticated) {
        setCurrentUser(res.user);
        return res.user;
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
    return null;
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const logout = () => {
    document.cookie = 'session_id=; Secure; SameSite=None; Path=/; Max-Age=0';
    document.cookie = 'user_id=; Secure; SameSite=None; Path=/; Max-Age=0';
    setCurrentUser(null);
  };

  const canManageCategories = () => {
    if (!currentUser || !currentUser.emailVerified) return false;
    if (currentUser.permissions?.manageCategories || currentUser.permissions?.full) return true;
    const allowedRoles = ['Owner', 'Co-Owner', 'Chief Manager', 'Sr. Manager', 'Manager', 'Sr. Developer', 'Developer'];
    return allowedRoles.includes(currentUser.roleTag);
  };

  const isStaff = () => {
    if (!currentUser || !currentUser.emailVerified) return false;
    return canManageCategories() || currentUser.permissions?.ban || currentUser.permissions?.mute || currentUser.permissions?.delete || currentUser.permissions?.resetPass;
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, loading, checkAuth, logout, canManageCategories, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
