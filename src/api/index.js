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

export async function apiFetch(endpoint, options = {}) {
  options.credentials = 'include';
  
  // Attach token from localStorage if available
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('astral_token') : null;

  const headers = {
    ...(options.headers || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  options.headers = headers;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API Request failed');
  return data;
}
