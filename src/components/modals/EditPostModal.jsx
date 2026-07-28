import React, { useState, useRef } from 'react';
import { apiFetch } from '../../api';
import MarkdownToolbar from '../MarkdownToolbar';

export default function EditPostModal({ data, onClose }) {
  const [content, setContent] = useState(data.content || '');
  const textareaRef = useRef(null);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/threads/${data.threadId}/posts/${data.postId}`, {
        method: 'PUT',
        body: JSON.stringify({ content })
      });
      onClose();
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2><i className="fa-solid fa-pen-to-square"></i> Edit Content</h2>
        <form onSubmit={handleSave}>
          <div className="form-group md-textarea-container">
            <label>Content (Markdown Supported)</label>
            <MarkdownToolbar textareaRef={textareaRef} />
            <textarea
              ref={textareaRef}
              rows="6"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><i className="fa-solid fa-check"></i> Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
