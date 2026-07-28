import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';

export default function CategoriesPage({ onOpenCategoryModal, onOpenSubcategoryModal }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { canManageCategories } = useAuth();
  const navigate = useNavigate();

  const fetchCategories = async () => {
    try {
      const data = await apiFetch('/api/categories');
      setCategories(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this entire category?')) return;
    try {
      await apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
      fetchCategories();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteSubcategory = async (id) => {
    if (!window.confirm('Delete this subcategory?')) return;
    try {
      await apiFetch(`/api/subcategories/${id}`, { method: 'DELETE' });
      fetchCategories();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}><i className="fa-solid fa-spinner fa-spin"></i> Loading categories...</p>;

  return (
    <div>
      {canManageCategories() && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button className="btn btn-primary btn-sm" onClick={onOpenCategoryModal}>
            <i className="fa-solid fa-plus"></i> Create Category
          </button>
        </div>
      )}

      {categories.length === 0 ? (
        <p style={{ textAlign: 'center' }}>No categories available yet.</p>
      ) : (
        categories.map((cat) => (
          <div key={cat.id} className="category-section">
            <div className="category-title">
              <span><i className="fa-solid fa-folder"></i> {cat.name}</span>
              {canManageCategories() && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-sm" onClick={() => onOpenSubcategoryModal(cat.id)}>
                    <i className="fa-solid fa-plus"></i> Subcategory
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteCategory(cat.id)}>
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              )}
            </div>

            {cat.subcategories.map((sub) => (
              <div
                key={sub.id}
                className="forum-card"
                onClick={() => navigate(`/forum/${sub.id}`)}
              >
                <div className="forum-info">
                  <h3>
                    <i className="fa-solid fa-comments"></i> {sub.name}
                    {sub.isAnnouncement && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', marginLeft: '0.5rem' }}>
                        <i className="fa-solid fa-bullhorn"></i> Announcements
                      </span>
                    )}
                  </h3>
                  <p>{sub.description || `Discuss topics related to ${sub.name}`}</p>
                </div>
                {canManageCategories() && (
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSubcategory(sub.id);
                    }}
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                )}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
