import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../App.jsx'

export default function Navbar() {
  const { user, logout, openAuth } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`main-nav ${scrolled ? 'nav-scrolled' : ''}`}>
      <Link to="/" className="nav-brand" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
        <div className="nav-logo-mark">
          <img src="/logo.png" alt="AstralyxPvP" onError={e => e.target.style.display='none'} />
        </div>
        <div style={{ fontFamily:'Consolas,monospace', lineHeight:1 }}>
          <div style={{ fontSize:'0.85rem', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.18em', color:'var(--text)' }}>Astralyx</div>
          <div style={{ fontSize:'0.68rem', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.34em', color:'var(--red)' }}>Forums</div>
        </div>
      </Link>

      <div style={{ flex:1 }} />

      <a href="https://www.astralyxpvp.int.yt" className="nav-link" style={{ fontSize:'0.72rem' }}>
        ← Main Site
      </a>

      {user ? (
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            {user.avatar
              ? <img src={user.avatar} alt="" style={{ width:28, height:28, borderRadius:'50%', border:'1.5px solid rgba(255,215,0,0.3)' }} />
              : <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--red)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff' }}>
                  {user.displayName?.[0]?.toUpperCase()}
                </div>
            }
            <span style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text)', fontFamily:'Consolas,monospace', maxWidth:90, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user.displayName}
            </span>
            <span className={`badge ${user.isStaff ? 'badge-gold' : 'badge-muted'}`}>
              {user.isStaff ? user.role : 'Player'}
            </span>
          </div>
          <button className="btn" onClick={logout} style={{ padding:'5px 12px', fontSize:'0.7rem' }}>
            Sign out
          </button>
        </div>
      ) : (
        <button className="btn primary" onClick={openAuth} style={{ padding:'7px 18px', fontSize:'0.75rem' }}>
          Login / Sign up
        </button>
      )}
    </nav>
  )
}
