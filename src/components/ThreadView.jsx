import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../App.jsx'
import { getAuthHeader } from '../auth.js'

function relTime(d) {
  const diff = Date.now() - new Date(d + 'Z').getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  const dy = Math.floor(h / 24); if (dy < 7) return `${dy}d ago`
  return new Date(d + 'Z').toLocaleDateString([], { dateStyle:'medium', timeStyle:'short' })
}

function renderMD(content) {
  if (!content) return ''
  const raw = content.replace(/\\n/g, '\n')
  try {
    return window.DOMPurify?.sanitize(window.marked?.parse(raw) || raw) || raw
  } catch { return raw }
}

function PostCard({ post, num, isOP, canDelete, onDelete }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'60px 1fr', border:'1px solid var(--border)', borderRadius:'var(--r-md)', overflow:'hidden', marginBottom:12, background:'rgba(255,255,255,0.02)', ...(isOP ? { borderColor:'rgba(200,16,46,0.25)' } : {}) }}
      className="post-card-grid">
      {/* Sidebar */}
      <div style={{ background:'rgba(255,255,255,0.02)', borderRight:'1px solid var(--border)', padding:'16px 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:6, textAlign:'center' }}>
        {post.author_avatar
          ? <img src={post.author_avatar} alt="" onError={e=>e.target.style.display='none'} style={{ width:38, height:38, borderRadius:'50%', border:`2px solid ${isOP?'rgba(200,16,46,0.4)':'var(--border)'}`, objectFit:'cover', ...(isOP?{boxShadow:'0 0 12px rgba(200,16,46,0.2)'}:{}) }} />
          : <div style={{ width:38, height:38, borderRadius:'50%', background:'var(--red)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#fff', fontSize:16, border:`2px solid ${isOP?'rgba(200,16,46,0.4)':'var(--border)'}` }}>
              {post.author_name?.[0]?.toUpperCase()}
            </div>
        }
        <div style={{ fontSize:10, fontWeight:800, color:'var(--text)', fontFamily:'var(--font-body)', wordBreak:'break-all', lineHeight:1.2 }}>{post.author_name}</div>
        {post.author_role && (
          <span style={{ fontSize:9, padding:'1px 6px', borderRadius:'var(--r-pill)', background: isOP?'rgba(200,16,46,0.12)':'rgba(255,255,255,0.06)', border:`1px solid ${isOP?'var(--red-glow)':'rgba(255,255,255,0.1)'}`, color: isOP?'var(--red)':'var(--text-muted)', textTransform:'uppercase', fontWeight:700, fontFamily:'Consolas,monospace', letterSpacing:'0.06em' }}>
            {isOP ? post.author_role : 'Player'}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, paddingBottom:8, borderBottom:'1px solid var(--border)', flexWrap:'wrap' }}>
          <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-body)' }}>{isOP ? 'OP' : `#${num}`}</span>
          <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-body)' }}>
            {new Date((post.created_at||'')+'Z').toLocaleString([], { dateStyle:'medium', timeStyle:'short' })}
          </span>
          {post.edited_at && <span style={{ fontSize:10, color:'var(--text-faint)', fontFamily:'var(--font-body)', fontStyle:'italic' }}>(edited {relTime(post.edited_at)})</span>}
          {canDelete && (
            <button onClick={() => onDelete(post.id, isOP ? 'thread' : 'reply')}
              style={{ marginLeft:'auto', background:'transparent', border:'1px solid rgba(240,112,112,0.3)', borderRadius:'var(--r-sm)', color:'#f07070', fontSize:11, padding:'3px 9px', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
              <i className="fa-solid fa-trash" /> Delete
            </button>
          )}
        </div>
        <div className="md-body" dangerouslySetInnerHTML={{ __html: renderMD(post.content) }} />
      </div>

      <style>{`@media(max-width:600px){.post-card-grid{grid-template-columns:1fr!important}.post-card-grid>div:first-child{flex-direction:row;border-right:none;border-bottom:1px solid var(--border);padding:10px 14px;justify-content:flex-start}}`}</style>
    </div>
  )
}

