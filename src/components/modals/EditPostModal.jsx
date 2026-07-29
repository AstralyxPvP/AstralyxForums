import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import { MarkdownToolbar } from '../MarkdownToolbar';

export const EditPostModal = ({ isOpen, threadId, postId, initialContent, onClose, onSuccess }) => {
  const [content, setContent] = useState('');

  useEffect(() => {
    setContent(initialContent || '');
  }, [initialContent]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/threads/${threadId}/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify({ content })
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2><i className="fa-solid fa-pen-to-square"></i> Edit Content</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group md-textarea-container">
            <label>Content (Markdown Supported)</label>
            <MarkdownToolbar targetId="editPostContentInput" />
            <textarea id="editPostContentInput" rows="6" value={content} onChange={(e) => setContent(e.target.value)} required></textarea>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><i className="fa-solid fa-check"></i> Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};
