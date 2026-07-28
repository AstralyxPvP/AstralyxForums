// src/auth.js
// Manages both Firebase (player) and Discord (staff) JWT sessions

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from './firebase.js'

const DISCORD_CLIENT_ID = 'YOUR_DISCORD_CLIENT_ID' // ← replace

// ── JWT helpers ─────────────────────────────────────────────────────────────
function parseJWT(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(payload))
  } catch { return null }
}

function isJWTValid(token) {
  const p = parseJWT(token)
  return p && p.exp > Math.floor(Date.now() / 1000)
}

// ── Staff (Discord) session ──────────────────────────────────────────────────
export function getStaffSession() {
  const token = sessionStorage.getItem('fr_token')
  if (!token || !isJWTValid(token)) {
    sessionStorage.removeItem('fr_token')
    return null
  }
  return { token, ...parseJWT(token) }
}

export function saveStaffToken(token) {
  sessionStorage.setItem('fr_token', token)
}

export function clearStaffSession() {
  sessionStorage.removeItem('fr_token')
}

export function loginWithDiscord() {
  const state = btoa(JSON.stringify({ nonce: crypto.randomUUID(), from: 'forums' }))
  sessionStorage.setItem('fr_oauth_state', state)
  const redir = encodeURIComponent(`${location.origin}/discord-callback`)
  location.href = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${redir}&response_type=code&scope=identify+guilds.members.read&state=${encodeURIComponent(state)}`
}

// ── Player (Firebase) auth ───────────────────────────────────────────────────
export async function signUp(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function signIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function signOut() {
  clearStaffSession()
  await firebaseSignOut(auth)
}

export function onUserChange(cb) {
  return onAuthStateChanged(auth, cb)
}

// ── Get auth header for API calls ────────────────────────────────────────────
// Staff: sends their signed JWT
// Players: sends Firebase ID token
export async function getAuthHeader() {
  const staff = getStaffSession()
  if (staff) return `Bearer ${staff.token}`

  const user = auth.currentUser
  if (user) {
    const idToken = await user.getIdToken()
    return `Bearer firebase:${idToken}`
  }
  return null
}
