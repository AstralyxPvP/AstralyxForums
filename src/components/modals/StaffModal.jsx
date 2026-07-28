import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api';

export default function StaffModal({ onClose }) {
  const { staffSendResetEmail, staffResetUserPassword, isStaff } = useAuth();

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'logs'
  
  // User Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Manual Password Overwrite State
  const [newPassword, setNewPassword] = useState('');

  // Search for a user by username, email, or ID
  const handleUserSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setFoundUser(null);
    try {
      const res = await apiFetch(`/api/staff/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.user) {
        setFoundUser(res.user);
      } else {
        alert('User not found.');
      }
    } catch (err) {
      alert('Search failed: ' + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  // Force send a reset email to the searched user
  const handleForceResetEmail = async () => {
    if (!foundUser?.email) return alert('No valid email found for this user.');
    if (window.confirm(`Send password reset email to ${foundUser.email}?`)) {
      await staffSendResetEmail(foundUser.email);
    }
  };

  // Directly overwrite the searched user's password
  const handleDirectPasswordReset = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      return alert('Password must be at least 6 characters long.');
    }
    if (window.confirm(`Force update password for user "${foundUser.displayName || foundUser.username}"?`)) {
      await staffResetUserPassword(foundUser.id, newPassword);
      setNewPassword('');
    }
  };

  if (!isStaff()) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <h2>Access Denied</h2>
          <p>You do not have staff permissions to view this panel.</p>
          <button className="btn btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '650px' }}>
        <h2>
          <i className="fa-solid fa-user-shield"></i> Staff Panel
        </h2>

        {/* Navigation Tabs */}
        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="fa-solid fa-users-gear"></i> User Management
          </button>
          <button
            className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <i className="fa-solid fa-list-check"></i> Audit Logs
          </button>
        </div>

        {/* TAB 1: USER MANAGEMENT & PASSWORD RESETS */}
        {activeTab === 'users' && (
          <div>
            <form onSubmit={handleUserSearch} style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                Find User Account
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Username, Email, or User ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  required
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary" disabled={isSearching}>
                  <i className="fa-solid fa-magnifying-glass"></i> Search
                </button>
              </div>
            </form>

            {foundUser && (
              <div className="card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>{foundUser.displayName || foundUser.username}</h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Email: <strong>{foundUser.email}</strong> | Role: <strong>{foundUser.roleTag || 'Member'}</strong>
                  </p>
                </div>

                <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '1rem 0' }} />

                {/* Password Management */}
                <h4 style={{ marginBottom: '0.75rem' }}>
                  <i className="fa-solid fa-key"></i> Password Management
                </h4>

                {/* Send Password Reset Link */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                    onClick={handleForceResetEmail}
                  >
                    <i className="fa-solid fa-paper-plane"></i> Send Password Reset Email
                  </button>
                </div>

                {/* Direct Password Overwrite */}
                <form onSubmit={handleDirectPasswordReset}>
                  <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>
                    Set New Password Manually
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="password"
                      placeholder="New temporary password..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                      style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-danger">
                      <i className="fa-solid fa-arrows-rotate"></i> Overwrite
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Staff actions are automatically dispatched to the server logs.
            </p>
          </div>
        )}

        {/* Modal Close Button */}
        <button
          type="button"
          className="btn btn-sm"
          style={{ width: '100%', marginTop: '1.5rem' }}
          onClick={onClose}
        >
          Close Panel
        </button>
      </div>
    </div>
  );
}
