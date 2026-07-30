import React, { useState } from 'react';
import { apiFetch } from '../api';
import { MarkdownToolbar } from '../components/MarkdownToolbar';

export const TicketSubmissionForm = ({ subcategory, onSuccess, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  // For Bug Reports, we might want specific fields
  const [bugReproduce, setBugReproduce] = useState('');
  const [bugExpected, setBugExpected] = useState('');

  const isBugReport = subcategory?.ticketType === 'bug';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    let finalContent = content;
    if (isBugReport) {
      finalContent = `### Bug Description\n${content}\n\n### How to Reproduce\n${bugReproduce}\n\n### Expected Behavior\n${bugExpected}`;
    }

    try {
      const res = await apiFetch(`/api/subcategories/${subcategory.id}/threads`, {
        method: 'POST',
        body: JSON.stringify({ title, content: finalContent })
      });
      onSuccess(res.id, title);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forum-card" style={{ padding: '2rem' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
        <i className={`fa-solid ${isBugReport ? 'fa-bug' : 'fa-headset'}`} style={{ color: 'var(--accent-red)', marginRight: '0.75rem' }}></i>
        Open a {isBugReport ? 'Bug Report' : 'Support Ticket'}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Ticket Subject</label>
          <input 
            type="text" 
            placeholder={isBugReport ? "Brief summary of the bug..." : "What do you need help with?"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group md-textarea-container">
          <label>{isBugReport ? 'Description' : 'Detailed Message'}</label>
          <MarkdownToolbar targetId="ticketContent" />
          <textarea
            id="ticketContent"
            rows="6"
            placeholder="Please provide as much detail as possible..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        {isBugReport && (
          <>
            <div className="form-group">
              <label>Steps to Reproduce</label>
              <textarea
                rows="3"
                placeholder="1. Go to... 2. Click... 3. See error..."
                value={bugReproduce}
                onChange={(e) => setBugReproduce(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Expected Behavior</label>
              <textarea
                rows="2"
                placeholder="What should have happened instead?"
                value={bugExpected}
                onChange={(e) => setBugExpected(e.target.value)}
                required
              />
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
            {loading ? <><i className="fa-solid fa-spinner fa-spin"></i> Submitting...</> : <><i className="fa-solid fa-paper-plane"></i> Submit Ticket</>}
          </button>
          <button type="button" className="btn" onClick={onCancel} disabled={loading}>Cancel</button>
        </div>
        
        <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-code)', textAlign: 'center' }}>
          <i className="fa-solid fa-shield-halved"></i> Only you and authorized staff can see this ticket.
        </p>
      </form>
    </div>
  );
};
