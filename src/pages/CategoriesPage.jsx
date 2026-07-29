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

  if (loading) return <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}><i className="fa-solid fa-spinner fa-spin"></i> Loading categories...</p>;

  return (
    <div>
      {canManageCategories() && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setIsCatModalOpen(true)}>
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
                  <button className="btn btn-sm" onClick={() => setSelectedCatForSub(cat.id)}>
                    <i className="fa-solid fa-plus"></i> Subcategory
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteCat(cat.id)}>
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              )}
            </div>

            {cat.subcategories.map((sub) => (
              <div key={sub.id} className="forum-card" onClick={() => onSelectSubcategory(sub.id, sub.name)}>
                <div className="forum-info">
                  <h3>
                    <i className="fa-solid fa-comments"></i> {sub.name}{' '}
                    {sub.isAnnouncement && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-gold)' }}>
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
