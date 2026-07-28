import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api';
import AvatarCanvas from '../AvatarCanvas';

export default function ProfileModal({ onClose }) {
  const { currentUser, checkAuth, logout } = useAuth();
  
  // Tab State: 'profile' | 'avatar' | 'discord' | 'danger'
  const [tab, setTab] = useState('profile');

  // Form Fields State
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [link, setLink] = useState(currentUser?.link || '');
  const [signature, setSignature] = useState(currentUser?.signature || '');

  // 1. Handle Profile Details Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ displayName, link, signature })
      });
      alert('Profile updated successfully!');
      await checkAuth();
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  // 2. Handle Avatar Canvas Upload
  const handleAvatarUpload = async (blob) => {
    const formData = new FormData();
    formData.append('avatar', blob, 'avatar.webp');

    try {
      await apiFetch('/api/user/avatar', { method: 'POST', body: formData });
      alert('Avatar updated successfully!');
      await checkAuth();
      onClose();
    } catch (err) {
      alert('Avatar upload error: ' + err.message);
    }
  };

  // 3. Handle Discord OAuth Redirect
  const handleDiscordOAuthRedirect = async () => {
    try {
      const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
      const res = await apiFetch(`/api/user/discord/oauth-url?redirect_uri=${redirectUri}`);
      window.location.href = res.url;
    } catch (err) {
      alert(err.message);
    }
  };

  // 4. Handle Discord Unlink
  const handleUnlinkDiscord = async () => {
    if (!window.confirm('Are you sure you want to unlink your Discord account?')) return;
    try {
      await apiFetch('/api/user/discord/unlink', { method: 'POST' });
      alert('Discord account unlinked.');
      await checkAuth();
    } catch (err) {
      alert(err.message);
    }
  };

  // 5. Handle Permanent Account Deletion
  const handleDeleteAccount = async () => {
    if (!window.confirm('PERMANENT ACTION: Are you sure you want to delete your entire account?')) return;
    try {
      await apiFetch('/api/user/account', { method: 'DELETE' });
      alert('Your account has been deleted.');
      logout();
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>
          <i className="fa-solid fa-user-gear"></i> User Settings
        </h2>

        {/* Modal Tab Navigation */}
        <div className="modal-tabs">
          <button
            className={`tab-btn ${tab === 'profile' ? 'active' : ''}`}
            onClick={() => setTab('profile')}
          >
            <i className="fa-solid fa-user"></i> Profile
          </button>
          <button
            className={`tab-btn ${tab === 'avatar' ? 'active' : ''}`}
            onClick={() => setTab('avatar')}
          >
            <i className="fa-solid fa-image"></i> Avatar
          </button>
          <button
            className={`tab-btn ${tab === 'discord' ? 'active' : ''}`}
            onClick={() => setTab('discord')}
          >
            <i className="fa-brands fa-discord"></i> Discord Sync
          </button>
          <button
            className={`tab-btn ${tab === 'danger' ? 'active' : ''}`}
            onClick={() => setTab('danger')}
          >
            <i className="fa-solid fa-shield-halved"></i> Account
          </button>
        </div>

        {/* SECTION 1: Profile Settings */}
        {tab === 'profile' && (
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>External Link (Social / Website)</label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://"
              />
            </div>
            <div className="form-group">
              <label>Forum Signature</label>
              <textarea
                rows="3"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Appears below your posts..."
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <i className="fa-solid fa-floppy-disk"></i> Save Changes
            </button>
          </form>
        )}

        {/* SECTION 2: Avatar Cropper */}
        {tab === 'avatar' && (
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1rem' }}>
              Select an image, adjust crop/scale using the canvas, and upload. Images are exported as WebP.
            </p>
            <AvatarCanvas onUploadSuccess={handleAvatarUpload} />
          </div>
        )}

        {/* SECTION 3: Discord OAuth Sync */}
        {tab === 'discord' && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              {currentUser?.discordId ? (
                <p style={{ color: 'var(--role-member)', fontSize: '0.9rem' }}>
                  Linked Discord ID: <strong>{currentUser.discordId}</strong>
                </p>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No Discord account linked.
                </p>
              )}
            </div>

            <button
              type="button"
              className="btn btn-discord"
              style={{ width: '100%' }}
              onClick={handleDiscordOAuthRedirect}
            >
              <i className="fa-brands fa-discord"></i> Connect with Discord (OAuth2)
            </button>

            {currentUser?.discordId && (
              <button
                type="button"
                className="btn btn-danger"
                style={{ width: '100%', marginTop: '1rem' }}
                onClick={handleUnlinkDiscord}
              >
                <i className="fa-solid fa-link-slash"></i> Unlink Discord Account
              </button>
            )}
          </div>
        )}

        {/* SECTION 4: Danger Zone / Delete Account */}
        {tab === 'danger' && (
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--accent-danger)', marginBottom: '1rem' }}>
              Warning: Deleting your account is permanent and clears all your profile data.
            </p>
            <button
              type="button"
              className="btn btn-danger"
              style={{ width: '100%' }}
              onClick={handleDeleteAccount}
            >
              <i className="fa-solid fa-user-xmark"></i> Delete Account Permanently
            </button>
          </div>
        )}

        {/* Modal Close Button */}
        <button
          type="button"
          className="btn btn-sm"
          style={{ width: '100%', marginTop: '1.5rem' }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
