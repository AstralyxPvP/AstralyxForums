import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api';
import AvatarCanvas from '../AvatarCanvas';

export default function ProfileModal({ onClose }) {
  const { currentUser, checkAuth, logout } = useAuth();
  const [tab, setTab] = useState('profile');
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [link, setLink] = useState(currentUser?.link || '');
  const [signature, setSignature] = useState(currentUser?.signature || '');

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
        <h2><i className="fa-solid fa-user-gear"></i> User Settings</h2>
        <div className="modal-tabs">
          <button className={`tab-btn ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
            <i className="fa-solid fa-user"></i> Profile
          </button>
          <button className={`tab-btn ${tab === 'avatar' ? 'active' : ''}`} onClick={() => setTab('avatar')}>
            <i className="fa-solid fa-image"></i> Avatar
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
              <label>External Link (Social / Website)</label>
              <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" />
            </div>
            <div className="form-group">
              <label>Forum Signature</label>
              <textarea rows="3" value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Appears below your posts..." />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <i className="fa-solid fa-floppy-disk"></i> Save Changes
            </button>
          </form>
        )}

        {tab === 'avatar' && (
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Select an image, adjust crop/scale using the canvas, and save. Exported as WebP.
            </p>
            <AvatarCanvas onUploadSuccess={handleAvatarUpload} />
          </div>
        )}

        {tab === 'danger' && (
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--accent-danger)', marginBottom: '1rem' }}>
              Warning: Deleting your account is permanent and clears all your profile data.
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
}
