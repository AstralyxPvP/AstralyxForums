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

function normalizeWord(word) {
  let w = String(word).toLowerCase();
  w = [...w].map((c) => LEET_MAP[c] || c).join('');
  return w.replace(/[^a-z]/g, '');
}

function findMatches(text) {
  const tokenRe = /[A-Za-z0-9]+/g;
  const matches = [];
  let m;
  while ((m = tokenRe.exec(text))) {
    const norm = normalizeWord(m[0]);
    if (BANNED_WORDS.has(norm)) {
      matches.push({ index: m.index, end: m.index + m[0].length, word: m[0] });
    }
  }
  return matches;
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
