import { censorText, detectSeparatedWords, spamCheck } from './safeFilter';

const DESIBOT_URL = (import.meta.env.VITE_DESIBOT_URL || '').replace(/\/+$/, '');
const FORUM_SECRET = import.meta.env.VITE_FORUM_SECRET || '';

export function aiModerationConfigured() {
  return Boolean(DESIBOT_URL && FORUM_SECRET);
}

// Lightweight per-user client-side rate limiting (posts per window).
// Degrades gracefully: without a userId the check is skipped.
const POST_LIMIT = 3;
const POST_WINDOW_MS = 15000;
const postTracker = new Map();

function checkRateLimit(userId) {
  if (!userId) return true;
  const now = Date.now();
  const stamps = (postTracker.get(userId) || []).filter((t) => now - t < POST_WINDOW_MS);
  stamps.push(now);
  postTracker.set(userId, stamps);
  return stamps.length <= POST_LIMIT;
}

export async function moderateWithAI(text) {
  if (!aiModerationConfigured() || !text) return { verdict: 'ok', enabled: false };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(DESIBOT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FORUM_SECRET}`
      },
      body: JSON.stringify({ type: 'moderate', content: text }),
      signal: controller.signal
    });
    if (!res.ok) return { verdict: 'ok', enabled: true, error: res.status };
    const data = await res.json();
    return {
      verdict: data.verdict,
      rule: data.rule,
      reason: data.reason,
      confidence: data.confidence,
      layer: data.layer,
      enabled: true
    };
  } catch {
    return { verdict: 'ok', enabled: true, error: 'unreachable' };
  } finally {
    clearTimeout(timer);
  }
}

export async function checkContent(value, userId) {
  const res = censorText(value);
  if (res.censored) {
    alert('Some words in your message were automatically filtered before posting.');
  }

  // Separated-letter evasion ("f u c k", "f.u.c.k") → block outright
  const separated = detectSeparatedWords(res.clean);
  if (separated.length > 0) {
    alert(`Your message was blocked by the content moderator.\nReason: Detected "${separated[0]}" split across characters.`);
    return null;
  }

  // URL / social / invite spam → block
  const spam = spamCheck(res.clean);
  if (spam.spam) {
    alert(`Your message was blocked by the content moderator.\nReason: ${spam.reason}`);
    return null;
  }

  // Per-user rate limiting
  if (!checkRateLimit(userId)) {
    alert('Slow down! You are posting too quickly. Please wait a moment.');
    return null;
  }

  const ai = await moderateWithAI(res.clean);
  if (ai.verdict === 'block') {
    alert('Your message was blocked by the content moderator.' + (ai.reason ? `\nReason: ${ai.reason}` : ''));
    return null;
  }
  return res.clean;
}
