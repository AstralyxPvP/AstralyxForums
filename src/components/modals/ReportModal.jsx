import React, { useState } from 'react';
import { apiFetch } from '../../api';

export default function ReportModal({ data, onClose }) {
  const [reason, setReason] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify({ threadId: data.threadId, postId: data.postId, reason })
      });
      alert('Report submitted to staff team.');
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2><i className="fa-solid fa-triangle-exclamation"></i> Report Content</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Reason for reporting</label>
            <textarea
              rows="4"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this content violates guidelines..."
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-danger"><i className="fa-solid fa-paper-plane"></i> Submit Report</button>
          </div>
        </form>
      </div>
    </div>
  );
}
