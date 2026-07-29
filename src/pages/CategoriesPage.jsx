import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import { CreateCategoryModal, CreateSubcategoryModal } from '../components/modals/CreateModals';

export const CategoriesPage = ({ onSelectSubcategory }) => {
  const { canManageCategories } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [selectedCatForSub, setSelectedCatForSub] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/categories');
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDeleteCat = async (id) => {
    if (!confirm('Delete entire category?')) return;
    try {
      await apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
      fetchCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSub = async (id) => {
    if (!confirm('Delete subcategory?')) return;
    try {
      await apiFetch(`/api/subcategories/${id}`, { method: 'DELETE' });
      fetchCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '0.85rem' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }}></i> Loading network categories...
      </div>
    );
  }

  return (
    <div>
      {canManageCategories() && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setIsCatModalOpen(true)}>
            <i className="fa-solid fa-plus"></i> Create Category
          </button>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="forum-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '0.85rem' }}>
            No category nodes available yet.
          </p>
        </div>
      ) : (
        categories.map((cat) => (
          <div key={cat.id} className="category-section">
            <div className="category-title">
              <span>
                <i className="fa-solid fa-folder" style={{ color: 'var(--accent-red)', marginRight: '0.5rem' }}></i> {cat.name}
              </span>
              {canManageCategories() && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-xs btn-warning" onClick={() => setSelectedCatForSub(cat.id)}>
                    <i className="fa-solid fa-plus"></i> Subcategory
                  </button>
                  <button className="btn btn-xs btn-danger" onClick={() => handleDeleteCat(cat.id)}>
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              )}
            </div>

            {cat.subcategories && cat.subcategories.map((sub) => (
              <div key={sub.id} className="forum-card" onClick={() => onSelectSubcategory(sub.id, sub.name)}>
                <div className="forum-info">
                  <h3>
                    <i className="fa-solid fa-comments"></i> {sub.name}{' '}
                    {sub.isAnnouncement && (
                      <span
                        className="role-badge"
                        style={{
                          fontSize: '0.65rem',
                          background: 'rgba(251, 191, 36, 0.15)',
                          color: 'var(--accent-gold)',
                          border: '1px solid rgba(251, 191, 36, 0.4)',
                          marginLeft: '0.5rem',
                          padding: '2px 6px'
                        }}
                      >
                        <i className="fa-solid fa-bullhorn" style={{ marginRight: '0.25rem' }}></i> Announcements
                      </span>
                    )}
                  </h3>
                  <p>{sub.description || `Discuss topics related to ${sub.name}`}</p>
                </div>
                {canManageCategories() && (
                  <button
                    className="btn btn-xs btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSub(sub.id);
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

      <CreateCategoryModal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} onSuccess={fetchCategories} />
      <CreateSubcategoryModal
        isOpen={!!selectedCatForSub}
        categoryId={selectedCatForSub}
        onClose={() => setSelectedCatForSub(null)}
        onSuccess={fetchCategories}
      />
    </div>
  );
};