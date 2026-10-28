/**
 * Tour stops: where the docent can take someone, and what it says there.
 *
 * `scroll` is what it brings into view, `spot` is the smaller element it rings
 * (a whole section is too tall to outline). The narration here is the fallback
 * used when the model is unavailable or did not supply its own note — the model
 * is free to reorder the route and rewrite the words.
 */

export const STOPS = {
  hero: {
    scroll: '#top',
    spot: '.hero-title',
    title: 'Opening',
    narration:
      'This is Dao Vinh Khang — an AI engineer in Ho Chi Minh City. What follows is shipped work, not a prototype shelf.',
  },
  about: {
    scroll: '#about',
    spot: '#about .split',
    title: 'The short version',
    narration:
      'The short version: he builds production AI systems — agents, retrieval pipelines, speech models — and cares about what happens after the demo.',
  },
  work: {
    scroll: '#work',
    spot: '#work .tabs',
    title: 'Shipped systems',
    narration:
      'Start with the flagship. KAMI Pro is a native AI work layer inside Odoo 17–19: every write passes approval gates, a dry-run diff, and an audit ledger you can undo.',
  },
  capabilities: {
    scroll: '#capabilities',
    spot: '#capabilities .cap-grid',
    title: 'The stack',
    narration:
      'The stack underneath: Python and FastAPI, LangGraph runtimes, MongoDB, Redis and Weaviate for state and retrieval, Langfuse for tracing.',
  },
  metrics: {
    scroll: '#work',
    spot: '.cred-strip',
    title: 'The numbers',
    narration:
      'The numbers he would point to first: retrieval cut from about 30 seconds to under 5, and speech-to-text at CER 0.066 — roughly 60% better than baseline.',
  },
  experience: {
    scroll: '#experience',
    spot: '#experience .exp-list',
    title: 'Where he has worked',
    narration:
      'Four roles so far: bTaskee on the Tasker platform now, EraX and Gtel before that, then FPT IS, and teaching AI at FPT Greenwich.',
  },
  education: {
    scroll: '#education',
    spot: '#education .edu-grid',
    title: 'Education',
    narration: 'FPT University, AI major — and a teaching assistantship while still studying.',
  },
  contact: {
    scroll: '#contact',
    spot: '#contact .contact-grid',
    title: 'Reaching him',
    narration:
      'That is the tour. If any of it is relevant to what you are hiring for, the contact section has the email and links.',
  },
};

export const TOUR_IDS = Object.keys(STOPS);

/** The route used when nothing steers it. */
export const DEFAULT_ROUTE = ['hero', 'work', 'capabilities', 'experience', 'contact'];

export const TOUR_DWELL = 7000;

/**
 * Turn a list of ids (plus optional model-written notes) into playable stops.
 * Unknown ids are dropped so a hallucinated stop can never break the walk.
 */
export function buildStops(ids, notes = {}) {
  const seen = new Set();
  const stops = [];

  for (const id of ids) {
    if (!STOPS[id] || seen.has(id)) continue;
    seen.add(id);
    const base = STOPS[id];
    stops.push({
      id,
      scroll: base.scroll,
      spot: base.spot,
      title: base.title,
      narration: (notes[id] || '').trim() || base.narration,
    });
    if (stops.length === 6) break;
  }

  return stops.length >= 2 ? stops : buildStops(DEFAULT_ROUTE);
}
