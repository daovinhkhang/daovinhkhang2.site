/**
 * The director: turns a validated tool call into visible movement on the page.
 *
 * The guide has a body here. A pointer flies from the chat to whatever it is
 * talking about, "presses" tabs and accordions with a ripple, rings the thing
 * it means and pins a note beside it. Scrolls are awaited until the page has
 * actually settled, so the pointer never lands on a spot that is still moving.
 *
 * Coupling to React stays at two CustomEvents (ai:show-system,
 * ai:open-experience). prefers-reduced-motion turns every move into a jump.
 */

import { EXPERIENCES as ROLES, SYSTEMS as SYSTEM_DATA, STATS, PROFILE, CAPABILITIES, CREDENTIALS } from '../content';
import { LANDMARKS, LINKS } from './tools';

const reduce = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const frame = () => new Promise((r) => requestAnimationFrame(() => r()));

/* ---- geometry ----------------------------------------------------------- */

/** What is covering the page: the sticky header on top, the companion below. */
function obstruction() {
  const header = document.querySelector('.site-header');
  const ticker = document.querySelector('.ticker');
  const top = (header?.getBoundingClientRect().height ?? 0) + (ticker?.getBoundingClientRect().height ?? 0);
  // On a phone the companion is a bottom sheet spanning the width; on a wide
  // screen it is a card in the corner and the page stays readable beside it.
  const sheet = document.querySelector('.as-panel.is-companion');
  let bottom = 0;
  if (sheet) {
    const r = sheet.getBoundingClientRect();
    if (r.width > window.innerWidth * 0.7) bottom = Math.max(0, window.innerHeight - r.top);
  }
  return { top, bottom };
}

