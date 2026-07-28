import React, { useState } from 'react'
import { getAuthHeader } from '../auth.js'

const CATEGORIES = ['General','Suggestions','Bug Reports','PvP Discussion','Off Topic','Introductions','Announcements']

export default function NewThreadModal({ onClose, onPosted }) {
  const [title, setTitle]     = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('General')
  const [tags, setTags]       = useState([])
  const [tagInput, setTagInput] = useState('')
  const [tab, setTab]         = useState('write')
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')

  function addTag() {
    const v = tagInput.replace(/,/g,'').trim()
    if (v && !tags.includes(v) && tags.length < 6) setTags([...tags, v])
    setTagInput('')
  }

  async function submit(e) {
    e.preventDefault()
    if (!title.trim()) return setErr('Title is required.')
    if (!content.trim()) return setErr('Content is required.')
    setLoading(true); setErr('')
    try {
      const auth = await getAuthHeader()
      const r = await fetch('/forum-api?type=threads', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization: auth },
        body: JSON.stringify({ title, content, category, tags }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed to post')
      onPosted(d.id)
    } catch(e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-ovl" onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#0a0204', border:'1px solid var(--border)', width:'100%', maxWidth:820, height:'100%', display:'flex', flexDirection:'column', overflow:'hidden', margin:'20px auto', borderRadius:'var(--r-md)' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 18px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)', flexShrink:0 }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1rem', fontWeight:800, color:'var(--text)', flex:1 }}>New Thread</h2>
          <button className="btn" onClick={onClose} style={{ padding:'5px 12px', fontSize:12 }}>✕ Close</button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:18, display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5, display:'block', fontFamily:'var(--font-body)' }}>
              Title <span style={{ color:'var(--red)' }}>*</span>
            </label>
            <input className="inp" type="text" placeholder="Thread title…" maxLength={200}
              value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5, display:'block', fontFamily:'var(--font-body)' }}>Category <span style={{ color:'var(--red)' }}>*</span></label>
            <select className="sel" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5, display:'block', fontFamily:'var(--font-body)' }}>
              Content <span style={{ color:'var(--red)' }}>*</span>
              <span style={{ textTransform:'none', fontWeight:400, marginLeft:6 }}>— Markdown supported</span>
            </label>
            <div style={{ display:'flex', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', overflow:'hidden', width:'fit-content', marginBottom:8 }}>
              {['write','preview'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ padding:'5px 14px', fontSize:12, fontWeight:700, fontFamily:'var(--font-body)', border:'none', background: tab===t ? 'rgba(200,16,46,0.1)' : 'rgba(255,255,255,0.02)', color: tab===t ? 'var(--text)' : 'var(--text-muted)', cursor:'pointer', transition:'all 0.15s' }}>
                  {t === 'write' ? '✏️ Write' : '👁 Preview'}
                </button>
              ))}
            </div>
            {tab === 'write'
              ? <textarea className="ta" value={content} onChange={e => setContent(e.target.value)} style={{ height:220 }}
                  placeholder={'# Heading\n\n**bold** *italic* `code`\n\n- Lists, tables, images — all supported.'} />
              : <div className="md-body" style={{ minHeight:220, padding:12, background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', overflowY:'auto' }}
                  dangerouslySetInnerHTML={{ __html: window.DOMPurify?.sanitize(window.marked?.parse(content)||'') || content }} />
            }
          </div>

          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5, display:'block', fontFamily:'var(--font-body)' }}>Tags</label>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:6 }}>
              {tags.map((t,i) => (
                <span key={t} className="chip">{t}
                  <button onClick={() => setTags(tags.filter((_,j)=>j!==i))}>×</button>
                </span>
              ))}
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <input className="inp" type="text" placeholder="Add tag and press Enter…" maxLength={25}
                value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter'||e.key===','){e.preventDefault();addTag()} }} />
              <button className="btn" onClick={addTag} style={{ padding:'7px 14px', fontSize:12, whiteSpace:'nowrap' }}>Add</button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display:'flex', gap:8, alignItems:'center', padding:'12px 18px', borderTop:'1px solid var(--border)', background:'rgba(255,255,255,0.02)', flexShrink:0, flexWrap:'wrap' }}>
          <span style={{ flex:1, fontSize:12, color:'#f07070', fontFamily:'var(--font-body)' }}>{err}</span>
          <button className="btn primary" onClick={submit} disabled={loading}>
            <i className="fa-solid fa-paper-plane" /> {loading ? 'Posting…' : 'Post Thread'}
          </button>
        </div>
      </div>
    </div>
  )
}
