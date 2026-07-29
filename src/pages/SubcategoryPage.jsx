import React, { useState, useEffect } from 'react';
import { apiFetch, SITE_ORIGIN } from '../api';
import { useAuth } from '../context/AuthContext';
import { CreateThreadModal } from '../components/modals/CreateModals';

export const SubcategoryPage = ({ subcategory, onBack, onSelectThread }) => {
  const { currentUser } = useAuth();
  const [threads, setThreads] = useState([]);
  const [subcatName, setSubcatName] = useState(subcategory.name || '');
  const [loading, setLoading] = useState(true);
  const [isThreadModalOpen, setIsThreadModalOpen] = useState(false);

  useEffect(() => {
    const fetchThreads = async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`/api/subcategories/${subcategory.id}/threads`);
        setThreads(data);

        // If visited directly via link without pre-stored name
        if (!subcatName && data.length > 0) {
          setSubcatName('Discussion Board');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, [subcategory.id, subcatName]);

  const handleCopyShareLink = () => {
    const shareUrl = `${SITE_ORIGIN}/?subcat=${subcategory.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Section permalink copied to clipboard!');
  };

  return (
    <div>
      <div className="breadcrumb">
        <span onClick={onBack}><i className="fa-solid fa-house"></i> Forums</span> &gt; <span>{subcatName || 'Subcategory'}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>{subcatName || 'Subcategory'}</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-sm" onClick={handleCopyShareLink} title="Share Link">
            <i className="fa-solid fa-share-nodes"></i> Share
          </button>
          {currentUser && !currentUser.isMuted && (
            <button className="btn btn-primary" onClick={() => setIsThreadModalOpen(true)}>
              <i className="fa-solid fa-plus"></i> New Thread
            </button>
          )}
        </div>
      </div>

      {currentUser && currentUser.isMuted && (
        <div className="mute-notice">
          <i className="fa-solid fa-volume-xmark"></i> Your account is currently <strong>muted</strong>. Thread creation is disabled. {currentUser.muteReason ? `Reason: ${currentUser.muteReason}` : ''}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}><i className="fa-solid fa-spinner fa-spin"></i> Loading threads...</p>
      ) : threads.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No threads here yet. Be the first to start a discussion!</p>
      ) : (
        threads.map((t) => (
          <div key={t.id} className="thread-item" onClick={() => onSelectThread(t.id, t.title)}>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                {t.isLocked && <i className="fa-solid fa-lock" style={{ color: 'var(--accent-gold)' }}></i>}{' '}
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

      <CreateThreadModal
        isOpen={isThreadModalOpen}
        subcategoryId={subcategory.id}
        onClose={() => setIsThreadModalOpen(false)}
        onSuccess={() => {
          const fetchThreads = async () => {
            const data = await apiFetch(`/api/subcategories/${subcategory.id}/threads`);
            setThreads(data);
          };
          fetchThreads();
        }}
      />
    </div>
  );
};
