import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../Avatar';

/**
 * IgnoreListModal
 * ────────────────
 * Shown as a tab inside ProfileModal.
 * Lists all currently ignored users and allows unignoring them.
 */
export const IgnoreListModal = () => {
  const { currentUser, checkAuth } = useAuth();
  const [ignoredProfiles, setIgnoredProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const fetchIgnoredProfiles = async () => {
    const ids = currentUser?.ignoredUsers || [];
    if (ids.length === 0) {
      setIgnoredProfiles([]);
      return;
    }
    setLoading(true);
    try {
      const profiles = await Promise.all(
        ids.map((id) =>
          apiFetch(`/api/users/${id}`).catch(() => ({ id, displayName: 'Unknown User', avatarUrl: '', role: 'member', roleTag: 'Member' }))
        )
      );
      setIgnoredProfiles(profiles);
    } catch (err) {
      console.error('Failed to load ignored profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIgnoredProfiles();
  }, [currentUser?.ignoredUsers]);

  const handleUnignore = async (targetUserId) => {
    setRemovingId(targetUserId);
    try {
      await apiFetch(`/api/user/ignore/${targetUserId}`, { method: 'DELETE' });
      await checkAuth();
      setIgnoredProfiles((prev) => prev.filter((p) => p.id !== targetUserId));
    } catch (err) {
      alert(err.message);
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '0.85rem' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }}></i>
        Loading ignored users…
      </div>
    );
  }

  if (ignoredProfiles.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '0.85rem' }}>
        <i className="fa-solid fa-eye" style={{ color: 'var(--accent-green)', marginRight: '0.5rem' }}></i>
        Your ignore list is empty. Users you ignore will not appear in threads or post lists.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-code)', marginBottom: '0.25rem' }}>
        Posts and threads from ignored users are hidden. You can unignore at any time.
      </p>
      {ignoredProfiles.map((p) => (
        <div
          key={p.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            background: 'rgba(12, 6, 9, 0.6)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--r-md)',
            padding: '0.65rem 0.85rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Avatar src={p.avatarUrl} name={p.displayName} size={36} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>{p.displayName}</div>
              <span className={`role-badge role-${p.role}`}>{p.roleTag || p.role}</span>
            </div>
          </div>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => handleUnignore(p.id)}
            disabled={removingId === p.id}
            title="Unignore this user"
          >
            {removingId === p.id ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : (
              <><i className="fa-solid fa-eye"></i> Unignore</>
            )}
          </button>
        </div>
      ))}
    </div>
  );
};
