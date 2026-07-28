// src/auth.js
// Staff  → Discord OAuth → JWT (sessionStorage)
// Players → DreamLong's worker API → session cookies

const WORKER = 'https://forum-api.chessmrbeaston.workers.dev'
const DISCORD_CLIENT_ID = 'YOUR_DISCORD_CLIENT_ID' // ← replace

// ── JWT helpers (staff only) ─────────────────────────────────────────────────
function parseJWT(token) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))
  } catch { return null }
}

function isJWTValid(token) {
  const p = parseJWT(token)
  return p && p.exp > Math.floor(Date.now() / 1000)
}

export function getStaffSession() {
  const token = sessionStorage.getItem('fr_token')
  if (!token || !isJWTValid(token)) { sessionStorage.removeItem('fr_token'); return null }
  return { token, ...parseJWT(token) }
}

export function saveStaffToken(token) { sessionStorage.setItem('fr_token', token) }
export function clearStaffSession()  { sessionStorage.removeItem('fr_token') }

export function loginWithDiscord() {
  const state = btoa(JSON.stringify({ nonce: crypto.randomUUID(), from: 'forums' }))
  sessionStorage.setItem('fr_oauth_state', state)
  const redir = encodeURIComponent(`${location.origin}/discord-callback`)
  location.href = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${redir}&response_type=code&scope=identify+guilds.members.read&state=${encodeURIComponent(state)}`
}

// ── Player auth (DreamLong's worker) ─────────────────────────────────────────
export async function signUp(email, password, username) {
  const r = await fetch(`${WORKER}/api/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username }),
  })
  const d = await r.json()
  if (!r.ok) throw new Error(d.error || 'Registration failed')
  return d
}

export async function signIn(email, password) {
  const r = await fetch(`${WORKER}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const d = await r.json()
  if (!r.ok) throw new Error(d.error || 'Login failed')
  return d
}

export async function getPlayerSession() {
  try {
    const r = await fetch(`${WORKER}/api/auth/me`, { credentials: 'include' })
    const d = await r.json()
    if (d.authenticated) return d.user
    return null
  } catch { return null }
}

export async function signOut() {
  clearStaffSession()
  // Cookies cleared server-side on next /api/auth/me call automatically
}

// ── Auth header for forum API calls ─────────────────────────────────────────
// Staff sends JWT, players rely on cookies (no header needed)
export function getAuthHeader() {
  const staff = getStaffSession()
  if (staff) return `Bearer ${staff.token}`
  return null // player sessions use cookies automatically
}