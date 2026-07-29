import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import { apiFetch, SITE_ORIGIN, canModerateRole, formatAuthorName } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/Avatar';
import { MarkdownToolbar } from '../components/MarkdownToolbar';
import { EditPostModal } from '../components/modals/EditPostModal';
import { ReportModal } from '../components/modals/ReportModal';

export const ThreadDetailPage = ({ threadId, title, subcategory, onBackToForums, onBackToSubcategory }) => {
  const { currentUser, canManageCategories } = useAuth();
  const [threadData, setThreadData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');

  const [editModalData, setEditModalData] = useState(null);
  const [reportModalData, setReportModalData] = useState(null);

  const fetchThreadDetail = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/threads/${threadId}/posts`);
      setThreadData(data.thread);
      setPosts(data.posts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreadDetail();
  }, [threadId]);

  const handleCopyShareLink = () => {
    const shareUrl = `${SITE_ORIGIN}/?thread=${threadId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Thread permalink copied to clipboard!');
  };

  const handleToggleLock = async () => {
    try {
      await apiFetch(`/api/threads/${threadId}/lock`, {
        method: 'PUT',
        body: JSON.stringify({ isLocked: !threadData.isLocked })
      });
      fetchThreadDetail();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateReply = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/threads/${threadId}/posts`, {
        method: 'POST',
        body: JSON.stringify({ content: replyContent })
      });
      setReplyContent('');
      fetchThreadDetail();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Delete post/thread?')) return;
    try {
      await apiFetch(`/api/threads/${threadId}/posts/${postId}`, { method: 'DELETE' });
      if (postId === 'main') {
        onBackToSubcategory(threadData?.subcategoryId);
      } else {
        fetchThreadDetail();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p style={{ color: 'var(--text-muted)' }}><i className="fa-solid fa-spinner fa-spin"></i> Loading thread & comments...</p>;
  if (!threadData) return <p style={{ color: 'var(--accent-danger)' }}>Thread not found.</p>;

  const displayTitle = threadData.title || title;
  const mainAuthorName = formatAuthorName(threadData.authorName);

  const canDeleteMain = currentUser && (
    currentUser.id === threadData.authorId ||
    ((currentUser.permissions?.delete || currentUser.permissions?.full || canManageCategories()) && canModerateRole(currentUser.roleTag, threadData.authorRoleTag))
  );
  const canEditMain = currentUser && (currentUser.id === threadData.authorId || currentUser.permissions?.full || canManageCategories());

  return (
    <div>
      <div className="breadcrumb">
        <span onClick={onBackToForums}><i className="fa-solid fa-house"></i> Forums</span> &gt;{' '}
        <span onClick={() => onBackToSubcategory(threadData.subcategoryId, subcategory?.name || 'Section')}>
          {subcategory?.name || 'Section'}
        </span> &gt;{' '}
        <span>{displayTitle}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>{displayTitle}</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-sm" onClick={handleCopyShareLink} title="Share Permalinks">
            <i className="fa-solid fa-share-nodes"></i> Share
          </button>
          {(canManageCategories() || currentUser?.permissions?.full) && (
            <button className={`btn btn-sm ${threadData.isLocked ? 'btn-primary' : 'btn-warning'}`} onClick={handleToggleLock}>
              <i className={`fa-solid ${threadData.isLocked ? 'fa-lock-open' : 'fa-lock'}`}></i>{' '}
              {threadData.isLocked ? 'Unlock Comments' : 'Lock Comments'}
            </button>
          )}
        </div>
      </div>

      {/* Main Thread Post */}
      <div className="post-card main-post">
        <div className="post-author">
          <Avatar src={threadData.authorAvatar} name={mainAuthorName} size={56} />
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '0.4rem' }}>{mainAuthorName}</div>
          <span className={`role-badge role-${threadData.authorRole}`} style={{ marginTop: '0.4rem' }}>
            {threadData.authorRoleTag || threadData.authorRole}
          </span>
          {threadData.authorLink && (
            <a href={threadData.authorLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', marginTop: '0.4rem' }}>
              <i className="fa-solid fa-link"></i> Website
            </a>
          )}
        </div>
        <div className="post-content">
          <div>
            <div className="post-header">
              <span><i className="fa-solid fa-clock"></i> {new Date(threadData.createdAt).toLocaleString()} {threadData.updatedAt ? '(edited)' : ''}</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {currentUser && (
                  <button className="btn btn-sm" onClick={() => setReportModalData({ threadId, postId: 'main' })}>
                    <i className="fa-solid fa-flag"></i>
                  </button>
                )}
                {canEditMain && (
                  <button className="btn btn-sm" onClick={() => setEditModalData({ threadId, postId: 'main', content: threadData.content })}>
                    <i className="fa-solid fa-pen"></i> Edit
                  </button>
                )}
                {canDeleteMain && (
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeletePost('main')}>
                    <i className="fa-solid fa-trash"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="post-body" dangerouslySetInnerHTML={{ __html: marked.parse(threadData.content || '') }} />
          </div>
          {threadData.authorSignature && <div className="post-signature">{threadData.authorSignature}</div>}
        </div>
      </div>

      {/* Comments List */}
      <h3 style={{ margin: '1.5rem 0 1rem' }}><i className="fa-solid fa-comments"></i> Comments ({posts.length})</h3>
      {posts.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>No comments yet.</p>
      ) : (
        posts.map((p) => {
          const commentAuthorName = formatAuthorName(p.authorName);
          const isAuthor = currentUser && p.authorId === currentUser.id;
          const canDelete = currentUser && (
            isAuthor ||
            ((currentUser.permissions?.delete || currentUser.permissions?.full || canManageCategories()) && canModerateRole(currentUser.roleTag, p.authorRoleTag))
          );
          const canEdit = currentUser && (isAuthor || currentUser.permissions?.full || canManageCategories());

          return (
            <div key={p.id} className="post-card">
              <div className="post-author">
                <Avatar src={p.authorAvatar} name={commentAuthorName} size={56} />
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '0.4rem' }}>{commentAuthorName}</div>
                <span className={`role-badge role-${p.authorRole}`} style={{ marginTop: '0.4rem' }}>
                  {p.authorRoleTag || p.authorRole}
                </span>
              </div>
              <div className="post-content">
                <div>
                  <div className="post-header">
                    <span><i className="fa-solid fa-clock"></i> {new Date(p.createdAt).toLocaleString()} {p.updatedAt ? '(edited)' : ''}</span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {currentUser && (
                        <button className="btn btn-sm" onClick={() => setReportModalData({ threadId, postId: p.id })}>
                          <i className="fa-solid fa-flag"></i>
                        </button>
                      )}
                      {canEdit && (
                        <button className="btn btn-sm" onClick={() => setEditModalData({ threadId, postId: p.id, content: p.content })}>
                          <i className="fa-solid fa-pen"></i>
                        </button>
                      )}
                      {canDelete && (
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeletePost(p.id)}>
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="post-body" dangerouslySetInnerHTML={{ __html: marked.parse(p.content || '') }} />
                </div>
                {p.authorSignature && <div className="post-signature">{p.authorSignature}</div>}
              </div>
            </div>
          );
        })
      )}

      {/* Reply Area */}
      {threadData.isLocked && (!currentUser || (!canManageCategories() && !currentUser.permissions?.full)) ? (
        <p style={{ color: 'var(--accent-gold)', fontWeight: 600, padding: '1rem', border: '1px solid var(--accent-gold)', borderRadius: '8px', textAlign: 'center' }}>
          <i className="fa-solid fa-lock"></i> The comment section has been locked by staff.
        </p>
      ) : currentUser && currentUser.isMuted ? (
        <div className="mute-notice">
          <i className="fa-solid fa-volume-xmark"></i> Your account is currently <strong>muted</strong>. Commenting is disabled. {currentUser.muteReason ? `Reason: ${currentUser.muteReason}` : ''}
        </div>
      ) : currentUser ? (
        <div style={{ marginTop: '2rem' }}>
          <h3>Leave a Comment</h3>
          <form onSubmit={handleCreateReply} style={{ marginTop: '0.8rem' }}>
            <div className="form-group md-textarea-container">
              <MarkdownToolbar targetId="postContent" />
              <textarea
                id="postContent"
                rows="4"
                style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: '#fff', outline: 'none' }}
                placeholder="Write a response... (Markdown supported)"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.8rem' }}>
              <i className="fa-solid fa-paper-plane"></i> Submit Comment
            </button>
          </form>
        </div>
      ) : (
        <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>
          Please log in to comment.
        </p>
      )}

      {/* Modals */}
      <EditPostModal
        isOpen={!!editModalData}
        threadId={editModalData?.threadId}
        postId={editModalData?.postId}
        initialContent={editModalData?.content}
        onClose={() => setEditModalData(null)}
        onSuccess={fetchThreadDetail}
      />
      <ReportModal
        isOpen={!!reportModalData}
        threadId={reportModalData?.threadId}
        postId={reportModalData?.postId}
        onClose={() => setReportModalData(null)}
      />
    </div>
  );
};
