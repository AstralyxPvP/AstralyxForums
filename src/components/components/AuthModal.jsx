import React, { useState } from 'react'
import { signUp, signIn, loginWithDiscord } from '../auth.js'
import { useAuth } from '../App.jsx'

const DISCORD_SVG = (
  <svg width="16" height="13" viewBox="0 0 71 55" fill="currentColor">
    <path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.4a41 41 0 0 0-1.8 3.7 54 54 0 0 0-16.4 0A41 41 0 0 0 25.5.4 58.6 58.6 0 0 0 10.9 5C1.6 18.8-1 32.3.3 45.6a59 59 0 0 0 18 9.1 44 44 0 0 0 3.8-6.2l-.1-.1a38.6 38.6 0 0 1-6-2.9l1.5-1.1a42.1 42.1 0 0 0 36 0l1.5 1.1a38.5 38.5 0 0 1-6 2.9 43.8 43.8 0 0 0 3.8 6.2 58.7 58.7 0 0 0 18-9.1C72 30.2 68 16.9 60.1 4.9ZM23.7 37.8c-3.5 0-6.4-3.2-6.4-7.2s2.9-7.2 6.4-7.2 6.5 3.2 6.4 7.2c0 4-2.9 7.2-6.4 7.2Zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.9-7.2 6.4-7.2 6.5 3.2 6.4 7.2c0 4-2.9 7.2-6.4 7.2Z"/>
  </svg>
)

export default function AuthModal({ onClose }) {
  const [tab, setTab] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const { openAuth } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setErr(''); setLoading(true)
    try {
      if (tab === 'signup') {
        await signUp(email, password, username)
      } else {
        await signIn(email, password)
      }
      onClose()
    } catch (e) {
      setErr(e.message?.replace('Firebase: ', '').replace(/\(auth.*\)/, '').trim() || 'Something went wrong.')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-ovl" onClick={e => e.target === e.currentTarget && onClose()}
      style={{ alignItems:'center' }}>
      <div className="modal-box" style={{ maxWidth:420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-bar" />
        <div style={{ padding:'24px 24px 28px' }}>
          {/* Close */}
          <button onClick={onClose} style={{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:6, color:'var(--muted)', width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:18 }}>×</button>

          {/* Title */}
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', color:'var(--text)', marginBottom:4 }}>
            {tab === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:20, fontFamily:'var(--font-body)' }}>
            {tab === 'login' ? 'Login to join the discussion.' : 'Sign up to post on the forums.'}
          </p>

          {/* Discord staff button */}
          <button onClick={loginWithDiscord}
            style={{ width:'100%', padding:'10px 16px', borderRadius:'var(--r-pill)', background:'#5865f2', border:'none', color:'#fff', fontWeight:700, fontSize:'0.85rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:16, fontFamily:'var(--font-body)' }}>
            {DISCORD_SVG} Staff? Login with Discord
          </button>

          {/* Divider */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <div style={{ flex:1, height:1, background:'var(--border)' }} />
            <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontFamily:'var(--font-body)' }}>or continue as player</span>
            <div style={{ flex:1, height:1, background:'var(--border)' }} />
          </div>

          {/* Tab switcher */}
          <div style={{ display:'flex', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', overflow:'hidden', marginBottom:16 }}>
            {['login','signup'].map(t => (
              <button key={t} onClick={() => { setTab(t); setErr('') }}
                style={{ flex:1, padding:'7px', fontSize:'0.78rem', fontWeight:700, fontFamily:'var(--font-body)', border:'none', cursor:'pointer', background: tab===t ? 'rgba(200,16,46,0.15)' : 'transparent', color: tab===t ? 'var(--text)' : 'var(--text-muted)', transition:'all 0.15s' }}>
                {t === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {tab === 'signup' && (
              <input className="inp" type="text" placeholder="Username" value={username}
                onChange={e => setUsername(e.target.value)} required minLength={3} maxLength={24} />
            )}
            <input className="inp" type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)} required />
            <input className="inp" type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} required minLength={6} />

            {err && <p style={{ fontSize:'0.8rem', color:'#f07070', fontFamily:'var(--font-body)' }}>{err}</p>}

            <button type="submit" className="btn primary" disabled={loading}
              style={{ width:'100%', justifyContent:'center', marginTop:4 }}>
              {loading ? '...' : tab === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:'0.75rem', color:'var(--text-muted)', marginTop:14, fontFamily:'var(--font-body)' }}>
            {tab === 'login'
              ? <span>No account? <button onClick={() => setTab('signup')} style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontWeight:700 }}>Sign up</button></span>
              : <span>Have an account? <button onClick={() => setTab('login')} style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontWeight:700 }}>Log in</button></span>
            }
          </p>
        </div>
      </div>
    </div>
  )
}
