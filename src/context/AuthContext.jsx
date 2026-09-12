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
        { 
          ttl: AUTH_TTL, 
          onRevalidate: (fresh) => setCurrentUser(fresh?.authenticated ? fresh.user : null) 
        }
      );
      if (res && res.authenticated && res.user) {
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
    if (!authResponse) return;

    if (authResponse?.token) {
      localStorage.setItem('astral_token', authResponse.token);
    }

    // Invalidate stale cached /api/auth/me entries immediately
    invalidateCache(AUTH_KEY);

    // Normalize user object whether it came from /api/auth/login or /api/auth/me
    const userPayload = authResponse.user || {
      id: authResponse.userId || authResponse.id,
      email: authResponse.email,
      emailVerified: Boolean(authResponse.emailVerified),
      displayName: authResponse.displayName,
      role: authResponse.role || 'member',
      roleTag: authResponse.roleTag || 'Member',
      permissions: authResponse.permissions || {},
      avatarUrl: authResponse.avatarUrl || '',
      isMuted: Boolean(authResponse.isMuted),
      muteReason: authResponse.muteReason || null,
      mutedUntil: authResponse.mutedUntil || null,
      ignoredUsers: authResponse.ignoredUsers || []
    };

    setCache(AUTH_KEY, { authenticated: true, user: userPayload });
    setCurrentUser(userPayload);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('astral_token');
    
    // Clear cookies client-side as fallback
    document.cookie = 'astral_session=; Secure; SameSite=None; Path=/; Max-Age=0; Partitioned';
    document.cookie = 'session_id=; Secure; SameSite=None; Path=/; Max-Age=0; Partitioned';
    document.cookie = 'user_id=; Secure; SameSite=None; Path=/; Max-Age=0; Partitioned';
    
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
