export const API_BASE_URL = 'https://api.astralyxpvp.workers.dev';
export const SITE_ORIGIN = 'https://astralyxforums.pages.dev';

export const ROLE_MAP = [
  'Owner', 'Co-Owner', 'Chief Manager', 'Sr. Manager', 'Manager',
  'Sr. Developer', 'Developer', 'Jr. Developer', 'Admin', 'Sr. Mod',
  'Mod', 'Jr. Mod', 'Helper', 'Trial Staff', 'Veteran (Ex-Staff)',
  'YouTube Rank', 'Astralyx+', 'AstralyxBot', 'Chat Assistant', 'Meme Lord', 'Member'
];

export function formatAuthorName(name) {
  if (!name || name === 'undefined' || name.trim() === '') {
    return 'Deleted User';
  }
  return name;
}

export function getRoleRank(roleTag) {
  const idx = ROLE_MAP.indexOf(roleTag);
  return idx === -1 ? 999 : idx;
}

export function canModerateRole(actorRoleTag, targetRoleTag) {
  return getRoleRank(actorRoleTag) < getRoleRank(targetRoleTag);
}

// Generate or reuse a persistent hardware/browser fingerprint
function getDeviceFingerprint() {
  if (typeof localStorage === 'undefined') return 'none';
  let fp = localStorage.getItem('astral_device_fp');
  if (!fp) {
    const raw = `${navigator.userAgent}-${navigator.language}-${screen.colorDepth}x${screen.width}x${screen.height}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    fp = `fp_${Math.abs(hash).toString(16)}`;
    localStorage.setItem('astral_device_fp', fp);
  }
  return fp;
}

export async function apiFetch(endpoint, options = {}) {
  // Attach token from localStorage if available
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('astral_token') : null;

  const headers = {
    'X-Device-Fingerprint': getDeviceFingerprint(),
    ...(options.headers || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // Guarantees astral_session and session_id cookies are passed cross-origin
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && typeof localStorage !== 'undefined') {
      localStorage.removeItem('astral_token');
    }
    throw new Error(data.error || 'API Request failed');
  }

  return data;
}
