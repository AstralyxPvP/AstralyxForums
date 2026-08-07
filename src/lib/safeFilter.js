const LEET_MAP = {
  '@': 'a', '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
  '7': 't', '$': 's', '!': 'i', '+': 't', '8': 'b', '6': 'g', '9': 'g', '2': 'z'
};

export const BANNED_WORDS = new Set([
  'ass', 'asshole', 'assholes', 'asswipe', 'arse', 'arsehole', 'arseholes',
  'bastard', 'bastards', 'bitch', 'bitches', 'bitching', 'bitchy',
  'bullshit', 'bullshits', 'bullshitter', 'bullshitters',
  'bellend', 'bellends', 'bollocks', 'cocksucker', 'cocksuckers',
  'cock', 'cocks', 'cum', 'cunt', 'cunts',
  'dick', 'dicks', 'dickhead', 'dickheads', 'dickwad', 'dumbass', 'dumbasses',
  'fag', 'fags', 'faggot', 'faggots', 'fagot', 'fagots',
  'fuck', 'fucks', 'fucker', 'fuckers', 'fucking', 'fuckwad', 'fuckwit',
  'fck', 'fuk', 'fkn', 'phuck',
  'knobhead', 'knobheads', 'motherfucker', 'motherfuckers', 'motherfucking',
  'nigger', 'niggers', 'nigga', 'niggas', 'niggaz', 'negro',
  'prick', 'pricks', 'pussy', 'pussies', 'pussys',
  'retard', 'retards', 'retarded',
  'shit', 'shits', 'shitty', 'shitting', 'shite', 'shyt', 'sht',
  'slut', 'sluts', 'slutty', 'scumbag', 'scumbags',
  'tosser', 'tossers', 'twat', 'twats', 'twatty',
  'wank', 'wanks', 'wanker', 'wankers', 'whore', 'whores',
  'chink', 'chinks', 'spic', 'spics', 'wetback', 'wetbacks', 'kike', 'kikes'
]);

// Longer stems used for embedded/substring detection (length >= 5 avoids
// false positives like "scunthorpe" → "cunt", "ass" inside "password", etc.)
const EMBEDDED_STEMS = [...BANNED_WORDS].filter((w) => w.length >= 5);

// Collapse repeated letters ("fuuuuck" → "fuck", "niiigger" → "niger")
function collapseRepeats(str) {
  return str.replace(/(.)\1+/g, '$1');
}

function normalizeWord(word) {
  let w = String(word).toLowerCase();
  w = [...w].map((c) => LEET_MAP[c] || c).join('');
  return w.replace(/[^a-z]/g, '');
}

// Whole-token + duplicate-letter + embedded-word detection.
// Returns [{ index, end, word }] mapped to the ORIGINAL text so censoring works.
function findMatches(text) {
  const tokenRe = /[A-Za-z0-9]+/g;
  const matches = [];
  let m;
  while ((m = tokenRe.exec(text))) {
    const norm = normalizeWord(m[0]);
    if (BANNED_WORDS.has(norm)) {
      matches.push({ index: m.index, end: m.index + m[0].length, word: m[0] });
      continue;
    }
    // Duplicate-letter evasion: "fuuuuck", "niiigger", "asssss"
    const collapsed = collapseRepeats(norm);
    if (BANNED_WORDS.has(collapsed)) {
      matches.push({ index: m.index, end: m.index + m[0].length, word: m[0] });
      continue;
    }
    // Embedded evasion inside a longer token: "xxfuckingxx"
    for (const stem of EMBEDDED_STEMS) {
      if (collapsed.includes(stem)) {
        matches.push({ index: m.index, end: m.index + m[0].length, word: m[0] });
        break;
      }
    }
  }
  return matches;
}

// Separated-letter evasion ("f u c k", "f.u.c.k", "f_u_c_k") → returns the
// joined banned words found. Indices can't map cleanly back to the original,
// so callers use this to BLOCK rather than censor. A separator is required
// between every letter, so ordinary words like "password" never false-positive.
export function detectSeparatedWords(text) {
  const found = [];
  const source = String(text);
  for (const word of BANNED_WORDS) {
    if (word.length < 4) continue;
    const escaped = [...word].map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const sepRe = new RegExp(escaped.map((c, i) => (i === escaped.length - 1 ? c : `${c}[^a-z0-9]+`)).join(''), 'i');
    if (sepRe.test(source)) found.push(word);
  }
  return found;
}

// URL / social-media / invite spam detection
const SPAM_PATTERNS = [
  { re: /(?:discord\.gg|discordapp\.com\/invite|dsc\.gg|discord\.me)\/\S+/i, reason: 'Discord invite link' },
  { re: /(?:t\.me\/|telegram\.me\/|wa\.me\/)\S+/i, reason: 'Telegram/WhatsApp invite' },
  { re: /(?:discord\.com\/invite|invite\.gg)\S*/i, reason: 'Discord invite link' },
  { re: /(?:tiktok\.com|snapchat\.com|instagram\.com|twitter\.com|x\.com|youtube\.com|youtu\.be)\/\S+/i, reason: 'Social media link' },
];

export function spamCheck(text) {
  if (!text) return { spam: false, reason: '', links: 0 };
  for (const { re, reason } of SPAM_PATTERNS) {
    const matches = text.match(re);
    if (matches) {
      return { spam: true, reason, links: matches.length };
    }
  }
  // Generic URL flood — 3+ links in one message
  const urlCount = (text.match(/https?:\/\/[^\s]+/gi) || []).length;
  if (urlCount >= 3) {
    return { spam: true, reason: 'Too many links in one message', links: urlCount };
  }
  return { spam: false, reason: '', links: urlCount };
}

export function censorText(text) {
  if (!text) return { clean: text, censored: false, words: [] };
  const matches = findMatches(text);
  if (matches.length === 0) return { clean: text, censored: false, words: [] };

  let clean = text;
  for (const m of [...matches].reverse()) {
    clean = clean.slice(0, m.index) + '*'.repeat(m.end - m.index) + clean.slice(m.end);
  }
  return { clean, censored: true, words: matches.map((m) => m.word) };
}

export function filterValue(value) {
  const res = censorText(value);
  if (res.censored) {
    alert('Some words in your message were automatically filtered before posting.');
  }
  return res.clean;
}
