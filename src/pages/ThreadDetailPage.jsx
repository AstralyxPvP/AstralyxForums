import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import { apiFetch, SITE_ORIGIN, canModerateRole, formatAuthorName } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/Avatar';
import { MarkdownToolbar } from '../components/MarkdownToolbar';
import { EditPostModal } from '../components/modals/EditPostModal';
import { ReportModal } from '../components/modals/ReportModal';
import UserProfileModal from '../components/modals/UserProfileModal';

export const ThreadDetailPage = ({ threadId, title, subcategory, onBackToForums, onBackToSubcategory, onOpenProfile }) => {
  const { currentUser, canManageCategories, checkAuth } = useAuth();
  const [threadData, setThreadData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [subData, setSubData] = useState(null); // NEW

  const [editModalData, setEditModalData] = useState(null);
  const [reportModalData, setReportModalData] = useState(null);

  // User profile modal state
  const [viewProfileUserId, setViewProfileUserId] = useState(null);

  const fetchThreadDetail = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/threads/${threadId}/posts`);
      setThreadData(data.thread);
      setPosts(data.posts);
      
      // Fetch subcategory info to check ticket status
      const sData = await apiFetch(`/api/subcategories/${data.thread.subcategoryId}`);
      setSubData(sData);
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

  const handleCloseTicket = async () => { // NEW
    if (!confirm('Close this ticket? It will be archived and locked.')) return;
    try {
      await apiFetch(`/api/threads/${threadId}/close`, { method: 'POST' });
      alert('Ticket closed successfully.');
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

  // Ignore a user directly from a post
  const handleIgnoreUser = async (targetUserId, targetName) => {
    if (!currentUser) return;
    if (!confirm(`Ignore ${targetName}? Their posts and threads will be hidden from you.`)) return;
    try {
      await apiFetch('/api/user/ignore', {
        method: 'POST',
        body: JSON.stringify({ targetUserId })
      });
      await checkAuth();
      fetchThreadDetail();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '0.85rem' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }}></i> Loading thread & comments...
      </div>
    );
  }

  if (!threadData) {
    return (
      <div className="forum-card" style={{ padding: '2.5rem', textAlign: 'center', borderColor: 'var(--accent-red)' }}>
        <p style={{ color: 'var(--accent-danger)', fontFamily: 'var(--font-code)', fontSize: '0.85rem', margin: 0 }}>
          <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '0.5rem' }}></i> Thread not found or Access Denied.
        </p>
      </div>
    );
  }

  const displayTitle = threadData.title || title;
  const mainAuthorName = formatAuthorName(threadData.authorName);

  const canDeleteMain = currentUser && (
    currentUser.id === threadData.authorId ||
    ((currentUser.permissions?.delete || currentUser.permissions?.full || canManageCategories()) && canModerateRole(currentUser.roleTag, threadData.authorRoleTag))
  );
  const canEditMain = currentUser && (currentUser.id === threadData.authorId || currentUser.permissions?.full || canManageCategories());

  // Ticket closure logic
  const isStaff = currentUser && (canManageCategories() || currentUser.permissions?.full);
  const canCloseTicket = subData?.isTicket && !threadData.isClosed && isStaff;

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <span onClick={onBackToForums} style={{ cursor: 'pointer' }}>
          <i className="fa-solid fa-house"></i> Forums
        </span>{' '}
        &gt;{' '}
        <span onClick={() => onBackToSubcategory(threadData.subcategoryId, subData?.name || 'Section')} style={{ cursor: 'pointer' }}>
          {subData?.name || 'Section'}
        </span>{' '}
        &gt; <span>{displayTitle}</span>
      </div>

      {/* Thread Title Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {threadData.isClosed && <span className="role-badge" style={{ background: 'var(--accent-green)' }}>CLOSED TICKET</span>}
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
            {displayTitle}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {canCloseTicket && (
            <button className="btn btn-sm btn-success" onClick={handleCloseTicket}>
              <i className="fa-solid fa-check-double"></i> Close Ticket
            </button>
          )}
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

      {/* Main Thread Original Post Card */}
      <div className={`post-card main-post ${threadData.isClosed ? 'closed-ticket-card' : ''}`}>
        <div className="post-author">
          {/* Clicking avatar or name navigates to the public profile page */}
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => onOpenProfile(threadData.authorId)}
            title={`View ${mainAuthorName}'s profile`}
          >
            <Avatar src={threadData.authorAvatar} name={mainAuthorName} size={56} />
          </div>
          <div
            className="post-author-name"
            style={{ cursor: 'pointer', color: 'var(--accent-cyan)' }}
            onClick={() => onOpenProfile(threadData.authorId)}
            title={`View ${mainAuthorName}'s profile`}
          >
            {mainAuthorName}
          </div>
          <span className={`role-badge role-${threadData.authorRole}`}>
            {threadData.authorRoleTag || threadData.authorRole}
          </span>
          {threadData.authorLink && (
            <a href={threadData.authorLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-code)', textDecoration: 'none' }}>
              <i className="fa-solid fa-link"></i> Website
            </a>
          )}
        </div>

        <div className="post-content">
          <div>
            <div className="post-header">
              <div className="post-header-left">
                <span>
                  <i className="fa-solid fa-clock" style={{ marginRight: '0.35rem' }}></i>
                  {new Date(threadData.createdAt).toLocaleString()} {threadData.updatedAt ? '(edited)' : ''}
                </span>
              </div>
              <div className="post-header-right">
                {/* Ignore button on main post (only for other users) */}
                {currentUser && currentUser.id !== threadData.authorId && (
                  <button
                    className="btn btn-xs"
                    onClick={() => handleIgnoreUser(threadData.authorId, mainAuthorName)}
                    title={`Ignore ${mainAuthorName}`}
                    style={{ opacity: 0.7 }}
                  >
                    <i className="fa-solid fa-eye-slash"></i>
                  </button>
                )}
                {currentUser && (
                  <button className="btn btn-xs" onClick={() => setReportModalData({ threadId, postId: 'main' })} title="Report Post">
                    <i className="fa-solid fa-flag"></i>
                  </button>
                )}
                {canEditMain && !threadData.isClosed && (
                  <button className="btn btn-xs" onClick={() => setEditModalData({ threadId, postId: 'main', content: threadData.content })}>
                    <i className="fa-solid fa-pen"></i> Edit
                  </button>
                )}
                {canDeleteMain && (
                  <button className="btn btn-xs btn-danger" onClick={() => handleDeletePost('main')}>
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

      {/* Comments List Header */}
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 900, color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '1px', margin: '2rem 0 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <i className="fa-solid fa-comments" style={{ color: 'var(--accent-red)' }}></i> {subData?.isTicket ? 'Ticket Discussion' : 'Comments'} ({posts.length})
      </h3>

      {posts.length === 0 ? (
        <div className="forum-card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '0.85rem', margin: 0 }}>
            No comments yet. Be the first to leave a response!
          </p>
        </div>
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
                <div
                  style={{ cursor: 'pointer' }}
                  onClick={() => onOpenProfile(p.authorId)}
                  title={`View ${commentAuthorName}'s profile`}
                >
                  <Avatar src={p.authorAvatar} name={commentAuthorName} size={56} />
                </div>
                <div
                  className="post-author-name"
                  style={{ cursor: 'pointer', color: 'var(--accent-cyan)' }}
                  onClick={() => onOpenProfile(p.authorId)}
                  title={`View ${commentAuthorName}'s profile`}
                >
                  {commentAuthorName}
                </div>
                <span className={`role-badge role-${p.authorRole}`}>
                  {p.authorRoleTag || p.authorRole}
                </span>
              </div>

              <div className="post-content">
                <div>
                  <div className="post-header">
                    <div className="post-header-left">
                      <span>
                        <i className="fa-solid fa-clock" style={{ marginRight: '0.35rem' }}></i>
                        {new Date(p.createdAt).toLocaleString()} {p.updatedAt ? '(edited)' : ''}
                      </span>
                    </div>
                    <div className="post-header-right">
                      {/* Ignore button on comments (only for other users) */}
                      {currentUser && !isAuthor && (
                        <button
                          className="btn btn-xs"
                          onClick={() => handleIgnoreUser(p.authorId, commentAuthorName)}
                          title={`Ignore ${commentAuthorName}`}
                          style={{ opacity: 0.7 }}
                        >
                          <i className="fa-solid fa-eye-slash"></i>
                        </button>
                      )}
                      {currentUser && (
                        <button className="btn btn-xs" onClick={() => setReportModalData({ threadId, postId: p.id })} title="Report Comment">
                          <i className="fa-solid fa-flag"></i>
                        </button>
                      )}
                      {canEdit && !threadData.isClosed && (
                        <button className="btn btn-xs" onClick={() => setEditModalData({ threadId, postId: p.id, content: p.content })}>
                          <i className="fa-solid fa-pen"></i>
                        </button>
                      )}
                      {canDelete && (
                        <button className="btn btn-xs btn-danger" onClick={() => handleDeletePost(p.id)}>
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

      {/* Reply Submission Area */}
      {threadData.isLocked ? (
        <div
          style={{
            background: 'rgba(251, 191, 36, 0.08)',
            border: '1px solid var(--accent-gold)',
            borderRadius: 'var(--r-md)',
            padding: '1.25rem',
            textAlign: 'center',
            color: 'var(--accent-gold)',
            fontFamily: 'var(--font-code)',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem'
          }}
        >
          <i className="fa-solid fa-lock"></i> {threadData.isClosed ? 'This ticket is closed and archived.' : 'The comment section has been locked by staff.'}
        </div>
      ) : currentUser && currentUser.isMuted ? (
        <div
          className="mute-notice"
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid var(--accent-red)',
            borderRadius: 'var(--r-md)',
            padding: '1rem 1.25rem',
            color: 'var(--accent-danger)',
            fontFamily: 'var(--font-code)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}
        >
          <i className="fa-solid fa-volume-xmark" style={{ fontSize: '1rem' }}></i>
          <span>
            Your account is currently <strong>muted</strong>. Commenting is disabled. {currentUser.muteReason ? `Reason: ${currentUser.muteReason}` : ''}
          </span>
        </div>
      ) : currentUser ? (
        <div style={{ marginTop: '2.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>
            {subData?.isTicket ? 'Reply to Ticket' : 'Leave a Comment'}
          </h3>
          <form onSubmit={handleCreateReply}>
            <div className="form-group md-textarea-container">
              <MarkdownToolbar targetId="postContent" />
              <textarea
                id="postContent"
                rows="5"
                placeholder="Write a response... (Markdown supported)"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              <i className="fa-solid fa-paper-plane"></i> {subData?.isTicket ? 'Submit Reply' : 'Submit Comment'}
            </button>
          </form>
        </div>
      ) : (
        <div className="forum-card" style={{ padding: '1.5rem', textAlign: 'center', marginTop: '2rem' }}>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '0.85rem', margin: 0 }}>
            Please log in to leave a comment on this thread.
          </p>
        </div>
      )}

      {/* Edit & Report Modals */}
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

      {/* Public User Profile Modal (Fallback/Alternative) */}
      {viewProfileUserId && (
        <UserProfileModal
          userId={viewProfileUserId}
          onClose={() => setViewProfileUserId(null)}
        />
      )}
    </div>
  );
};
