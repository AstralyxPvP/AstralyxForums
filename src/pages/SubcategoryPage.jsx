import React, { useState, useEffect } from 'react';
import { apiFetch, SITE_ORIGIN, formatAuthorName } from '../api';
import { cachedFetch, invalidateCache } from '../api/cache';
import { useAuth } from '../context/AuthContext';
import { CreateThreadModal } from '../components/modals/CreateModals';
import { TicketSubmissionForm } from '../components/TicketSubmissionForm';

const THREADS_TTL = 15_000; // shorter than categories — thread lists change often

export const SubcategoryPage = ({ subcategory, onBack, onSelectThread, onOpenProfile }) => {
  const { currentUser } = useAuth();
  const [threads, setThreads] = useState([]);
  const [subcatData, setSubcatData] = useState(subcategory || {});
  const [loading, setLoading] = useState(true);
  const [isThreadModalOpen, setIsThreadModalOpen] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  const threadsKey = subcategory?.id ? `/api/subcategories/${subcategory.id}/threads` : null;

  useEffect(() => {
    const loadSubcategoryAndThreads = async () => {
      setLoading(true);
      try {
        if (subcategory?.id) {
          // If subcategory name or ticket flags are missing, fetch fresh subcategory data
          if (!subcategory?.name || subcategory?.isTicket === undefined) {
            const freshSub = await cachedFetch(
              `/api/subcategories/${subcategory.id}`,
              () => apiFetch(`/api/subcategories/${subcategory.id}`)
            );
            if (freshSub && freshSub.id) setSubcatData(freshSub);
          } else {
            setSubcatData(subcategory);
          }

          const data = await cachedFetch(
            threadsKey,
            () => apiFetch(threadsKey),
            { ttl: THREADS_TTL, onRevalidate: (fresh) => setThreads(fresh) }
          );
          setThreads(data);
        }
      } catch (err) {
        console.error('Failed to load threads:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSubcategoryAndThreads();
  }, [subcategory?.id]);

  const handleCopyShareLink = () => {
    const shareUrl = `${SITE_ORIGIN}/?subcat=${subcatData.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Section permalink copied to clipboard!');
  };

  // Smart Detection for Icons & UI Layout
  const subName = (subcatData?.name || '').toLowerCase();
  const isBugSub = (subcatData?.isTicket && subcatData?.ticketType === 'bug') || subName.includes('bug');
  const isTicketSub = subcatData?.isTicket || subName.includes('ticket') || subName.includes('support') || isBugSub;

  let iconClass = 'fa-comments';
  let iconColor = 'inherit';

  if (subcatData?.isAnnouncement) {
    iconClass = 'fa-bullhorn';
    iconColor = 'var(--accent-gold)';
  } else if (isBugSub) {
    iconClass = 'fa-bug';
    iconColor = '#ef4444';
  } else if (isTicketSub) {
    iconClass = 'fa-headset';
    iconColor = '#60a5fa';
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '0.85rem' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }}></i> Loading threads...
      </div>
    );
  }

  if (isCreatingTicket && isTicketSub) {
    return (
      <TicketSubmissionForm 
        subcategory={subcatData}
        onSuccess={(id, title) => onSelectThread(id, title)}
        onCancel={() => setIsCreatingTicket(false)}
      />
    );
  }

  return (
    <div>
      <div className="breadcrumb">
        <span onClick={onBack} style={{ cursor: 'pointer' }}>
          <i className="fa-solid fa-house"></i> Forums
        </span>{' '}
        &gt; <span>{subcatData.name || 'Subcategory'}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center' }}>
          <i className={`fa-solid ${iconClass}`} style={{ color: iconColor, marginRight: '0.6rem' }}></i>
          {subcatData.name || 'Subcategory'}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-sm" onClick={handleCopyShareLink} title="Share Link">
            <i className="fa-solid fa-share-nodes"></i> Share
          </button>
          {currentUser && !currentUser.isMuted && (
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => setIsThreadModalOpen(true)}
            >
              <i className="fa-solid fa-plus"></i> {isTicketSub ? (isBugSub ? 'Submit Bug Report' : 'Open New Ticket') : 'New Thread'}
            </button>
          )}
        </div>
      </div>

      {currentUser && currentUser.isMuted && (
        <div
          className="mute-notice"
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid var(--accent-red)',
            borderRadius: 'var(--r-md)',
            padding: '0.85rem 1.1rem',
            marginBottom: '1.5rem',
            color: 'var(--accent-danger)',
            fontFamily: 'var(--font-code)',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}
        >
          <i className="fa-solid fa-volume-xmark" style={{ fontSize: '1rem' }}></i>
          <span>
            Your account is currently <strong>muted</strong>. {isTicketSub ? 'Ticket creation' : 'Thread creation'} is disabled. {currentUser.muteReason ? `Reason: ${currentUser.muteReason}` : ''}
          </span>
        </div>
      )}

      {threads.length === 0 ? (
        <div className="forum-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '0.85rem', margin: 0 }}>
            {isTicketSub ? 'No tickets here yet.' : 'No threads here yet. Be the first to start a discussion!'}
          </p>
        </div>
      ) : (
        threads.map((t) => (
          <div key={t.id} className="thread-item" onClick={() => onSelectThread(t.id, t.title)}>
            <div style={{ width: '100%' }}>
              <h4
                style={{
                  fontSize: '1.05rem',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  marginBottom: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {t.isLocked && <i className="fa-solid fa-lock" style={{ color: 'var(--accent-gold)' }}></i>}
                {t.isClosed && <span className="role-badge" style={{ background: 'var(--accent-green)', fontSize: '0.65rem' }}>CLOSED</span>}
                <span>{t.title}</span>
              </h4>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-code)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}
              >
                <span>
                  Started by <strong 
                    style={{ color: 'var(--accent-cyan)', cursor: 'pointer' }} 
                    onClick={(e) => { e.stopPropagation(); onOpenProfile(t.authorId); }}
                  >
                    {formatAuthorName(t.authorName)}
                  </strong>
                </span>
                <span className={`role-badge role-${t.authorRole}`}>
                  {t.authorRoleTag || t.authorRole}
                </span>
                <span>• {new Date(t.createdAt).toLocaleDateString()}</span>
                {t.isTicket && (
                  <span style={{ color: t.isClosed ? 'var(--accent-green)' : 'var(--accent-gold)', fontWeight: 700 }}>
                    [{t.isClosed ? 'RESOLVED' : 'OPEN'}]
                  </span>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      <CreateThreadModal
        isOpen={isThreadModalOpen}
        subcategoryId={subcatData.id}
        subcategory={subcatData}
        onClose={() => setIsThreadModalOpen(false)}
        onSuccess={async () => {
          invalidateCache(threadsKey);
          const data = await apiFetch(`/api/subcategories/${subcatData.id}/threads`);
          setThreads(data);
        }}
      />
    </div>
  );
};
