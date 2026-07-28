import React, { useState, useRef } from 'react';
import { apiFetch } from '../../api';
import MarkdownToolbar from '../MarkdownToolbar';

export function CreateCategoryModal({ onClose }) {
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/categories', { method: 'POST', body: JSON.stringify({ name }) });
      onClose();
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Create Main Category</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Category Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CreateSubcategoryModal({ parentCategoryId, onClose }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/subcategories', {
        method: 'POST',
        body: JSON.stringify({ categoryId: parentCategoryId, name, description, isAnnouncement })
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
        <h2>Create Subcategory</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Subcategory Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows="3" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={isAnnouncement}
              onChange={(e) => setIsAnnouncement(e.target.checked)}
              style={{ width: 'auto' }}
            />
            <label style={{ marginBottom: 0 }}>Restricted (Announcements Only)</label>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Subcategory</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CreateThreadModal({ subcategoryId, onClose }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/subcategories/${subcategoryId}/threads`, {
        method: 'POST',
        body: JSON.stringify({ title, content })
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
        <h2>Create New Thread</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Thread Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
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
            <button type="submit" className="btn btn-primary">Post Thread</button>
          </div>
        </form>
      </div>
    </div>
  );
}
