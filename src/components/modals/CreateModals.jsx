import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import { MarkdownToolbar } from '../MarkdownToolbar';

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
        body: JSON.stringify({ name })
      });

      // 2. Automatically create a default subcategory so it's ready immediately
      if (cat && cat.id) {
        await apiFetch('/api/subcategories', {
          method: 'POST',
          body: JSON.stringify({
            categoryId: cat.id,
            name: subName || 'General Discussion',
            description: `Discussion for ${name}`,
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
// CREATE SUBCATEGORY MODAL (WITH BACKDROP & ESCAPE CLOSE)
// ============================================================================
export const CreateSubcategoryModal = ({ isOpen, categoryId, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Guard: Do NOT render if modal is closed OR if categoryId is missing
  if (!isOpen || !categoryId) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/subcategories', {
        method: 'POST',
        body: JSON.stringify({ categoryId, name, description, isAnnouncement })
      });
      setName('');
      setDescription('');
      setIsAnnouncement(false);
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
              placeholder="e.g. Bug Reports, Off-Topic" 
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
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="checkbox" 
              id="subIsAnnouncement" 
              checked={isAnnouncement} 
              onChange={(e) => setIsAnnouncement(e.target.checked)} 
              style={{ width: 'auto' }} 
            />
            <label htmlFor="subIsAnnouncement" style={{ marginBottom: 0 }}>Restricted (Announcements Only)</label>
          </div>
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
// CREATE THREAD MODAL
// ============================================================================
export const CreateThreadModal = ({ isOpen, subcategoryId, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !subcategoryId) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/subcategories/${subcategoryId}/threads`, {
        method: 'POST',
        body: JSON.stringify({ title, content })
      });
      setTitle('');
      setContent('');
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
        <h2><i className="fa-solid fa-pen-to-square"></i> Create New Thread</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Thread Title</label>
            <input 
              type="text" 
              placeholder="Enter thread title..." 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group md-textarea-container">
            <label>Content (Markdown Supported)</label>
            <MarkdownToolbar targetId="threadContent" />
            <textarea 
              id="threadContent" 
              rows="6" 
              placeholder="Write thread details here..." 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              required 
            ></textarea>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><i className="fa-solid fa-paper-plane"></i> Post Thread</button>
          </div>
        </form>
      </div>
    </div>
  );
};
