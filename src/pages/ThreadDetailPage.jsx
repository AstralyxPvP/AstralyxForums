import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { marked } from 'marked';
import { apiFetch, canModerateRole } from '../api';
import { useAuth } from '../context/AuthContext';
import MarkdownToolbar from '../components/MarkdownToolbar';

export default function ThreadDetailPage({ onOpenEditModal, onOpenReportModal }) {
  const { threadId } = useParams();
  const [threadData, setThreadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const { currentUser, canManageCategories } = useAuth();
  const replyRef = useRef(null);

  const fetchThread = async () => {
    try {
      const data = await apiFetch(`/api/threads/${threadId}/posts`);
      setThreadData(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThread();
  }, [threadId]);

  const handleToggleLock = async (isLocked) => {
    try {
      await apiFetch(`/api/threads/${threadId}/lock`, { method: 'PUT', body: JSON.stringify({ isLocked }) });
      fetchThread();
    } catch (err) { alert(err.message); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post/thread?')) return;
    try {
      await apiFetch(`/api/threads/${threadId}/posts/${postId}`, { method: 'DELETE' });
      fetchThread();
    } catch (err) { alert(err.message); }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/threads/${threadId}/posts`, {
        method: 'POST',
        body: JSON.stringify({ content: replyContent })
      });
      setReplyContent('');
      fetchThread();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <p style={{ color: 'var(--text-muted)' }}><i className="fa-solid fa-spinner fa-spin"></i> Loading thread...</p>;
  if (!threadData) return <p style={{ color: 'var(--accent-danger)' }}>Thread not found.</p>;

  const { thread, posts } = threadData;

  const canDeleteMain = currentUser && (
    currentUser.id === thread.authorId ||
    ((currentUser.permissions?.delete || currentUser.permissions?.full || canManageCategories()) && canModerateRole(currentUser.roleTag, thread.authorRoleTag))
  );
  const canEditMain = currentUser && (currentUser.id === thread.authorId || currentUser.permissions?.full || canManageCategories());

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/"><i className="fa-solid fa-house"></i> Forums</Link> &gt; <span>{thread.title}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>{thread.title}</h2>
        {(canManageCategories() || currentUser?.permissions?.full) && (
          <button
            className={`btn btn-sm ${thread.isLocked ? 'btn-primary' : 'btn-warning'}`}
            onClick={() => handleToggleLock(!thread.isLocked)}
          >
            <i className={`fa-solid ${thread.isLocked ? 'fa-lock-open' : 'fa-lock'}`}></i> {thread.isLocked ? 'Unlock Comments' : 'Lock Comments'}
          </button>
        )}
      </div>

      {/* Main Post */}
      <div className="post-card main-post">
        <div className="post-author">
          <img className="avatar" src={thread.authorAvatar || 'https://via.placeholder.com/56'} alt="" />
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{thread.authorName}</div>
          <span className={`role-badge role-${thread.authorRole}`} style={{ marginTop: '0.4rem' }}>{thread.authorRoleTag || thread.authorRole}</span>
          {thread.authorLink && (
            <a href={thread.authorLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', marginTop: '0.4rem' }}>
              <i className="fa-solid fa-link"></i> Website
            </a>
          )}
        </div>
        <div className="post-content">
          <div>
            <div className="post-header">
              <span><i className="fa-solid fa-clock"></i> {new Date(thread.createdAt).toLocaleString()} {thread.updatedAt ? '(edited)' : ''}</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {currentUser && <button className="btn btn-sm" onClick={() => onOpenReportModal(threadId, 'main')}><i className="fa-solid fa-flag"></i></button>}
                {canEditMain && <button className="btn btn-sm" onClick={() => onOpenEditModal(threadId, 'main', thread.content)}><i className="fa-solid fa-pen"></i> Edit</button>}
                {canDeleteMain && <button className="btn btn-sm btn-danger" onClick={() => handleDeletePost('main')}><i className="fa-solid fa-trash"></i></button>}
              </div>
            </div>
            <div className="post-body" dangerouslySetInnerHTML={{ __html: marked.parse(thread.content) }} />
          </div>
          {thread.authorSignature && <div className="post-signature">{thread.authorSignature}</div>}
        </div>
      </div>

      {/* Comments Header */}
      <h3 style={{ margin: '1.5rem 0 1rem' }}><i className="fa-solid fa-comments"></i> Comments ({posts.length})</h3>

      {posts.map((p) => {
        const isAuthor = currentUser && p.authorId === currentUser.id;
        const canDelete = currentUser && (
          isAuthor ||
          ((currentUser.permissions?.delete || currentUser.permissions?.full || canManageCategories()) && canModerateRole(currentUser.roleTag, p.authorRoleTag))
        );
        const canEdit = currentUser && (isAuthor || currentUser.permissions?.full || canManageCategories());

        return (
          <div key={p.id} className="post-card">
            <div className="post-author">
              <img className="avatar" src={p.authorAvatar || 'https://via.placeholder.com/56'} alt="" />
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.authorName}</div>
              <span className={`role-badge role-${p.authorRole}`} style={{ marginTop: '0.4rem' }}>{p.authorRoleTag || p.authorRole}</span>
            </div>
            <div className="post-content">
              <div>
                <div className="post-header">
                  <span><i className="fa-solid fa-clock"></i> {new Date(p.createdAt).toLocaleString()} {p.updatedAt ? '(edited)' : ''}</span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {currentUser && <button className="btn btn-sm" onClick={() => onOpenReportModal(threadId, p.id)}><i className="fa-solid fa-flag"></i></button>}
                    {canEdit && <button className="btn btn-sm" onClick={() => onOpenEditModal(threadId, p.id, p.content)}><i className="fa-solid fa-pen"></i></button>}
                    {canDelete && <button className="btn btn-sm btn-danger" onClick={() => handleDeletePost(p.id)}><i className="fa-solid fa-trash"></i></button>}
                  </div>
                </div>
                <div className="post-body" dangerouslySetInnerHTML={{ __html: marked.parse(p.content) }} />
              </div>
              {p.authorSignature && <div className="post-signature">{p.authorSignature}</div>}
            </div>
          </div>
        );
      })}

      {/* Reply Section */}
      <div style={{ marginTop: '2rem' }}>
        {thread.isLocked && (!currentUser || (!canManageCategories() && !currentUser.permissions?.full)) ? (
          <p style={{ color: 'var(--accent-gold)', fontWeight: 600, padding: '1rem', border: '1px solid var(--accent-gold)', borderRadius: '8px', textAlign: 'center' }}>
            <i className="fa-solid fa-lock"></i> The comment section has been locked by staff.
          </p>
        ) : currentUser ? (
          <form onSubmit={handleCreatePost}>
            <h3>Leave a Comment</h3>
            <div className="form-group md-textarea-container" style={{ marginTop: '0.8rem' }}>
              <MarkdownToolbar textareaRef={replyRef} />
              <textarea
                ref={replyRef}
                rows="4"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a response... (Markdown supported)"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.8rem' }}>
              <i className="fa-solid fa-paper-plane"></i> Submit Comment
            </button>
          </form>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>Please log in to comment.</p>
        )}
      </div>
    </div>
  );
}
