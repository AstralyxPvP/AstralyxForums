import React, { useState, useEffect } from 'react';
import { apiFetch, canModerateRole } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function StaffModal({ onClose }) {
  const [tab, setTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [reports, setReports] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const searchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/admin/users?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/admin/reports');
      setReports(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/admin/logs');
      setLogs(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'reports') loadReports();
    if (tab === 'logs') loadLogs();
  }, [tab]);

  const handleUserAction = async (userId, action) => {
    const reason = prompt(`Enter reason for ${action}:`) || 'Staff moderation action';
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/action`, {
        method: 'POST',
        body: JSON.stringify({ action, reason })
      });
      alert(res.message);
      searchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDismissReport = async (reportId) => {
    try {
      await apiFetch(`/api/admin/reports/${reportId}`, { method: 'DELETE' });
      loadReports();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '800px' }}>
        <h2><i className="fa-solid fa-user-shield"></i> Staff Control Panel</h2>
        <div className="modal-tabs">
          <button className={`tab-btn ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
            <i className="fa-solid fa-users"></i> Users
          </button>
          <button className={`tab-btn ${tab === 'reports' ? 'active' : ''}`} onClick={() => setTab('reports')}>
            <i className="fa-solid fa-flag"></i> Reports
          </button>
          <button className={`tab-btn ${tab === 'logs' ? 'active' : ''}`} onClick={() => setTab('logs')}>
            <i className="fa-solid fa-clock-rotate-left"></i> Audit Logs
          </button>
        </div>

        {tab === 'users' && (
          <div>
            <div className="form-group" style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Search user by display or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-primary" onClick={searchUsers}>
                <i className="fa-solid fa-magnifying-glass"></i> Search
              </button>
            </div>
            <div style={{ marginTop: '1rem' }}>
              {loading ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Searching users...</p>
              ) : searchResults.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No users found.</p>
              ) : (
                searchResults.map((u) => {
                  const isHigherOrEqual = !canModerateRole(currentUser?.roleTag, u.roleTag) && currentUser?.id !== u.id;
                  return (
                    <div key={u.id} className="user-card">
                      <div>
                        <div style={{ fontWeight: 700 }}>
                          {u.displayName} (@{u.username}) {u.isBanned && <span style={{ color: 'var(--accent-danger)' }}>[BANNED]</span>}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Role: {u.roleTag}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        {isHigherOrEqual ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.3rem' }}>Higher/Equal Rank</span>
                        ) : (
                          <>
                            <button className="btn btn-sm btn-warning" onClick={() => handleUserAction(u.id, 'warn')}>Warn</button>
                            <button className="btn btn-sm" onClick={() => handleUserAction(u.id, 'kick')}>Kick</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleUserAction(u.id, 'ban')}>Ban</button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {tab === 'reports' && (
          <div>
            {loading ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Loading reports...</p>
            ) : reports.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No active reports.</p>
            ) : (
              reports.map((r) => (
                <div key={r.id} className="user-card">
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent-gold)' }}>Reported by {r.reporterName}</div>
                    <div style={{ fontWeight: 600, margin: '0.2rem 0' }}>Reason: "{r.reason}"</div>
                  </div>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDismissReport(r.id)}>Dismiss</button>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'logs' && (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loading ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Loading audit logs...</p>
            ) : logs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No audit logs recorded.</p>
            ) : (
              logs.map((l, index) => (
                <div key={index} style={{ padding: '0.6rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                  <div><strong>{l.actorName}</strong> performed <code>{l.action}</code></div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(l.timestamp).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        )}

        <button type="button" className="btn btn-sm" style={{ width: '100%', marginTop: '1.5rem' }} onClick={onClose}>
          Close Panel
        </button>
      </div>
    </div>
  );
}
