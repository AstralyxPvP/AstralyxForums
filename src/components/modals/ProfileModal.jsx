import React, { useState, useEffect } from 'react';
import { apiFetch, SITE_ORIGIN } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { AvatarCanvas } from '../AvatarCanvas';

export const ProfileModal = ({ isOpen, onClose }) => {
  const { currentUser, checkAuth, logout } = useAuth();
  const [tab, setTab] = useState('profile');
  const [displayName, setDisplayName] = useState('');
  const [link, setLink] = useState('');
  const [signature, setSignature] = useState('');

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setLink(currentUser.link || '');
      setSignature(currentUser.signature || '');
    }
  }, [currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ displayName, link, signature })
      });
      alert('Profile updated!');
      await checkAuth();
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDiscordOAuthRedirect = async () => {
    try {
      const redirectUri = encodeURIComponent(`${SITE_ORIGIN}/discord-callback`);
      const res = await apiFetch(`/api/user/discord/oauth-url?redirect_uri=${redirectUri}`);
      window.location.href = res.url;
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUnlinkDiscord = async () => {
    if (!confirm('Unlink Discord account?')) return;
    try {
      await apiFetch('/api/user/discord/unlink', { method: 'POST' });
      alert('Discord unlinked.');
      await checkAuth();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('PERMANENT ACTION: Are you sure you want to delete your entire account?')) return;
    try {
      await apiFetch('/api/user/account', { method: 'DELETE' });
      alert('Account deleted.');
      logout();
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2><i className="fa-solid fa-user-gear"></i> User Settings</h2>
        <div className="modal-tabs">
          <button className={`tab-btn ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
            <i className="fa-solid fa-user"></i> Profile
          </button>
          <button className={`tab-btn ${tab === 'avatar' ? 'active' : ''}`} onClick={() => setTab('avatar')}>
            <i className="fa-solid fa-image"></i> Avatar
          </button>
          <button className={`tab-btn ${tab === 'discord' ? 'active' : ''}`} onClick={() => setTab('discord')}>
            <i className="fa-brands fa-discord"></i> Discord Sync
          </button>
          <button className={`tab-btn ${tab === 'danger' ? 'active' : ''}`} onClick={() => setTab('danger')}>
            <i className="fa-solid fa-shield-halved"></i> Account
          </button>
        </div>

        {tab === 'profile' && (
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label>Display Name</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>External Link (Website / Social)</label>
              <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" />
            </div>
            <div className="form-group">
              <label>Forum Signature</label>
              <textarea rows="3" value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Appears below posts..."></textarea>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <i className="fa-solid fa-floppy-disk"></i> Save Changes
            </button>
          </form>
        )}

        {tab === 'avatar' && <AvatarCanvas onClose={onClose} />}

        {tab === 'discord' && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              {currentUser.discordId ? (
                <p style={{ color: 'var(--role-member)', fontSize: '0.9rem' }}>
                  Linked Discord ID: <strong>{currentUser.discordId}</strong>
                </p>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No Discord account linked.</p>
              )}
            </div>
            <button type="button" className="btn btn-discord" style={{ width: '100%', marginBottom: '1rem' }} onClick={handleDiscordOAuthRedirect}>
              <i className="fa-brands fa-discord"></i> Connect with Discord (OAuth2)
            </button>
            {currentUser.discordId && (
              <button type="button" className="btn btn-danger" style={{ width: '100%' }} onClick={handleUnlinkDiscord}>
                <i className="fa-solid fa-link-slash"></i> Unlink Discord Account
              </button>
            )}
          </div>
        )}

        {tab === 'danger' && (
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--accent-danger)', marginBottom: '1rem' }}>
              Warning: Deleting your account is permanent and clears all profile data and credentials.
            </p>
            <button type="button" className="btn btn-danger" style={{ width: '100%' }} onClick={handleDeleteAccount}>
              <i className="fa-solid fa-user-xmark"></i> Delete Account Permanently
            </button>
          </div>
        )}

        <button type="button" className="btn btn-sm" style={{ width: '100%', marginTop: '1.5rem' }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};