export default function ThreadView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, openAuth } = useAuth()
  const [thread, setThread] = useState(null)
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [replyTab, setReplyTab] = useState('write')
  const [replyLoading, setReplyLoading] = useState(false)
  const [replyErr, setReplyErr] = useState('')
  const replyRef = useRef(null)

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    try {
      const [tRes, rRes] = await Promise.all([
        fetch(`/forum-api?type=threads&id=${id}`),
        fetch(`/forum-api?type=replies&thread=${id}`)
      ])
      setThread(await tRes.json())
      setReplies(await rRes.json())
    } catch {}
    finally { setLoading(false) }
  }

  async function deletePost(postId, type) {
    if (!confirm('Delete this post?')) return
    try {
      const auth = await getAuthHeader()
      const url = type === 'thread'
        ? `/forum-api?type=threads&id=${postId}`
        : `/forum-api?type=replies&id=${postId}`
      await fetch(url, { method:'DELETE', headers:{ Authorization: auth } })
      if (type === 'thread') navigate('/')
      else load()
    } catch(e) { alert(`Delete failed: ${e.message}`) }
  }

  async function submitReply(e) {
    e.preventDefault()
    if (!replyContent.trim()) return setReplyErr('Write something first.')
    setReplyLoading(true); setReplyErr('')
    try {
      const auth = await getAuthHeader()
      const r = await fetch(`/forum-api?type=replies&thread=${id}`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization: auth },
        body: JSON.stringify({ content: replyContent }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setReplyContent('')
      load()
    } catch(e) { setReplyErr(e.message) }
    finally { setReplyLoading(false) }
  }

  function canDelete(post) {
    if (!user) return false
    return user.isStaff || user.uid === post.author_id
  }

  if (loading) return (
    <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)', fontFamily:'var(--font-body)' }}>
      <i className="fa-solid fa-spinner fa-spin" style={{ fontSize:28, marginBottom:12, display:'block' }} />
      Loading thread…
    </div>
  )

  if (!thread || thread.error) return (
    <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)', fontFamily:'var(--font-body)' }}>
      <div style={{ fontSize:36, marginBottom:12 }}>⚠️</div>
      <p>Thread not found.</p>
      <button className="btn" onClick={() => navigate('/')} style={{ marginTop:14 }}>← Back to Forums</button>
    </div>
  )

  return (
    <div style={{ paddingTop:20 }}>
      {/* Breadcrumb */}
      <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font-body)', marginBottom:10, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
        <button onClick={() => navigate('/')} style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:12, fontFamily:'var(--font-body)', padding:0 }}>
          <i className="fa-solid fa-arrow-left" /> Forums
        </button>
        <span>›</span>
        <span style={{ color:'var(--red)' }}>{thread.category}</span>
        <span>›</span>
        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:220 }}>{thread.title}</span>
      </div>

      {/* Title */}
      <div style={{ marginBottom:16 }}>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.2rem,3.5vw,1.7rem)', fontWeight:800, color:'var(--text)', lineHeight:1.25, marginBottom:8 }}>
          {thread.title}
        </h2>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <span style={{ fontSize:10, padding:'2px 8px', borderRadius:'var(--r-pill)', background:'rgba(200,16,46,0.1)', border:'1px solid var(--red-glow)', color:'var(--red)', fontWeight:700, fontFamily:'var(--font-body)' }}>{thread.category}</span>
          {(thread.tags||[]).map(t => (
            <span key={t} style={{ fontSize:10, padding:'2px 8px', borderRadius:'var(--r-pill)', background:'rgba(255,215,0,0.07)', border:'1px solid rgba(255,215,0,0.18)', color:'var(--gold)', fontFamily:'var(--font-body)' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* OP post */}
      <PostCard post={thread} num={0} isOP={true} canDelete={canDelete(thread)} onDelete={deletePost} />

      {/* Replies */}
      {replies.length > 0 && (
        <div style={{ fontFamily:'var(--font-display)', fontSize:'0.95rem', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', margin:'24px 0 10px', display:'flex', alignItems:'center', gap:8 }}>
          {replies.length} Repl{replies.length === 1 ? 'y' : 'ies'}
          <div style={{ flex:1, height:1, background:'var(--border)' }} />
        </div>
      )}
      {replies.map((r, i) => (
        <PostCard key={r.id} post={r} num={i+1} isOP={false} canDelete={canDelete(r)} onDelete={deletePost} />
      ))}

      {/* Reply box */}
      <div style={{ marginTop:24 }}>
        {user ? (
          <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:16 }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:'0.9rem', fontWeight:800, color:'var(--text)', marginBottom:12 }}>💬 Post a Reply</h3>
            <div style={{ display:'flex', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', overflow:'hidden', width:'fit-content', marginBottom:8 }}>
              {['write','preview'].map(t => (
                <button key={t} onClick={() => setReplyTab(t)}
                  style={{ padding:'5px 12px', fontSize:12, fontWeight:700, fontFamily:'var(--font-body)', border:'none', background: replyTab===t?'rgba(200,16,46,0.1)':'rgba(255,255,255,0.02)', color:replyTab===t?'var(--text)':'var(--text-muted)', cursor:'pointer' }}>
                  {t === 'write' ? '✏️ Write' : '👁 Preview'}
                </button>
              ))}
            </div>
            {replyTab === 'write'
              ? <textarea ref={replyRef} className="ta" value={replyContent} onChange={e => setReplyContent(e.target.value)} style={{ height:140 }} placeholder="Write your reply… Markdown supported." />
              : <div className="md-body" style={{ minHeight:140, padding:12, background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', overflowY:'auto' }}
                  dangerouslySetInnerHTML={{ __html: renderMD(replyContent) }} />
            }
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10, flexWrap:'wrap' }}>
              <span style={{ fontSize:12, color:'#f07070', fontFamily:'var(--font-body)', flex:1 }}>{replyErr}</span>
              <button className="btn primary" onClick={submitReply} disabled={replyLoading}>
                <i className="fa-solid fa-paper-plane" /> {replyLoading ? 'Posting…' : 'Post Reply'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:20, background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', fontFamily:'var(--font-body)', fontSize:14, color:'var(--text-muted)' }}>
            <button onClick={openAuth} style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontWeight:700, fontSize:14 }}>Login</button> to post a reply.
          </div>
        )}
      </div>
    </div>
  )
}
