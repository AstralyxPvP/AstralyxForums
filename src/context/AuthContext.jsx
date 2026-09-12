import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { cachedFetch, invalidateCache, setCache } from '../api/cache';

const AuthContext = createContext(null);

const AUTH_KEY = '/api/auth/me';
const AUTH_TTL = 60_000;

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async ({ force = false } = {}) => {
    if (force) invalidateCache(AUTH_KEY);
    try {
      const res = await cachedFetch(
        AUTH_KEY,
        () => apiFetch('/api/auth/me'),
        { ttl: AUTH_TTL, onRevalidate: (fresh) => setCurrentUser(fresh?.authenticated ? fresh.user : null) }
      );
      if (res && res.authenticated) {
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

  const seedAuthCache = (authResponse) => {
    // If authResponse contains token, persist it
    if (authResponse?.token) {
      localStorage.setItem('astral_token', authResponse.token);
    }
    setCache(AUTH_KEY, { authenticated: true, user: authResponse });
    setCurrentUser(authResponse);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('astral_token');
    document.cookie = 'session_id=; Secure; SameSite=None; Path=/; Max-Age=0';
    document.cookie = 'user_id=; Secure; SameSite=None; Path=/; Max-Age=0';
    invalidateCache(AUTH_KEY);
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
    <AuthContext.Provider value={{ currentUser, setCurrentUser, loading, checkAuth, seedAuthCache, logout, canManageCategories, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