/** Resolve once the page has stopped moving (scrollend, or 120ms of stillness). */
function settle(max = 1600) {
  return new Promise((resolve) => {
    let last = window.scrollY;
    let still = 0;
    const started = performance.now();
    const done = () => {
      window.removeEventListener('scrollend', done);
      resolve();
    };
    window.addEventListener('scrollend', done, { once: true });
    const tick = () => {
      if (performance.now() - started > max) return done();
      if (Math.abs(window.scrollY - last) < 1) still += 16;
      else still = 0;
      last = window.scrollY;
      if (still >= 120) return done();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/** Smooth-scroll an element into the part of the viewport nothing covers. */
export function scrollIntoView(el, extra = 12) {
  if (!el) return;
  const { top: covered, bottom } = obstruction();
  const r = el.getBoundingClientRect();
  const room = window.innerHeight - covered - bottom;
  // Short targets are centred in the free band; tall ones start at its top.
  const lead = r.height < room - 2 * extra ? (room - r.height) / 2 : extra;
  const top = r.top + window.scrollY - covered - Math.min(lead, room * 0.3);
  window.scrollTo({ top: Math.max(0, top), behavior: reduce() ? 'auto' : 'smooth' });
}

async function bring(el, extra) {
  if (!el) return;
  scrollIntoView(el, extra);
  await settle();
}

/* ---- the pointer --------------------------------------------------------- */

let cursor = null;
let cursorIdle = 0;

function ensureCursor() {
  if (cursor && document.body.contains(cursor)) return cursor;
  cursor = document.createElement('div');
  cursor.className = 'ai-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML =
    '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 3l7.5 18 2.4-7.1L21 11.5z" fill="#e7f9a1" stroke="#0213b0" stroke-width="1.8" stroke-linejoin="round"/></svg><span class="ai-cursor-tag">K</span>';
  // It is born at the chat, so the first flight visibly comes from the guide.
  const origin = document.querySelector('.as-panel') || document.querySelector('.as-toggle');
  const r = origin?.getBoundingClientRect();
  const x = r ? r.left + 24 : window.innerWidth - 60;
  const y = r ? r.top + 40 : window.innerHeight - 60;
  cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  document.body.appendChild(cursor);
  return cursor;
}

/** Fly the pointer to an element; resolves when it has landed. */
async function flyTo(el, { press = false } = {}) {
  if (!el) return;
  const c = ensureCursor();
  clearTimeout(cursorIdle);
  await frame();
  c.classList.add('is-on');
  const r = el.getBoundingClientRect();
  // Aim a little inside the top-left third: where a hand would actually point.
  const x = Math.min(window.innerWidth - 28, Math.max(8, r.left + Math.min(r.width * 0.32, 160)));
  const y = Math.min(window.innerHeight - 28, Math.max(8, r.top + Math.min(r.height * 0.4, 56)));
  c.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  await wait(reduce() ? 0 : 640);
  if (press) {
    c.classList.add('is-press');
    ripple(x, y);
    await wait(reduce() ? 0 : 220);
    c.classList.remove('is-press');
  }
  cursorIdle = setTimeout(() => c.classList.remove('is-on'), 4200);
}

function ripple(x, y) {
  if (reduce()) return;
  const dot = document.createElement('span');
  dot.className = 'ai-ripple';
  dot.style.left = `${x}px`;
  dot.style.top = `${y}px`;
  document.body.appendChild(dot);
  setTimeout(() => dot.remove(), 700);
}

/* ---- spotlight + pinned note -------------------------------------------- */

let disposeSpot = () => {};

/**
 * Ring an element and pin a note beside it. Returns a disposer. Only one is
 * ever on screen: a new one clears the last, so nothing is stranded.
 */
export function spotlight(el, label, note = '') {
  disposeSpot();
  if (!el) return () => {};

  const ring = document.createElement('div');
  ring.className = 'ai-spotlight';
  ring.setAttribute('aria-hidden', 'true');
  if (label) {
    const tag = document.createElement('span');
    tag.className = 'ai-spotlight-tag';
    tag.textContent = label;
    ring.appendChild(tag);
  }

  let callout = null;
  if (note) {
    callout = document.createElement('div');
    callout.className = 'ai-callout';
    callout.setAttribute('role', 'note');
    callout.textContent = note;
    document.body.appendChild(callout);
  }
  document.body.appendChild(ring);

  const place = () => {
    const r = el.getBoundingClientRect();
    const pad = 10;
    ring.style.transform = `translate3d(${r.left - pad}px, ${r.top - pad}px, 0)`;
    ring.style.width = `${r.width + pad * 2}px`;
    ring.style.height = `${r.height + pad * 2}px`;
    if (!callout) return;

    // Below the ring if it fits above the companion, else above; always
    // clamped to a 16px gutter so it never runs off a phone screen.
    const { top: covered, bottom } = obstruction();
    const cw = callout.offsetWidth;
    const ch = callout.offsetHeight;
    const gutter = 16;
    const x = Math.min(window.innerWidth - cw - gutter, Math.max(gutter, r.left));
    const below = r.bottom + pad + 10;
    const above = r.top - pad - 10 - ch;
    let y;
    let side;
    if (below + ch < window.innerHeight - bottom - gutter) {
      y = below;
      side = 'below';
    } else if (above > covered + gutter) {
      y = above;
      side = 'above';
    } else {
      // Tall target: pin the note inside its top edge.
      y = Math.max(covered + gutter, r.top + pad);
      side = 'inside';
    }
    callout.dataset.side = side;
    callout.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    const tip = Math.min(cw - 24, Math.max(16, r.left + 24 - x));
    callout.style.setProperty('--tip', `${tip}px`);
  };

  place();
  requestAnimationFrame(() => {
    ring.classList.add('is-on');
    callout?.classList.add('is-on');
  });

  const onMove = () => place();
  window.addEventListener('scroll', onMove, { passive: true });
  window.addEventListener('resize', onMove);

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    window.removeEventListener('scroll', onMove);
    window.removeEventListener('resize', onMove);
    ring.classList.remove('is-on');
    callout?.classList.remove('is-on');
    setTimeout(() => {
      ring.remove();
      callout?.remove();
    }, 400);
  };
  disposeSpot = dispose;
  return dispose;
}

/** Clear any ring, note and pointer — used when the visitor takes over. */
export function clearStage() {
  disposeSpot();
  disposeSpot = () => {};
  cursor?.classList.remove('is-on');
}

/* ---- tour support ------------------------------------------------------- */

export function focusStop(stop) {
  const scrollEl = document.querySelector(stop.scroll);
  if (scrollEl) scrollIntoView(scrollEl, 24);
  const spotEl = stop.spot ? document.querySelector(stop.spot) : null;
  if (!spotEl) return () => {};
  return spotlight(spotEl, stop.title);
}

/* ---- reading the page ---------------------------------------------------- */

const clip = (t, n = 1800) => (t.length > n ? `${t.slice(0, n)}…` : t);
const textOf = (el) => (el?.innerText || '').replace(/\n{3,}/g, '\n\n').trim();

function readTarget(target) {
  if (target.startsWith('system:')) {
    const s = SYSTEM_DATA.find((x) => x.id === target.slice(7));
    if (!s) return 'Not found.';
    return clip(
      [
        `${s.name} (${s.year}, ${s.badge}). ${s.tag || ''}`,
        s.summary,
        ...(s.points || []).map((p) => `- ${p}`),
        `Stack: ${(s.stack || []).join(', ')}`,
        s.videos?.length ? `Has ${s.videos.length} demo video(s).` : 'No demo video.',
        s.link ? `Link: ${s.link.label}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }
  if (target.startsWith('role:')) {
    const j = ROLES.find((x) => x.id === target.slice(5));
    if (!j) return 'Not found.';
    return clip([`${j.company} — ${j.role}, ${j.time}`, ...j.bullets.map((b) => `- ${b}`), `Stack: ${j.stack.join(', ')}`].join('\n'));
  }
  if (target === 'stats') return STATS.map((s) => `${s.value}: ${s.label}`).join('\n');
  if (target === 'profile') return PROFILE.join('\n');
  if (target === 'capabilities') return CAPABILITIES.map((c) => `${c.title}: ${c.items.join('; ')}`).join('\n');
  if (target === 'credentials') return CREDENTIALS.map((c) => `${c.k}: ${c.v}`).join('\n');

  const el = LANDMARKS[target] ? document.querySelector(LANDMARKS[target].sel) : document.getElementById(target);
  const text = textOf(el);
  return text ? clip(text) : 'That part of the page is empty right now.';
}

/* ---- running a call ------------------------------------------------------ */

const landmark = (id) => (LANDMARKS[id] ? document.querySelector(LANDMARKS[id].sel) : null);

/**
 * Run one validated call. Resolves to { result, step, shown }:
 *   result — what the model is told happened (truthful, terse)
 *   step   — the model's own words for it, if it gave any
 *   shown  — true when the visitor saw the page change (the widget then
 *            records a step, in their language when the model gave no words)
 */
export async function runTool({ name, args }) {
  switch (name) {
    case 'read_page':
      return { result: readTarget(args.target), step: '' };

    case 'navigate': {
      const el = landmark(args.to) || document.getElementById(args.to);
      if (!el) return { result: `Could not find ${args.to}.`, step: '' };
      await bring(el, 24);
      await flyTo(el);
      return { result: `Scrolled to ${args.to}; it is on screen.`, step: args.say, shown: true };
    }

    case 'show_system':
    case 'play_demo': {
      const tab = document.getElementById(`tab-${args.system}`);
      await bring(document.querySelector('#work .tabs'), 24);
      await flyTo(tab, { press: true });
      window.dispatchEvent(new CustomEvent('ai:show-system', { detail: { id: args.system } }));
      await wait(160);
      const sys = SYSTEM_DATA.find((s) => s.id === args.system);
      if (name === 'show_system') {
        return { result: `Opened ${sys?.name || args.system}; its panel is visible.`, step: args.say, shown: true };
      }
      const video = document.querySelector('#work .video-stack video');
      if (!video) return { result: 'This system has no demo video.', step: args.say, shown: true };
      await bring(video, 24);
      await flyTo(video, { press: true });
      try {
        video.muted = true;
        await video.play();
        return { result: `Playing the ${sys?.short || ''} demo, muted.`, step: args.say, shown: true };
      } catch {
        return { result: 'The demo is on screen but the browser blocked autoplay; the visitor can press play.', step: args.say, shown: true };
      }
    }

    case 'open_experience': {
      const job = ROLES.find((j) => j.id === args.company);
      const rows = [...document.querySelectorAll('#experience .exp-item')];
      const row = rows[ROLES.findIndex((j) => j.id === args.company)];
      await bring(row || document.getElementById('experience'), 24);
      await flyTo(row?.querySelector('.exp-trigger'), { press: true });
      window.dispatchEvent(new CustomEvent('ai:open-experience', { detail: { id: args.company } }));
      await wait(420); // the accordion opens on a 0.4s transition
      return { result: `Expanded ${job?.company} (${job?.role}).`, step: args.say, shown: true };
    }

    case 'point_at': {
      const el = landmark(args.target);
      if (!el) return { result: `${args.target} is not on screen right now.`, step: '' };
      await bring(el, 40);
      await flyTo(el);
      spotlight(el, LANDMARKS[args.target].label, args.note);
      return { result: `Pointing at ${args.target}.`, step: args.note, shown: true };
    }

    case 'press': {
      const el = landmark(args.target);
      if (!el) return { result: `${args.target} is not on screen right now.`, step: '', shown: false };
      await bring(el, 40);
      await flyTo(el, { press: true });
      // A real click, so the browser treats it as the visitor's own press.
      el.click();
      await wait(360);
      const label = LANDMARKS[args.target].label;
      // Browsers only let a page open a new tab from the visitor's own click,
      // so a web link may be blocked. Say so, and let the model offer a button.
      const web = /^https?:/.test(el.getAttribute('href') || '');
      return {
        result: web
          ? `Pressed ${label}. A new tab may be blocked without the visitor's own click, so also offer the ${label} link as a button.`
          : `Pressed ${label}; the visitor's mail or phone app should open.`,
        step: args.say,
        shown: true,
      };
    }

    case 'copy_contact': {
      const value = args.what === 'email' ? LINKS.email.slice(7) : '+84 834 684 568';
      await bring(landmark(args.what === 'email' ? 'contact-email' : 'contact-phone'), 40);
      await flyTo(landmark(args.what === 'email' ? 'contact-email' : 'contact-phone'), { press: true });
      try {
        await navigator.clipboard.writeText(value);
        return { result: `Copied ${value} to the clipboard.`, step: args.say, shown: true };
      } catch {
        return { result: `Clipboard blocked by the browser; tell them the ${args.what} is ${value}.`, step: '' };
      }
    }

    default:
      return { result: 'Not available.', step: '' };
  }
}
