import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../App.jsx'
import NewThreadModal from './NewThreadModal.jsx'

const CATEGORIES = ['All', 'General', 'Suggestions', 'Bug Reports', 'PvP Discussion', 'Off Topic', 'Introductions', 'Announcements']

function relTime(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d + 'Z').getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  const dy = Math.floor(h / 24); if (dy < 7) return `${dy}d ago`
  return new Date(d + 'Z').toLocaleDateString([], { dateStyle: 'medium' })
}

export default function ForumList() {
  const { user, openAuth } = useAuth()
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)

  useEffect(() => {
    loadThreads()
  }, [])

  async function loadThreads() {
    setLoading(true)
    try {
      const r = await fetch('/forum-api?type=threads')
      const data = await r.json()
      if (Array.isArray(data)) {
        setThreads(data)
      }
    } catch (e) {
      console.error('Failed to load threads:', e)
    } finally {
      setLoading(false)
    }
  }

  const filteredThreads = threads.filter(t => {
    const matchesCat = selectedCategory === 'All' || t.category === selectedCategory
    const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || (t.content && t.content.toLowerCase().includes(search.toLowerCase()))
    return matchesCat && matchesSearch
  })

  return (
    <div>
      {/* Hero / Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 className="title">Astralyx Forums</h1>
        <p className="subtitle">Official community forums for AstralyxPvP.</p>
      </div>

      {/* Controls Bar */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
        {/* Search Input */}
        <div style={{ flex: '1 1 240px', maxWidth: 400 }}>
          <input
            className="inp"
            type="text"
            placeholder="Search discussions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Action Button */}
        {user ? (
          <button className="btn primary" onClick={() => setShowNewModal(true)}>
            + New Thread
          </button>
        ) : (
          <button className="btn" onClick={openAuth}>
            Login to Post
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 20 }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`btn ${selectedCategory === cat ? 'primary' : ''}`}
            style={{ padding: '6px 14px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Thread List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24, marginBottom: 8 }} />
          <p>Loading discussions...</p>
        </div>
      ) : filteredThreads.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <p>No threads found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredThreads.map(thread => (
            <Link
              to={`/thread/${thread.id}`}
              key={thread.id}
              className="panel"
              style={{ textDecoration: 'none', color: 'inherit', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}
            >
              {/* Author Avatar */}
              <div style={{ flexShrink: 0 }}>
                {thread.author_avatar ? (
                  <img src={thread.author_avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>
                    {thread.author_name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>

              {/* Thread Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 'var(--r-pill)', background: 'rgba(200,16,46,0.15)', border: '1px solid var(--red-glow)', color: 'var(--red)', fontWeight: 700 }}>
                    {thread.category}
                  </span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {thread.title}
                  </h3>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
                  <span>By <strong>{thread.author_name}</strong></span>
                  <span>•</span>
                  <span>{relTime(thread.created_at)}</span>
                </div>
              </div>

              {/* Reply Count Badge */}
              <div style={{ flexShrink: 0, textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <i className="fa-regular fa-comment" style={{ marginRight: 6 }} />
                {thread.reply_count || 0}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Thread Modal */}
      {showNewModal && (
        <NewThreadModal
          onClose={() => setShowNewModal(false)}
          onPosted={newId => {
            setShowNewModal(false)
            loadThreads()
          }}
        />
      )}
    </div>
  )
                                                      }
