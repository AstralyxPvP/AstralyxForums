import React, { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { onUserChange, getStaffSession, saveStaffToken, clearStaffSession, signOut } from './auth.js'
import Navbar from './components/Navbar.jsx'
import ForumList from './components/ForumList.jsx'
import ThreadView from './components/ThreadView.jsx'
import AuthModal from './components/AuthModal.jsx'

// ── Global Auth Context ──────────────────────────────────────────────────────
export const AuthCtx = createContext(null)
export function useAuth() { return useContext(AuthCtx) }

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState(undefined) // undefined = loading
  const [staffSession, setStaffSession] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Handle Discord OAuth callback token in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')
    const error = params.get('error')
    if (token || error) {
      window.history.replaceState({}, '', location.pathname)
      if (token) {
        saveStaffToken(token)
        setStaffSession(getStaffSession())
      }
      if (error) {
        const msgs = {
          not_staff: 'You are not a staff member on AstralyxPvP.',
          token_failed: 'Discord auth failed. Try again.',
          server_error: 'Server error during login.',
        }
        alert(msgs[error] || `Login error: ${error}`)
      }
    } else {
      setStaffSession(getStaffSession())
    }
  }, [])

  // Firebase auth listener
  useEffect(() => {
    const unsub = onUserChange(user => setFirebaseUser(user))
    return unsub
  }, [])

  const loading = firebaseUser === undefined

  // Merged user object for consumers
  const user = staffSession
    ? { uid: staffSession.userId, displayName: staffSession.username, avatar: staffSession.avatar, role: staffSession.role, isStaff: true, isPlayer: false }
    : firebaseUser
      ? { uid: firebaseUser.uid, displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0], avatar: null, role: 'Player', isStaff: false, isPlayer: true }
      : null

  const logout = async () => {
    clearStaffSession()
    setStaffSession(null)
    await signOut()
  }

  return (
    <AuthCtx.Provider value={{ user, loading, logout, openAuth: () => setShowAuth(true) }}>
      <div className="page-enter">
        <Navbar />
        <main className="page-content">
          <div className="wrap">
            <Routes>
              <Route path="/"           element={<ForumList />} />
              <Route path="/thread/:id" element={<ThreadView />} />
            </Routes>
          </div>
        </main>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onStaffLogin={() => { setShowAuth(false) }} />}
    </AuthCtx.Provider>
  )
}
