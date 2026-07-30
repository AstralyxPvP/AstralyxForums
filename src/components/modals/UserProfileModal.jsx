import React, { useState, useEffect } from 'react';
import { apiFetch, formatAuthorName } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../Avatar';

export const UserProfilePage = ({ userId, onBackToForums, onOpenThread }) => {
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
      await checkAuth();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '0.85rem' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }}></i> Loading profile...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="forum-card" style={{ padding: '3rem', textAlign: 'center', borderColor: 'var(--accent-red)' }}>
        <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '2rem', color: 'var(--accent-red)', marginBottom: '1rem' }}></i>
        <p style={{ color: 'var(--accent-danger)', fontFamily: 'var(--font-code)', fontSize: '0.9rem' }}>
          {error || 'User not found.'}
        </p>
        <button className="btn btn-sm" style={{ marginTop: '1.5rem' }} onClick={onBackToForums}>Back to Home</button>
      </div>
    );
  }

  const displayName = formatAuthorName(profile.displayName);

  return (
    <div>
      <div className="breadcrumb">
        <span onClick={onBackToForums} style={{ cursor: 'pointer' }}>
          <i className="fa-solid fa-house"></i> Forums
        </span>{' '}
        &gt; <span>User Profile</span> &gt; <span>{displayName}</span>
      </div>

      <div className="forum-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <Avatar src={profile.avatarUrl} name={displayName} size={120} />
            <div style={{ marginTop: '1rem' }}>
              <span className={`role-badge role-${profile.role}`} style={{ fontSize: '0.8rem', padding: '4px 12px' }}>
                {profile.roleTag || profile.role}
              </span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>
              {displayName}
            </h1>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-code)' }}>
              <span><i className="fa-solid fa-calendar-days" style={{ color: 'var(--accent-red)', marginRight: '0.4rem' }}></i> Joined: {new Date(profile.joinedAt).toLocaleDateString()}</span>
              {profile.link && (
                <a href={profile.link} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>
                  <i className="fa-solid fa-link" style={{ marginRight: '0.4rem' }}></i> Website
                </a>
              )}
            </div>

            {profile.signature && (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--r-md)', borderLeft: '3px solid var(--accent-gold)', fontStyle: 'italic', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                "{profile.signature}"
              </div>
            )}

            {currentUser && currentUser.id !== profile.id && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className={`btn ${isIgnored ? 'btn-primary' : 'btn-danger'}`}
                  onClick={handleIgnoreToggle}
                  disabled={actionLoading}
                >
                  {isIgnored ? <><i className="fa-solid fa-eye"></i> Unignore User</> : <><i className="fa-solid fa-eye-slash"></i> Ignore / Block User</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="forum-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
            Recent Activity
          </h3>
          {profile.recentThreads && profile.recentThreads.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {profile.recentThreads.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => onOpenThread(t.id, t.title)}
                  style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--r-sm)', cursor: 'pointer', border: '1px solid var(--border-color)' }}
                  className="hover-bright"
                >
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{t.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>{new Date(t.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>No recent threads found.</p>
          )}
        </div>

        <div className="forum-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
            Stats & Badges
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
             <span className="role-badge" style={{ background: 'var(--accent-blue)', color: '#fff' }}>Active Member</span>
             {profile.isBanned && <span className="role-badge" style={{ background: 'var(--accent-red)', color: '#fff' }}>Banned</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
export default UserProfileModal;