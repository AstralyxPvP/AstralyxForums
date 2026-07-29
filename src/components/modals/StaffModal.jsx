import React, { useState, useEffect } from 'react';
import { apiFetch, canModerateRole } from '../../api';
import { useAuth } from '../../context/AuthContext';

export const StaffModal = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && tab === 'users') searchUsers();
    if (isOpen && tab === 'reports') loadReports();
    if (isOpen && tab === 'logs') loadLogs();
  }, [isOpen, tab]);

  if (!isOpen) return null;

  const searchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/admin/users?query=${encodeURIComponent(searchQuery)}`);
      setUsers(data);
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

  const handleModAction = async (userId, action, extraParams = {}) => {
    let bodyData = { action, ...extraParams };

    if (action === 'ban') {
      const reason = prompt('Enter reason for banning user:') || 'Violation of rules';
      bodyData.reason = reason;
    }
    if (action === 'unban') {
      if (!confirm('Unban this user?')) return;
    }
    if (action === 'mute') {
      const reason = prompt('Enter mute reason:') || 'Violation of rules';
      const duration = prompt('Mute duration in minutes (leave blank for permanent):', '60');
      bodyData.reason = reason;
      if (duration && !isNaN(duration)) bodyData.durationMinutes = parseInt(duration);
    }
    if (action === 'unmute') {
      if (!confirm('Unmute this user?')) return;
    }
    if (action === 'warn') {
      const reason = prompt('Enter warning reason:') || 'Violation of guidelines';
      bodyData.reason = reason;
    }
    if (action === 'resetPass') {
      if (!confirm("Generate a new password and dispatch it directly to the user's email address?")) return;
    }
    if (action === 'delete') {
      if (!confirm('PERMANENT ACTION: Permanently delete this user account and credentials?')) return;
      bodyData.reason = prompt('Deletion reason:') || 'Staff account purge';
    }

    try {
      const res = await apiFetch(`/api/admin/users/${userId}/action`, {
        method: 'POST',
        body: JSON.stringify(bodyData)
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
      <div className="modal" style={{ maxWidth: '850px' }}>
        <h2><i className="fa-solid fa-user-shield"></i> ModView Panel</h2>
        <div className="modal-tabs">
          <button className={`tab-btn ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
            <i className="fa-solid fa-users-gear"></i> ModView Directory
          </button>
          <button className={`tab-btn ${tab === 'reports' ? 'active' : ''}`} onClick={() => setTab('reports')}>
            <i className="fa-solid fa-flag"></i> Reports
          </button>
          <button className={`tab-btn ${tab === 'logs' ? 'active' : ''}`} onClick={() => setTab('logs')}>
            <i className="fa-solid fa-clock-rotate-left"></i> Audit Logs (28d)
          </button>
        </div>

        {tab === 'users' && (
          <div>
            <div className="form-group" style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Search user by display name, username, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyUp={(e) => e.key === 'Enter' && searchUsers()}
              />
              <button className="btn btn-primary" onClick={searchUsers}>
                <i className="fa-solid fa-magnifying-glass"></i> Search
              </button>
            </div>

            <div style={{ marginTop: '1rem', maxHeight: '480px', overflowY: 'auto' }}>
              {loading ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Loading ModView directory...</p>
              ) : users.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No matching users found.</p>
              ) : (
                users.map((u) => {
                  const isHigherOrEqual = !canModerateRole(currentUser.roleTag, u.roleTag) && currentUser.id !== u.id;

                  return (
                    <div key={u.id} className="mod-card">
                      <div className="mod-card-header">
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {u.displayName} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.85rem' }}>(@{u.username})</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Email: <strong>{u.email}</strong> • Last IP: <code>{u.lastIp || 'N/A'}</code>
                          </div>
                          <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                            <span className={`role-badge role-${u.role}`}>{u.roleTag || u.role}</span>
                            {u.isBanned && <span className="status-badge badge-banned"><i className="fa-solid fa-ban"></i> Banned</span>}
                            {u.isMuted && <span className="status-badge badge-muted"><i className="fa-solid fa-volume-xmark"></i> Muted</span>}
                          </div>
                          {u.isBanned && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--accent-danger)', marginTop: '0.2rem' }}>
                              <i className="fa-solid fa-circle-exclamation"></i> Ban Reason: {u.banReason || 'None specified'}
                            </div>
                          )}
                          {u.isMuted && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--accent-pink)', marginTop: '0.2rem' }}>
                              <i className="fa-solid fa-clock"></i> Muted Until: {u.mutedUntil ? new Date(u.mutedUntil).toLocaleString() : 'Indefinite'} ({u.muteReason || 'No reason'})
                            </div>
                          )}
                        </div>
                      </div>

                      {u.warnings && u.warnings.length > 0 && (
                        <div style={{ marginTop: '0.6rem' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '0.3rem' }}>
                            Warning History ({u.warnings.length}):
                          </div>
                          {u.warnings.map((w, idx) => (
                            <div key={idx} className="warning-item">
                              <span>#{idx + 1} "{w.reason}" - <em>{w.issuedBy || 'Staff'}</em> ({new Date(w.date).toLocaleDateString()})</span>
                              {!isHigherOrEqual && (
                                <button
                                  className="btn btn-sm btn-danger"
                                  style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}
                                  onClick={() => handleModAction(u.id, 'unwarn', { warningIndex: idx })}
                                >
                                  <i className="fa-solid fa-xmark"></i>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mod-actions-grid">
                        {isHigherOrEqual ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <i className="fa-solid fa-lock"></i> Equal/Higher Rank (Protected)
                          </span>
                        ) : (
                          <>
                            <button className="btn btn-sm btn-warning" onClick={() => handleModAction(u.id, 'warn')}>
                              <i className="fa-solid fa-triangle-exclamation"></i> Warn
                            </button>
                            {u.warnings && u.warnings.length > 0 && (
                              <button className="btn btn-sm" onClick={() => handleModAction(u.id, 'unwarn')}>
                                <i className="fa-solid fa-rotate-left"></i> Remove Latest Warn
                              </button>
                            )}
                            {u.isMuted ? (
                              <button className="btn btn-sm btn-warning" onClick={() => handleModAction(u.id, 'unmute')}>
                                <i className="fa-solid fa-volume-high"></i> Unmute
                              </button>
                            ) : (
                              <button className="btn btn-sm btn-warning" onClick={() => handleModAction(u.id, 'mute')}>
                                <i className="fa-solid fa-volume-xmark"></i> Mute
                              </button>
                            )}
                            {u.isBanned ? (
                              <button className="btn btn-sm btn-danger" onClick={() => handleModAction(u.id, 'unban')}>
                                <i className="fa-solid fa-user-check"></i> Unban
                              </button>
                            ) : (
                              <button className="btn btn-sm btn-danger" onClick={() => handleModAction(u.id, 'ban')}>
                                <i className="fa-solid fa-ban"></i> Ban
                              </button>
                            )}
                            <button className="btn btn-sm" onClick={() => handleModAction(u.id, 'resetPass')}>
                              <i className="fa-solid fa-key"></i> Reset Pass & Email
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleModAction(u.id, 'delete')}>
                              <i className="fa-solid fa-trash"></i> Delete Account
                            </button>
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
              reports.map((r) => {
                const canProcess = canModerateRole(currentUser.roleTag, r.reportedUserRoleTag || 'Member');
                return (
                  <div key={r.id} className="mod-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--accent-gold)' }}>Reported by <strong>{r.reporterName}</strong></div>
                        <div style={{ fontWeight: 600, margin: '0.3rem 0' }}>Reason: "{r.reason}"</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Target Rank: {r.reportedUserRoleTag || 'Member'} • {new Date(r.createdAt).toLocaleString()}</div>
                      </div>
                      <div>
                        {canProcess ? (
                          <button className="btn btn-sm btn-danger" onClick={() => handleDismissReport(r.id)}>
                            <i className="fa-solid fa-check"></i> Dismiss / Resolve
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}><i className="fa-solid fa-shield"></i> Protected</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === 'logs' && (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loading ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Loading audit logs...</p>
            ) : logs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No audit logs recorded in 28 days.</p>
            ) : (
              logs.map((l) => (
                <div key={l.id} style={{ padding: '0.6rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                  <div><strong>{l.actorName}</strong> performed <code>{l.action}</code> on <code>{l.targetType}:{l.targetId}</code></div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(l.timestamp).toLocaleString()} • Details: {JSON.stringify(l.details)}</div>
                </div>
              ))
            )}
          </div>
        )}

        <button type="button" className="btn btn-sm" style={{ width: '100%', marginTop: '1.5rem' }} onClick={onClose}>
          Close ModView
        </button>
      </div>
    </div>
  );
};
