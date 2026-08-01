import { censorText } from './safeFilter';

const DESIBOT_URL = (import.meta.env.VITE_DESIBOT_URL || '').replace(/\/+$/, '');
const FORUM_SECRET = import.meta.env.VITE_FORUM_SECRET || '';

export function aiModerationConfigured() {
  return Boolean(DESIBOT_URL && FORUM_SECRET);
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

export async function checkContent(value) {
  const res = censorText(value);
  if (res.censored) {
    alert('Some words in your message were automatically filtered before posting.');
  }
  const ai = await moderateWithAI(res.clean);
  if (ai.verdict === 'block') {
    alert('Your message was blocked by the content moderator.' + (ai.reason ? `\nReason: ${ai.reason}` : ''));
    return null;
  }
  return res.clean;
}
