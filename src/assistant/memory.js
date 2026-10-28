/**
 * Visitor memory: what the assistant keeps between visits, and how it reads the
 * visitor's register so it can answer in the same voice.
 *
 * Everything lives in localStorage on the visitor's own machine — nothing is
 * stored server-side, and the proxy is stateless. The profile is compressed to
 * a few lines before it is sent, because it rides in the system prompt on every
 * turn and the point is continuity, not a dossier.
 */

const KEY = 'khang.assistant.v1';
const MAX_TURNS = 10;
const MAX_CHARS = 360;

const EMPTY = {
  version: 1,
  firstSeen: null,
  lastSeen: null,
  visits: 0,
  lang: '',
  style: null,
  messages: [],
  shown: [],
  topics: [],
};

/* ---- storage (never throws: private mode blocks localStorage) ----------- */

export function loadMemory() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return { ...EMPTY };
    return { ...EMPTY, ...parsed };
  } catch {
    return { ...EMPTY };
  }
}

export function saveMemory(mem) {
  try {
    localStorage.setItem(KEY, JSON.stringify(mem));
  } catch {
    /* quota or private mode — continuity is nice to have, not essential */
  }
}

export function clearMemory() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/* ---- style inference ----------------------------------------------------- */

const EMOJI = /\p{Extended_Pictographic}/u;

// Vietnamese marks register mostly through pronouns and sentence-final particles.
const VI_CASUAL = ['mình', 'bạn', 'tớ', 'cậu', 'nhé', 'nha', 'nè', 'á', 'đó', 'oke', 'hihi', 'hì'];
const VI_FORMAL = ['ạ', 'vâng', 'dạ', 'kính', 'quý', 'xin chào', 'thưa'];
const EN_CASUAL = ['hey', 'yo', 'hiya', 'gonna', 'wanna', 'thanks!', 'thx', 'pls', 'lol'];
const EN_FORMAL = ['would you', 'could you kindly', 'dear ', 'sincerely', 'i would like to'];

const has = (text, words) => words.some((w) => text.includes(w));

/** Read language + register from what the visitor actually typed. */
export function inferStyle(texts) {
  const all = texts.join('\n').toLowerCase();
  if (!all.trim()) return null;

  const words = all.split(/\s+/).filter(Boolean);
  const avgWords = Math.round(words.length / Math.max(1, texts.length));

  const isVi = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/u.test(all);

  const casual = (isVi ? has(all, VI_CASUAL) : has(all, EN_CASUAL)) || words.length < 12;
  const formal = (isVi ? has(all, VI_FORMAL) : has(all, EN_FORMAL)) || /\b(please|kindly|respectfully)\b/.test(all);

  let register = 'neutral';
  if (formal && !casual) register = 'formal';
  else if (casual && !formal) register = 'casual';
  else if (casual && formal) register = 'mixed';

  // Which pronouns they use, so the reply can mirror the same pair.
  const pronouns = ['mình', 'bạn', 'tớ', 'cậu', 'tôi', 'anh', 'chị', 'em'].filter((p) => all.includes(p));

  return {
    lang: isVi ? 'vi' : 'en',
    register,
    pronouns: pronouns.slice(0, 4),
    emoji: EMOJI.test(all),
    avgWords,
    technical: /\b(api|latency|rag|llm|embedding|vector|pipeline|runtime|odoo|langgraph)\b/.test(all),
  };
}

/** Merge what we just learned into the stored profile. */
export function mergeStyle(prev, next) {
  if (!next) return prev;
  if (!prev) return next;
  return {
    lang: next.lang || prev.lang,
    register: next.register === 'neutral' ? prev.register : next.register,
    pronouns: next.pronouns.length ? next.pronouns : prev.pronouns,
    emoji: next.emoji || prev.emoji,
    avgWords: Math.round((prev.avgWords + next.avgWords) / 2) || next.avgWords,
    technical: next.technical || prev.technical,
  };
}

/* ---- what the model is told --------------------------------------------- */

const LANG_NAME = { vi: 'Vietnamese', en: 'English' };

/**
 * Build the VISITOR block. Kept to a handful of lines: it is prompt budget, and
 * a long dossier reads worse than three precise facts.
 */
export function visitorPrompt(mem, viewing) {
  const style = mem.style;
  const lines = [];

  if (mem.visits > 1) {
    const when = mem.lastSeen ? relativeTime(mem.lastSeen) : '';
    lines.push(`- Returning visitor: visit ${mem.visits}${when ? `, last seen ${when}` : ''}.`);
  } else if (mem.visits === 1) {
    lines.push('- First visit.');
  }

  if (style) {
    const lang = LANG_NAME[style.lang] || 'English';
    const bits = [`- Writes in ${lang}`, `register: ${style.register}`];
    if (style.pronouns.length) bits.push(`uses "${style.pronouns.join('", "')}"`);
    bits.push(style.emoji ? 'uses emoji' : 'no emoji');
    bits.push(`messages average ${style.avgWords} words`);
    if (style.technical) bits.push('comfortable with technical terms');
    lines.push(`${bits.join(' · ')}.`);
    lines.push(
      `- Write the way they write: mirror those pronouns and that formality, keep your sentences about as long as theirs, and never sound more formal than they do. If they are casual, be casual; if they are formal, be formal.`,
    );
  }

  if (viewing) lines.push(`- Currently looking at: ${viewing}.`);
  if (mem.shown?.length) lines.push(`- Already shown: ${mem.shown.slice(-4).join(', ')}. Do not walk them back to something unless they ask.`);
  if (mem.topics?.length) lines.push(`- Earlier topics: ${mem.topics.slice(-4).join(', ')}.`);

  return lines.join('\n');
}

function relativeTime(iso) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/* ---- conversation continuity -------------------------------------------- */

export function rememberTurn(mem, role, text) {
  if (!text) return mem;
  const clean = String(text).trim().slice(0, MAX_CHARS);
  if (!clean) return mem;
  const messages = [...mem.messages, { role, text: clean }].slice(-MAX_TURNS);
  return { ...mem, messages, lastSeen: new Date().toISOString() };
}

/** Was there a real exchange (not just the greeting) to resume? */
export function hasHistory(mem) {
  return mem.messages.some((m) => m.role === 'user');
}

export function noteShown(mem, id) {
  if (!id) return mem;
  const shown = [...(mem.shown || []).filter((x) => x !== id), id].slice(-8);
  return { ...mem, shown };
}

export function noteTopic(mem, topic) {
  if (!topic) return mem;
  const topics = [...(mem.topics || []).filter((x) => x !== topic), topic].slice(-8);
  return { ...mem, topics };
}

/** Which section is on screen right now — the assistant's spatial context. */
export function currentSection() {
  const ids = ['work', 'capabilities', 'experience', 'education', 'contact', 'about'];
  const mid = window.innerHeight * 0.4;
  let best = '';
  let bestDist = Infinity;
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) continue;
    const dist = Math.abs(r.top - mid);
    if (dist < bestDist) {
      bestDist = dist;
      best = id;
    }
  }
  return best;
}
