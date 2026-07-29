import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../Avatar';

/**
 * UserProfileModal
 * ─────────────────
 * Displays a public profile for any forum user.
 * Props:
 *   userId   – the UID of the user to view
 *   onClose  – callback to close the modal
 */
export const UserProfileModal = ({ userId, onClose }) => {
  const { currentUser, checkAuth } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isIgnored, setIsIgnored] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    apiFetch(`/api/users/${userId}`)
      .then((data) => {
        setProfile(data);
        // Check if this user is already in the current user's ignore list
        if (currentUser?.ignoredUsers) {
          setIsIgnored(currentUser.ignoredUsers.includes(userId));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId, currentUser]);

  const handleIgnoreToggle = async () => {
    if (!currentUser) return;
    setActionLoading(true);
    try {
      if (isIgnored) {
        await apiFetch(`/api/user/ignore/${userId}`, { method: 'DELETE' });
        setIsIgnored(false);
      } else {
        await apiFetch('/api/user/ignore', {
          method: 'POST',
          body: JSON.stringify({ targetUserId: userId })
        });
        setIsIgnored(true);
      }
      // Refresh auth context so the ignore list is up-to-date everywhere
      await checkAuth();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (!userId) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '420px' }}>
        <h2 style={{ marginBottom: '1.25rem' }}>
          <i className="fa-solid fa-id-card" style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }}></i>
          User Profile
        </h2>

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '0.85rem' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }}></i>
            Loading profile…
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--accent-danger)', fontFamily: 'var(--font-code)', fontSize: '0.85rem' }}>
            <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '0.5rem' }}></i>
            {error}
          </div>
        )}

        {!loading && !error && profile && (
          <div>
            {/* Avatar + name row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <Avatar src={profile.avatarUrl} name={profile.displayName} size={64} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>
                  {profile.displayName}
                </div>
                <span className={`role-badge role-${profile.role}`} style={{ marginTop: '4px', display: 'inline-block' }}>
                  {profile.roleTag || profile.role}
                </span>
              </div>
            </div>

            {/* Profile details */}
            <div style={{
              background: 'rgba(12, 6, 9, 0.6)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--r-md)',
              padding: '1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem'
            }}>
              {profile.joinedAt && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>
                  <i className="fa-solid fa-calendar-days" style={{ color: 'var(--accent-red)', marginRight: '0.4rem' }}></i>
                  Joined: <span style={{ color: 'var(--text-main)' }}>{new Date(profile.joinedAt).toLocaleDateString()}</span>
                </div>
              )}
              {profile.link && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>
                  <i className="fa-solid fa-link" style={{ color: 'var(--accent-cyan)', marginRight: '0.4rem' }}></i>
                  <a href={profile.link} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>
                    {profile.link}
                  </a>
                </div>
              )}
              {profile.signature && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-code)', borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem', marginTop: '0.2rem' }}>
                  <i className="fa-solid fa-pen-nib" style={{ color: 'var(--accent-gold)', marginRight: '0.4rem' }}></i>
                  <span style={{ color: 'var(--text-main)', fontStyle: 'italic' }}>{profile.signature}</span>
                </div>
              )}
            </div>

            {/* Ignore / Unignore button — only shown when logged in and not viewing own profile */}
            {currentUser && currentUser.id !== userId && (
              <button
                className={`btn ${isIgnored ? 'btn-primary' : 'btn-danger'}`}
                style={{ width: '100%', marginBottom: '0.75rem' }}
                onClick={handleIgnoreToggle}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Processing…</>
                ) : isIgnored ? (
                  <><i className="fa-solid fa-eye"></i> Unignore User</>
                ) : (
                  <><i className="fa-solid fa-eye-slash"></i> Ignore User</>
                )}
              </button>
            )}
          </div>
        )}

        <button type="button" className="btn btn-sm" style={{ width: '100%', marginTop: '0.5rem' }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};
