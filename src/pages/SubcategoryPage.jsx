import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';

export default function SubcategoryPage({ onOpenThreadModal }) {
  const { subcategoryId } = useParams();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadThreads() {
      try {
        const data = await apiFetch(`/api/subcategories/${subcategoryId}/threads`);
        setThreads(data);
      } catch (err) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadThreads();
  }, [subcategoryId]);

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/"><i className="fa-solid fa-house"></i> Forums</Link> &gt; <span>Subcategory Threads</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Discussion Threads</h2>
        {currentUser && (
          <button className="btn btn-primary" onClick={() => onOpenThreadModal(subcategoryId)}>
            <i className="fa-solid fa-plus"></i> New Thread
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}><i className="fa-solid fa-spinner fa-spin"></i> Loading threads...</p>
      ) : threads.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No threads here yet. Be the first to start a discussion!</p>
      ) : (
        threads.map((t) => (
          <div
            key={t.id}
            className="thread-item"
            onClick={() => navigate(`/thread/${t.id}`)}
          >
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                {t.isLocked && <i className="fa-solid fa-lock" style={{ color: 'var(--accent-gold)', marginRight: '0.4rem' }}></i>}
                {t.title}
              </h4>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Started by <strong>{t.authorName}</strong> • {new Date(t.createdAt).toLocaleDateString()}
              </div>
            </div>
            <span className={`role-badge role-${t.authorRole}`}>{t.authorRoleTag || t.authorRole}</span>
          </div>
        ))
      )}
    </div>
  );
}
