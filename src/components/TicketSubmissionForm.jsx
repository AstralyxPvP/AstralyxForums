import React, { useState } from 'react';
import { apiFetch } from '../api';
import { MarkdownToolbar } from './MarkdownToolbar';
import { filterValue } from '../lib/safeFilter';
import { checkContent } from '../lib/moderator';

export const TicketSubmissionForm = ({ subcategory, onSuccess, onCancel }) => {
  const isBugReport = subcategory?.ticketType === 'bug';

  // Common State
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  // Bug Report Specific State
  const [mcUsername, setMcUsername] = useState('');
  const [mcVersion, setMcVersion] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [evidence, setEvidence] = useState('');

  // Support Ticket Specific State
  const [supportDescription, setSupportDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Format content into clean Markdown based on ticket type
    let formattedContent = '';

    if (isBugReport) {
      formattedContent = `**Minecraft Username:** ${filterValue(mcUsername.trim())}
**Minecraft Version:** ${filterValue(mcVersion.trim())}

---

### 🐛 Bug Description
${filterValue(bugDescription.trim())}

---

### 📷 Evidence
${filterValue(evidence.trim())}`;
    } else {
      formattedContent = filterValue(supportDescription.trim());
    }

    const safeContent = await checkContent(formattedContent);
    if (safeContent === null) {
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch(`/api/subcategories/${subcategory.id}/threads`, {
        method: 'POST',
        body: JSON.stringify({
          title: filterValue(title.trim()),
          content: safeContent,
          isTicket: true
        })
      });

      if (onSuccess) {
        onSuccess(res.id, res.title);
      }
    } catch (err) {
      alert(err.message || 'Failed to submit ticket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forum-card" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <i className={`fa-solid ${isBugReport ? 'fa-bug' : 'fa-headset'}`} style={{ fontSize: '1.5rem', color: isBugReport ? '#ef4444' : '#60a5fa' }}></i>
        <div>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '1.25rem' }}>
            {isBugReport ? 'Submit Bug Report' : 'Open Support Ticket'}
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-code)' }}>
            Please complete all required fields below.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Ticket Title */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem' }}>
            Title <span style={{ color: 'var(--accent-red)' }}>*</span>
          </label>
          <input
            type="text"
            placeholder={isBugReport ? "Brief summary of the bug (e.g. Ender Pearl glitch on Skywars)" : "Brief summary of your issue"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--r-md)' }}
          />
        </div>

        {/* 🐛 BUG REPORT FIELDS */}
        {isBugReport ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem' }}>
                  Minecraft Username <span style={{ color: 'var(--accent-red)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Steve"
                  value={mcUsername}
                  onChange={(e) => setMcUsername(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--r-md)' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem' }}>
                  Minecraft Version <span style={{ color: 'var(--accent-red)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1.20.4, Lunar Client, Forge"
                  value={mcVersion}
                  onChange={(e) => setMcVersion(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--r-md)' }}
                />
              </div>
            </div>

            <div className="form-group md-textarea-container" style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem' }}>
                Bug Description <span style={{ color: 'var(--accent-red)' }}>*</span>
              </label>
              <MarkdownToolbar targetId="bugDescriptionInput" />
              <textarea
                id="bugDescriptionInput"
                rows="5"
                placeholder="Describe how to reproduce the bug step-by-step..."
                value={bugDescription}
                onChange={(e) => setBugDescription(e.target.value)}
                required
                style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--r-md)' }}
              ></textarea>
            </div>

            <div className="form-group md-textarea-container" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem' }}>
                Evidence <span style={{ color: 'var(--accent-red)' }}>*</span>
              </label>
              <textarea
                rows="3"
                placeholder="Provide links to screenshots, Imgur, or YouTube videos demonstrating the issue..."
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                required
                style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--r-md)' }}
              ></textarea>
            </div>
          </>
        ) : (
          /* 🎧 SUPPORT TICKET FIELDS */
          <div className="form-group md-textarea-container" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem' }}>
              Description <span style={{ color: 'var(--accent-red)' }}>*</span>
            </label>
            <MarkdownToolbar targetId="supportDescriptionInput" />
            <textarea
              id="supportDescriptionInput"
              rows="7"
              placeholder="Explain your problem or inquiry in detail so staff can assist you..."
              value={supportDescription}
              onChange={(e) => setSupportDescription(e.target.value)}
              required
              style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--r-md)' }}
            ></textarea>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Submitting...
              </>
            ) : (
              <>
                <i className="fa-solid fa-paper-plane"></i> Submit Ticket
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};