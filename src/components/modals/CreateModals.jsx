import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import { MarkdownToolbar } from '../MarkdownToolbar';
import { filterValue } from '../../lib/safeFilter';
import { checkContent } from '../../lib/moderator';

// ============================================================================
// CREATE CATEGORY MODAL (WITH AUTO-DEFAULT SUBCATEGORY)
// ============================================================================
export const CreateCategoryModal = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [subName, setSubName] = useState('General Discussion');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Create Main Category
      const cat = await apiFetch('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: filterValue(name) })
      });

      // 2. Automatically create a default subcategory so it's ready immediately
      if (cat && cat.id) {
        await apiFetch('/api/subcategories', {
          method: 'POST',
          body: JSON.stringify({
          categoryId: cat.id,
          name: filterValue(subName || 'General Discussion'),
          description: `Discussion for ${filterValue(name)}`,
          isAnnouncement: false
          })
        });
      }

      setName('');
      setSubName('General Discussion');
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <h2><i className="fa-solid fa-folder-plus"></i> Create Category</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Category Name</label>
            <input 
              type="text" 
              placeholder="e.g. Community, Support, News" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Initial Subcategory Name</label>
            <input 
              type="text" 
              placeholder="e.g. General Discussion" 
              value={subName} 
              onChange={(e) => setSubName(e.target.value)} 
              required 
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><i className="fa-solid fa-check"></i> Create Category</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// CREATE SUBCATEGORY MODAL (WITH TICKET & BUG REPORT SUPPORT)
// ============================================================================
export const CreateSubcategoryModal = ({ isOpen, categoryId, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [isTicket, setIsTicket] = useState(false);
  const [ticketType, setTicketType] = useState('support');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !categoryId) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/subcategories', {
        method: 'POST',
        body: JSON.stringify({ 
          categoryId, 
          name: filterValue(name), 
          description: filterValue(description), 
          isAnnouncement,
          isTicket,
          ticketType: isTicket ? ticketType : null
        })
      });
      setName('');
      setDescription('');
      setIsAnnouncement(false);
      setIsTicket(false);
      setTicketType('support');
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <h2><i className="fa-solid fa-comments"></i> Create Subcategory</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Subcategory Name</label>
            <input 
              type="text" 
              placeholder="e.g. Bug Reports, Support Tickets, Off-Topic" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea 
              rows="3" 
              placeholder="Brief description of this section..." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          {/* Announcement Option */}
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="checkbox" 
              id="subIsAnnouncement" 
              checked={isAnnouncement} 
              onChange={(e) => {
                setIsAnnouncement(e.target.checked);
                if (e.target.checked) setIsTicket(false);
              }} 
              style={{ width: 'auto' }} 
            />
            <label htmlFor="subIsAnnouncement" style={{ marginBottom: 0 }}>Restricted (Announcements Only)</label>
          </div>

          {/* Ticket Option */}
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="checkbox" 
              id="subIsTicket" 
              checked={isTicket} 
              onChange={(e) => {
                setIsTicket(e.target.checked);
                if (e.target.checked) setIsAnnouncement(false);
              }} 
              style={{ width: 'auto' }} 
            />
            <label htmlFor="subIsTicket" style={{ marginBottom: 0 }}>Private Ticket Subcategory</label>
          </div>

          {/* Ticket Type Selector */}
          {isTicket && (
            <div className="form-group" style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
              <label>Ticket Access Control Level</label>
              <select 
                value={ticketType} 
                onChange={(e) => setTicketType(e.target.value)}
              >
                <option value="support">General Support (Trial Staff+ Access)</option>
                <option value="bug">Bug Report (Jr. Developer+ Access)</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><i className="fa-solid fa-check"></i> Create Subcategory</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// CREATE THREAD / TICKET MODAL (DYNAMIC BUG & SUPPORT FIELDS)
// ============================================================================
export const CreateThreadModal = ({ isOpen, subcategory, subcategoryId, onClose, onSuccess }) => {
  // Shared States
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Bug Report Specific States
  const [mcUsername, setMcUsername] = useState('');
  const [mcVersion, setMcVersion] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [evidence, setEvidence] = useState('');

  // Support Ticket Specific States
  const [supportDescription, setSupportDescription] = useState('');

  // --------------------------------------------------------------------------
  // SMART TYPE DETECTION (DB FLAGS + NAME FALLBACK)
  // --------------------------------------------------------------------------
  const targetSubId = subcategory?.id || subcategoryId;
  const subName = (subcategory?.name || '').toLowerCase();
  const ticketType = (subcategory?.ticketType || subcategory?.ticket_type || '').toLowerCase();
  const isTicketFlag = Boolean(subcategory?.isTicket || subcategory?.is_ticket);

  // Detects Bug Report via DB flag OR subcategory name
  const isBugReport = 
    (isTicketFlag && ticketType === 'bug') || 
    subName.includes('bug');

  // Detects Support Ticket via DB flag OR subcategory name
  const isSupportTicket = 
    !isBugReport && (
      isTicketFlag || 
      subName.includes('support') || 
      subName.includes('ticket')
    );

  const isTicket = isBugReport || isSupportTicket;

  // Clear fields whenever modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setContent('');
      setMcUsername('');
      setMcVersion('');
      setBugDescription('');
      setEvidence('');
      setSupportDescription('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !targetSubId) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let finalContent = content;

    if (isBugReport) {
      finalContent = `**Minecraft Username:** ${filterValue(mcUsername.trim())}
**Minecraft Version:** ${filterValue(mcVersion.trim())}

---

### 🐛 Bug Description
${filterValue(bugDescription.trim())}

---

### 📷 Evidence
${filterValue(evidence.trim())}`;
    } else if (isSupportTicket) {
      finalContent = filterValue(supportDescription.trim());
    }

    const safeTitle = filterValue(title.trim());
    finalContent = filterValue(finalContent);

    const safeContent = await checkContent(finalContent);
    if (safeContent === null) {
      setLoading(false);
      return;
    }

    try {
      await apiFetch(`/api/subcategories/${targetSubId}/threads`, {
        method: 'POST',
        body: JSON.stringify({ 
          title: safeTitle, 
          content: safeContent 
        })
      });

      onSuccess();
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to submit thread.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" style={{ maxWidth: isBugReport ? '650px' : '550px' }}>
        <h2>
          <i className={`fa-solid ${isBugReport ? 'fa-bug' : isSupportTicket ? 'fa-headset' : 'fa-pen-to-square'}`}></i>{' '}
          {isBugReport ? 'Submit Bug Report' : isSupportTicket ? 'Open Support Ticket' : 'Create New Thread'}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Title Field */}
          <div className="form-group">
            <label>Title</label>
            <input 
              type="text" 
              placeholder={
                isBugReport ? "Brief summary of the bug..." : 
                isSupportTicket ? "Brief summary of your issue..." : 
                "Enter thread title..."
              }
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
            />
          </div>

          {/* 🐛 BUG REPORT FIELDS */}
          {isBugReport && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Minecraft Username</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Steve" 
                    value={mcUsername} 
                    onChange={(e) => setMcUsername(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Minecraft Version</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 1.20.4, Lunar Client" 
                    value={mcVersion} 
                    onChange={(e) => setMcVersion(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group md-textarea-container">
                <label>Bug Description (Markdown Supported)</label>
                <MarkdownToolbar targetId="bugDescriptionModal" />
                <textarea 
                  id="bugDescriptionModal" 
                  rows="4" 
                  placeholder="Describe how to reproduce the bug step-by-step..." 
                  value={bugDescription} 
                  onChange={(e) => setBugDescription(e.target.value)} 
                  required 
                ></textarea>
              </div>

              <div className="form-group">
                <label>Evidence</label>
                <textarea 
                  rows="2" 
                  placeholder="Provide links to screenshots, Imgur, or YouTube videos..." 
                  value={evidence} 
                  onChange={(e) => setEvidence(e.target.value)} 
                  required 
                ></textarea>
              </div>
            </>
          )}

          {/* 🎧 SUPPORT TICKET FIELDS */}
          {isSupportTicket && (
            <div className="form-group md-textarea-container">
              <label>Description (Markdown Supported)</label>
              <MarkdownToolbar targetId="supportDescriptionModal" />
              <textarea 
                id="supportDescriptionModal" 
                rows="6" 
                placeholder="Explain your problem or inquiry in detail so staff can assist you..." 
                value={supportDescription} 
                onChange={(e) => setSupportDescription(e.target.value)} 
                required 
              ></textarea>
            </div>
          )}

          {/* 💬 REGULAR THREAD FIELDS */}
          {!isTicket && (
            <div className="form-group md-textarea-container">
              <label>Content (Markdown Supported)</label>
              <MarkdownToolbar targetId="threadContent" />
              <textarea 
                id="threadContent" 
                rows="6" 
                placeholder="Write thread details here..." 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                maxLength={2000}
                required 
              ></textarea>
              <span className="char-count">{content.length}/2000</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <><i className="fa-solid fa-spinner fa-spin"></i> Submitting...</>
              ) : (
                <><i className="fa-solid fa-paper-plane"></i> {isTicket ? 'Submit Ticket' : 'Post Thread'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};