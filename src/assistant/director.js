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
import { PUBLICATION, EDUCATION } from './corpus';
import { currentSection } from './memory';
import { LANDMARKS, LINKS } from './tools';

const reduce = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const frame = () => new Promise((r) => requestAnimationFrame(() => r()));

/* ---- geometry ----------------------------------------------------------- */

/** What is covering the page: the sticky header on top, the companion below. */
function obstruction() {
  const hr = document.querySelector('.site-header')?.getBoundingClientRect();
  const tr = document.querySelector('.ticker')?.getBoundingClientRect();
  let top = Math.max(
    hr && hr.bottom > 0 && hr.top < 160 ? hr.bottom : 0,
    tr && tr.bottom > 0 && tr.top < 160 ? tr.bottom : 0,
  );
  // On a phone the companion is a full-width sheet; reflect whether it sits at top or bottom.
  const sheet = document.querySelector('.as-panel.is-companion');
  let bottom = 0;
  if (sheet) {
    const r = sheet.getBoundingClientRect();
    if (r.width > window.innerWidth * 0.7) {
      if (r.top + r.height / 2 <= window.innerHeight / 2) top = Math.max(top, r.bottom);
      else bottom = Math.max(0, window.innerHeight - r.top);
    }
  }
  return { top, bottom };
}

const PANEL_MARGIN = 16;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
let dragToken = 0;
let activeTargetEl = null;

/** Read the companion panel's current CSS drag offset in px. */
export function getDragOffset(panel = document.querySelector('#assistant-panel')) {
  return {
    x: Number(panel?.dataset.dragX) || 0,
    y: Number(panel?.dataset.dragY) || 0,
  };
}

/** Allowed panel width/height bounds for desktop floating card or mobile bottom sheet. */
export function getSizeBounds(wideSheet = typeof window !== 'undefined' && window.innerWidth < 768) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (wideSheet) {
    const minH = Math.min(220, Math.round(vh * 0.35));
    const maxH = Math.min(560, Math.round(vh * 0.76));
    return {
      wideSheet: true,
      minW: vw,
      maxW: vw,
      defaultW: vw,
      minH,
      maxH,
      defaultH: Math.min(420, Math.round(vh * 0.46)),
    };
  }
  const maxW = Math.min(520, vw - PANEL_MARGIN * 2);
  const minW = Math.min(310, maxW);
  const defaultW = Math.min(410, maxW);
  const maxH = Math.min(760, vh - 52);
  const minH = Math.min(250, maxH);
  const defaultH = Math.min(700, maxH);
  return { wideSheet: false, minW, maxW, defaultW, minH, maxH, defaultH };
}

/** Write CSS drag offset and optional panel width/height overrides cleanly. */
export function setPanelBoxState(panel, { width, height, dragX, dragY, wideSheet } = {}) {
  if (!panel) return;
  if (typeof dragX === 'number') {
    const rx = Math.round(dragX * 10) / 10;
    panel.dataset.dragX = String(rx);
    panel.style.setProperty('--drag-x', `${rx}px`);
  }
  if (typeof dragY === 'number') {
    const ry = Math.round(dragY * 10) / 10;
    panel.dataset.dragY = String(ry);
    panel.style.setProperty('--drag-y', `${ry}px`);
  }
  if (typeof width === 'number' && !wideSheet) {
    const rw = Math.round(width);
    panel.dataset.panelW = String(rw);
    panel.style.setProperty('--panel-w', `${rw}px`);
    panel.classList.toggle('is-narrow', rw <= 360);
  }
  if (typeof height === 'number') {
    const rh = Math.round(height);
    panel.dataset.panelH = String(rh);
    if (wideSheet) panel.style.setProperty('--sheet-h', `${rh}px`);
    else panel.style.setProperty('--panel-h', `${rh}px`);
    panel.classList.toggle('is-short', rh <= 430);
  }
}

/** Write CSS drag offset (--drag-x / --drag-y) to move the companion panel. */
export function setDragOffset(panel, x, y) {
  setPanelBoxState(panel, { dragX: x, dragY: y });
}

/** Allowed viewport bounds [minLeft..maxLeft, minTop..maxTop] for a companion panel. */
export function getDragBounds(panelRect) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const header = document.querySelector('.site-header');
  const headerBottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
  const wideSheet = panelRect.width > vw * 0.7 || vw < 768;
  const minLeft = wideSheet ? 0 : PANEL_MARGIN;
  const maxLeft = wideSheet ? Math.max(0, vw - panelRect.width) : Math.max(minLeft, vw - panelRect.width - PANEL_MARGIN);
  const minTop =
    vh - panelRect.height >= headerBottom + 44 ? Math.max(PANEL_MARGIN, Math.round(headerBottom + 10)) : PANEL_MARGIN;
  const maxTop = Math.max(minTop, vh - panelRect.height - (wideSheet ? 0 : PANEL_MARGIN));
  return { minLeft, maxLeft, minTop, maxTop };
}

/** Cancel active drag/resize animations and restore panel size & position back to default dock. */
export function resetPanelDrag(panel = document.querySelector('#assistant-panel')) {
  dragToken += 1;
  if (!panel) return;
  panel.classList.remove('is-dragging', 'is-narrow', 'is-short');
  delete panel.dataset.dragX;
  delete panel.dataset.dragY;
  delete panel.dataset.panelW;
  delete panel.dataset.panelH;
  panel.style.removeProperty('--drag-x');
  panel.style.removeProperty('--drag-y');
  panel.style.removeProperty('--panel-w');
  panel.style.removeProperty('--panel-h');
  panel.style.removeProperty('--sheet-h');
}

/** Clamp a moved/resized companion panel inside viewport bounds after resize. */
export function clampPanelDrag(panel = document.querySelector('#assistant-panel')) {
  if (!panel || !panel.classList.contains('is-companion')) return;
  const wideSheet = window.innerWidth < 768 || panel.getBoundingClientRect().width > window.innerWidth * 0.7;
  const { minW, maxW, minH, maxH } = getSizeBounds(wideSheet);
  const r0 = panel.getBoundingClientRect();
  const nextW = wideSheet ? r0.width : clamp(r0.width, minW, maxW);
  const nextH = clamp(r0.height, minH, maxH);
  const { x: dx0, y: dy0 } = getDragOffset(panel);
  if (!dx0 && !dy0 && Math.abs(nextW - r0.width) < 1 && Math.abs(nextH - r0.height) < 1) return;

  const { minLeft, maxLeft, minTop, maxTop } = getDragBounds({ width: nextW, height: nextH });
  const targetL = clamp(r0.right - nextW, minLeft, maxLeft);
  const targetT = clamp(r0.bottom - nextH, minTop, maxTop);
  setPanelBoxState(panel, {
    width: wideSheet ? undefined : nextW,
    height: nextH,
    dragX: dx0 + (targetL + nextW - r0.right),
    dragY: dy0 + (targetT + nextH - r0.bottom),
    wideSheet,
  });
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

/** Compute the unobstructed sightline band, leaving breathing room for sticky UI, spotlight, and pointer bubble. */
export function sightlineBand(extra = 28) {
  const { top: covered, bottom } = obstruction();
  const vh = window.innerHeight || 800;
  const band = Math.max(140, vh - covered - bottom);
  const topReserve = Math.min(Math.max(24, extra), Math.round(band * 0.14));
  const bottomReserve = Math.min(88, Math.max(48, Math.round(band * 0.14)));
  const safeTop = covered + topReserve;
  const safeBottom = Math.max(safeTop + 96, vh - bottom - bottomReserve);
  return {
    vh,
    covered,
    bottom,
    topReserve,
    bottomReserve,
    safeTop,
    safeBottom,
    safeHeight: Math.max(96, safeBottom - safeTop),
  };
}

function computeScrollTargetY(el, extra = 28) {
  const { vh, covered, topReserve, safeHeight } = sightlineBand(extra);
  const r = el.getBoundingClientRect();
  // Frame short/medium targets near the upper-middle sweet spot; frame tall containers cleanly below sticky chrome.
  const lead =
    r.height <= safeHeight
      ? Math.max(topReserve, Math.min((safeHeight - r.height) * 0.42 + topReserve, safeHeight * 0.32 + topReserve))
      : topReserve;
  const rawTop = r.top + window.scrollY - covered - lead;
  const docHeight = Math.max(document.documentElement?.scrollHeight || 0, document.body?.scrollHeight || 0);
  const maxScroll = docHeight > vh ? docHeight - vh : Math.max(0, rawTop);
  return Math.round(clamp(rawTop, 0, maxScroll));
}

/** Smooth-scroll an element into the part of the viewport nothing covers. */
export function scrollIntoView(el, extra = 28) {
  if (!el) return false;
  const targetY = computeScrollTargetY(el, extra);
  if (Math.abs(targetY - window.scrollY) < 4) return false;
  window.scrollTo({ top: targetY, behavior: reduce() ? 'auto' : 'smooth' });
  return true;
}

export function isComfortablyInView(el, extra = 28) {
  if (!el) return false;
  const { covered, safeTop, safeBottom, safeHeight } = sightlineBand(extra);
  const r = el.getBoundingClientRect();
  if (r.width <= 0 && r.height <= 0) return false;
  if (r.height <= safeHeight) {
    return r.top >= safeTop && r.bottom <= safeBottom;
  }
  const visibleOverlap = Math.min(r.bottom, safeBottom) - Math.max(r.top, safeTop);
  return (
    r.top >= covered + 10 &&
    r.top <= covered + Math.min(92, safeHeight * 0.22) &&
    visibleOverlap >= Math.min(r.height, safeHeight * 0.76)
  );
}

async function bring(el, extra = 28) {
  if (!el) return;
  if (isComfortablyInView(el, extra)) return;
  if (!scrollIntoView(el, extra)) return;
  await settle();
}

function panelVerticalOcclusion(el) {
  const sheet = document.querySelector('.as-panel.is-companion');
  if (!sheet || !el) return null;
  const pr = sheet.getBoundingClientRect();
  const tr = el.getBoundingClientRect();
  if (pr.width <= 0 || pr.height <= 0 || tr.width <= 0 || tr.height <= 0) return null;
  if (overlapArea(expandRect(tr, 10), pr) <= 0) return null;
  const vw = window.innerWidth || 1280;
  const vh = window.innerHeight || 800;
  if (pr.width > vw * 0.65 || (pr.left <= tr.right && pr.right >= tr.left)) {
    return pr.top + pr.height / 2 > vh / 2
      ? { side: 'bottom', limit: pr.top - 22 }
      : { side: 'top', limit: pr.bottom + 22 };
  }
  return null;
}

/**
 * Ensure `el` sits comfortably in the visitor's sightline before spotlight/pointer cues appear:
 * scrolls cleanly into the safe band when off-screen/clipped, moves the chat drawer if overlapping,
 * and applies a minimal vertical adjustment if a wide layout keeps the panel above/below the target.
 */
async function ensureInSightline(el, { extra = 30, dodgeEl = el } = {}) {
  if (!el) return;
  await bring(el, extra);
  if (dodgeEl) await avoidOverlap(dodgeEl);
  const occ = panelVerticalOcclusion(el);
  if (!occ) return;
  const { covered, vh } = sightlineBand(extra);
  const tr = el.getBoundingClientRect();
  const docHeight = Math.max(document.documentElement?.scrollHeight || 0, document.body?.scrollHeight || 0);
  const maxScroll = docHeight > vh ? docHeight - vh : Infinity;
  let nextScrollY = window.scrollY;
  if (occ.side === 'bottom' && tr.bottom > occ.limit) {
    const maxUp = Math.max(0, tr.top - (covered + 20));
    const needed = Math.min(tr.bottom - occ.limit, maxUp);
    if (needed >= 16) nextScrollY = clamp(window.scrollY + needed, 0, maxScroll);
  } else if (occ.side === 'top' && tr.top < occ.limit) {
    const maxDown = Math.max(0, vh - 56 - tr.bottom);
    const needed = Math.min(occ.limit - tr.top, maxDown);
    if (needed >= 16) nextScrollY = Math.max(0, window.scrollY - needed);
  }
  if (Math.abs(nextScrollY - window.scrollY) >= 4) {
    window.scrollTo({ top: Math.round(nextScrollY), behavior: reduce() ? 'auto' : 'smooth' });
    await settle();
  }
}

/* ---- the pointer --------------------------------------------------------- */

let cursor = null;
let cursorIdle = 0;
let speechTimer = 0;
let contactWalkToken = 0;
let lastCursorX = 0;
let lastCursorY = 0;

function formatMiniSpeech(text) {
  if (!text) return '';
  const cleaned = String(text)
    .replace(/[`*_#>]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  if (cleaned.length <= 84) return cleaned;
  const slice = cleaned.slice(0, 81);
  const wordEnd = slice.lastIndexOf(' ');
  return `${(wordEnd > 44 ? slice.slice(0, wordEnd) : slice).trim()}…`;
}

function positionCursorBubble(c, x, y) {
  const bubble = c?.querySelector('.ai-cursor-bubble');
  if (!bubble) return;
  const vw = window.innerWidth || 1280;
  const vh = window.innerHeight || 800;
  const { top: covered } = obstruction();
  const msgRect = document.getElementById('contact-message')?.getBoundingClientRect();
  const aboveUpperForm =
    Boolean(msgRect && document.getElementById('contact-form')?.contains(activeTargetEl)) &&
    y < msgRect.top - 10;
  const canFlipUp = y - 64 > covered;
  bubble.classList.toggle('is-left', x > vw - 265);
  bubble.classList.toggle('is-up', canFlipUp && (y > vh - 140 || aboveUpperForm));
}

/** Update the mini speech bubble attached to `.ai-cursor` in parallel with main chat. */
export function setCursorSpeech(text, { duration = 4400 } = {}) {
  const line = formatMiniSpeech(text);
  if (!line) {
    clearCursorSpeech();
    return;
  }
  const c = ensureCursor();
  const bubble = c.querySelector('.ai-cursor-bubble');
  if (!bubble) return;
  bubble.textContent = line;
  c.classList.add('is-on', 'has-speech');
  positionCursorBubble(c, lastCursorX, lastCursorY);

  clearTimeout(speechTimer);
  if (duration > 0) {
    speechTimer = setTimeout(() => {
      clearCursorSpeech();
    }, duration);
  }
  clearTimeout(cursorIdle);
  cursorIdle = setTimeout(() => {
    c.classList.remove('is-on');
    clearCursorSpeech();
  }, Math.max(4400, duration + 600));
}

export function clearCursorSpeech() {
  clearTimeout(speechTimer);
  const c = cursor;
  if (!c) return;
  c.classList.remove('has-speech');
  const bubble = c.querySelector('.ai-cursor-bubble');
  if (bubble) bubble.textContent = '';
}

function ensureCursor() {
  if (cursor && document.body.contains(cursor)) return cursor;
  cursor = document.createElement('div');
  cursor.className = 'ai-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML =
    '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 3l7.5 18 2.4-7.1L21 11.5z" fill="#ffffff" stroke="#111111" stroke-width="1.8" stroke-linejoin="round"/></svg><span class="ai-cursor-tag">K</span><span class="ai-cursor-bubble"></span>';
  // It is born at the chat, so the first flight visibly comes from the guide.
  const origin = document.querySelector('.as-panel') || document.querySelector('.as-toggle');
  const r = origin?.getBoundingClientRect();
  const x = r ? r.left + 24 : window.innerWidth - 60;
  const y = r ? r.top + 40 : window.innerHeight - 60;
  lastCursorX = x;
  lastCursorY = y;
  cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  positionCursorBubble(cursor, x, y);
  document.body.appendChild(cursor);
  return cursor;
}

/** Fly the pointer to an element; resolves when it has landed. */
async function flyTo(el, { press = false, duration = 640 } = {}) {
  if (!el) return;
  activeTargetEl = el;
  const c = ensureCursor();
  clearTimeout(cursorIdle);
  await frame();
  c.classList.add('is-on');
  const r = el.getBoundingClientRect();
  const { top: covered } = obstruction();
  const vh = window.innerHeight || 800;
  const visibleTop = Math.max(r.top, covered + 8);
  const visibleBottom = Math.min(r.bottom, vh - 32);
  const visibleH = Math.max(24, visibleBottom - visibleTop);
  // Aim a little inside the top-left third of the visible band: where a hand would actually point.
  const x = Math.min((window.innerWidth || 1280) - 28, Math.max(8, r.left + Math.min(r.width * 0.32, 160)));
  const y = clamp(visibleTop + Math.min(visibleH * 0.38, 52), covered + 10, Math.max(covered + 10, vh - 36));
  lastCursorX = x;
  lastCursorY = y;
  positionCursorBubble(c, x, y);
  c.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  await wait(reduce() ? 0 : duration);
  if (press) {
    c.classList.add('is-press');
    ripple(x, y);
    await wait(reduce() ? 0 : 220);
    c.classList.remove('is-press');
  }
  cursorIdle = setTimeout(() => {
    c.classList.remove('is-on');
    clearCursorSpeech();
  }, 4600);
}

/* ---- collision avoidance & real cursor drag ------------------------------ */

const expandRect = (r, px, pyTop = px, pyBottom = px) => ({
  left: r.left - px,
  top: r.top - pyTop,
  right: r.right + px,
  bottom: r.bottom + pyBottom,
});

function overlapArea(a, b) {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  if (w <= 0) return 0;
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return h > 0 ? w * h : 0;
}

function scoreBoxCandidate(cand, cur, targetRect, paddedRect, sizeBounds, posBounds) {
  const rawHit = overlapArea(cand, targetRect);
  const padHit = overlapArea(cand, paddedRect);
  const moveDist = Math.hypot(cand.left - cur.left, cand.top - cur.top);
  const dW = Math.abs(cand.width - cur.width);
  const dH = Math.abs(cand.height - cur.height);
  const resized = dW > 8 || dH > 8;
  // Prefer pure moving when 0-overlap fits without resizing; resize cleanly when open pocket needs it.
  const resizePenalty = resized ? 180 + (dW + dH) * 0.65 : 0;
  const compactBias =
    ((sizeBounds.defaultW - cand.width) * 0.22) + ((sizeBounds.defaultH - cand.height) * 0.16);
  const nearHorizEdge = cand.left <= posBounds.minLeft + 12 || cand.left >= posBounds.maxLeft - 12;
  const nearVertEdge = cand.top <= posBounds.minTop + 12 || cand.top >= posBounds.maxTop - 12;
  const edgePenalty = nearHorizEdge || nearVertEdge ? (nearHorizEdge && nearVertEdge ? 0 : 38) : 135;
  const homeBias = Math.hypot(cand.left - posBounds.maxLeft, cand.top - posBounds.maxTop) * 0.04;
  return {
    ...cand,
    rawHit,
    padHit,
    moveDist,
    deltaTotal: moveDist + dW + dH,
    score: rawHit * 100000 + padHit * 2000 + moveDist * 0.42 + resizePenalty + compactBias + edgePenalty + homeBias,
  };
}

function pickAutoBox(pr, targetRect, { allowIfNoOverlap = false } = {}) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const wideSheet = pr.width > vw * 0.7 || vw < 768;
  const sb = getSizeBounds(wideSheet);
  const gap = 22;
  const padded = expandRect(targetRect, 18, 18, 21);

  const curRaw = overlapArea(pr, targetRect);
  const curPad = overlapArea(pr, padded);
  if (!allowIfNoOverlap && curPad <= 0 && curRaw <= 0) return null;

  const header = document.querySelector('.site-header');
  const headerTop = Math.max(PANEL_MARGIN, Math.round((header?.getBoundingClientRect().bottom ?? 0) + 10));
  const safeBottom = vh - (wideSheet ? 0 : PANEL_MARGIN);
  const safeLeft = wideSheet ? 0 : PANEL_MARGIN;
  const safeRight = wideSheet ? vw : vw - PANEL_MARGIN;

  const spaceLeft = Math.floor(targetRect.left - gap - safeLeft);
  const spaceRight = Math.floor(safeRight - (targetRect.right + gap));
  const spaceAbove = Math.floor(targetRect.top - gap - headerTop);
  const spaceBelow = Math.floor(safeBottom - (targetRect.bottom + gap));

  const sizeList = [];
  const pushSize = (w, h) => {
    const rw = Math.round(wideSheet ? vw : clamp(w, sb.minW, sb.maxW));
    const rh = Math.round(clamp(h, sb.minH, sb.maxH));
    if (!sizeList.some(([ew, eh]) => Math.abs(ew - rw) < 12 && Math.abs(eh - rh) < 12)) {
      sizeList.push([rw, rh]);
    }
  };

  pushSize(pr.width, pr.height);
  if (Math.abs(pr.width - sb.defaultW) > 16 || Math.abs(pr.height - sb.defaultH) > 20) {
    pushSize(sb.defaultW, sb.defaultH);
  }
  if (!wideSheet) {
    if (spaceLeft >= sb.minW) {
      pushSize(spaceLeft, pr.height);
      pushSize(spaceLeft, sb.defaultH);
    }
    if (spaceRight >= sb.minW) {
      pushSize(spaceRight, pr.height);
      pushSize(spaceRight, sb.defaultH);
    }
  }
  if (spaceBelow >= sb.minH) {
    pushSize(wideSheet ? vw : Math.max(pr.width, 380), spaceBelow);
    pushSize(pr.width, spaceBelow);
  }
  if (spaceAbove >= sb.minH) {
    pushSize(wideSheet ? vw : Math.max(pr.width, 380), spaceAbove);
    pushSize(pr.width, spaceAbove);
  }
  if (!wideSheet) {
    pushSize(340, 360);
    pushSize(sb.minW, sb.minH);
    if (spaceLeft >= sb.minW && spaceBelow >= sb.minH) pushSize(spaceLeft, spaceBelow);
    if (spaceRight >= sb.minW && spaceBelow >= sb.minH) pushSize(spaceRight, spaceBelow);
    if (spaceLeft >= sb.minW && spaceAbove >= sb.minH) pushSize(spaceLeft, spaceAbove);
    if (spaceRight >= sb.minW && spaceAbove >= sb.minH) pushSize(spaceRight, spaceAbove);
  }

  const seen = new Set();
  let best = null;
  for (const [w, h] of sizeList) {
    const pb = getDragBounds({ width: w, height: h });
    const anchors = [
      [pr.left, pr.top],
      [pr.right - w, pr.bottom - h],
      [pr.left, pr.bottom - h],
      [pr.right - w, pr.top],
      [pr.left, targetRect.bottom + gap],
      [pr.right - w, targetRect.bottom + gap],
      [pr.left, targetRect.top - h - gap],
      [pr.right - w, targetRect.top - h - gap],
      [targetRect.left - w - gap, pr.top],
      [targetRect.left - w - gap, pr.bottom - h],
      [targetRect.right + gap, pr.top],
      [targetRect.right + gap, pr.bottom - h],
      [pb.minLeft, pb.maxTop],
      [pb.maxLeft, pb.maxTop],
      [pb.minLeft, pb.minTop],
      [pb.maxLeft, pb.minTop],
      [pb.minLeft, targetRect.bottom + gap],
      [pb.maxLeft, targetRect.bottom + gap],
      [pb.minLeft, targetRect.top - h - gap],
      [pb.maxLeft, targetRect.top - h - gap],
      [targetRect.left - w - gap, pb.maxTop],
      [targetRect.right + gap, pb.maxTop],
      [targetRect.left - w - gap, pb.minTop],
      [targetRect.right + gap, pb.minTop],
    ];
    for (const [rx, ry] of anchors) {
      const left = Math.round(clamp(rx, pb.minLeft, pb.maxLeft));
      const top = Math.round(clamp(ry, pb.minTop, pb.maxTop));
      const key = `${left},${top},${w},${h}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const cand = { left, top, width: w, height: h, right: left + w, bottom: top + h };
      const scored = scoreBoxCandidate(cand, pr, targetRect, padded, sb, pb);
      if (!best || scored.score < best.score) best = scored;
    }
  }

  if (!best || best.deltaTotal < 8) return null;
  if (allowIfNoOverlap) return { left: best.left, top: best.top, width: best.width, height: best.height };
  const clearsCleanly = best.padHit === 0 && curPad > 0;
  const cutsOverlap = best.rawHit < curRaw * 0.65 && curRaw - best.rawHit > 1200;
  return clearsCleanly || cutsOverlap
    ? { left: best.left, top: best.top, width: best.width, height: best.height }
    : null;
}

function resolveSizePreset(pr, size, sb) {
  const w0 = pr.width;
  const h0 = pr.height;
  if (sb.wideSheet) {
    switch (size) {
      case 'default':
      case 'wide':
        return [w0, sb.defaultH];
      case 'short':
      case 'compact':
        return [w0, Math.max(sb.minH, Math.min(sb.maxH, Math.round(Math.min(280, window.innerHeight * 0.34))))];
      case 'tall':
        return [w0, sb.maxH];
      default:
        return [w0, h0];
    }
  }
  switch (size) {
    case 'default':
      return [sb.defaultW, sb.defaultH];
    case 'short':
      return [w0, Math.max(sb.minH, Math.min(sb.maxH, Math.round(Math.min(350, window.innerHeight * 0.44))))];
    case 'tall':
      return [w0, Math.min(sb.maxH, Math.max(sb.defaultH, 580))];
    case 'narrow':
      return [Math.max(sb.minW, Math.min(330, sb.maxW)), h0];
    case 'wide':
      return [Math.min(sb.maxW, Math.max(sb.defaultW, 470)), h0];
    case 'compact':
      return [Math.max(sb.minW, Math.min(340, sb.maxW)), Math.max(sb.minH, Math.min(360, sb.maxH))];
    default:
      return [w0, h0];
  }
}

function pickExplicitBox(panel, position = 'auto', size = 'keep') {
  const pr = panel.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const wideSheet = pr.width > vw * 0.7 || vw < 768;
  const sb = getSizeBounds(wideSheet);
  const { x: dx, y: dy } = getDragOffset(panel);

  if (size === 'auto' && position === 'auto' && activeTargetEl && document.body.contains(activeTargetEl)) {
    const tr = activeTargetEl.getBoundingClientRect();
    if (tr.width > 0 && tr.height > 0 && tr.bottom > 0 && tr.top < window.innerHeight) {
      const picked = pickAutoBox(pr, tr, { allowIfNoOverlap: true });
      if (picked) return picked;
    }
  }

  const [tw, th] = resolveSizePreset(pr, size, sb);
  const nextW = Math.round(wideSheet ? vw : clamp(tw, sb.minW, sb.maxW));
  const nextH = Math.round(clamp(th, sb.minH, sb.maxH));
  const { minLeft, maxLeft, minTop, maxTop } = getDragBounds({ width: nextW, height: nextH });

  if (position === 'reset') {
    const resetToDefaultSize = size === 'default' || size === 'keep';
    const rw = resetToDefaultSize ? sb.defaultW : nextW;
    const rh = resetToDefaultSize ? sb.defaultH : nextH;
    return {
      left: Math.round(pr.right - dx - rw),
      top: Math.round(pr.bottom - dy - rh),
      width: rw,
      height: rh,
      resetAtEnd: resetToDefaultSize,
    };
  }

  const safeRight = wideSheet ? vw : vw - PANEL_MARGIN;
  const safeLeft = wideSheet ? 0 : PANEL_MARGIN;
  const headerBottom = document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0;
  const safeTop = vh - pr.height >= headerBottom + 44 ? Math.max(PANEL_MARGIN, Math.round(headerBottom + 10)) : PANEL_MARGIN;
  const safeBottom = vh - (wideSheet ? 0 : PANEL_MARGIN);
  const pinLeft = pr.left - safeLeft <= safeRight - pr.right;
  const pinTop = pr.top - safeTop < safeBottom - pr.bottom;
  let left = Math.round(clamp(pinLeft ? pr.left : pr.right - nextW, minLeft, maxLeft));
  let top = Math.round(clamp(pinTop ? pr.top : pr.bottom - nextH, minTop, maxTop));

  switch (position) {
    case 'left':
      left = minLeft;
      break;
    case 'right':
      left = maxLeft;
      break;
    case 'up':
      top = minTop;
      break;
    case 'down':
      top = maxTop;
      break;
    case 'top-left':
      left = minLeft;
      top = minTop;
      break;
    case 'top-right':
      left = maxLeft;
      top = minTop;
      break;
    case 'bottom-left':
      left = minLeft;
      top = maxTop;
      break;
    case 'bottom-right':
      left = maxLeft;
      top = maxTop;
      break;
    case 'auto': {
      if (size === 'keep' && activeTargetEl && document.body.contains(activeTargetEl)) {
        const tr = activeTargetEl.getBoundingClientRect();
        if (tr.width > 0 && tr.height > 0 && tr.bottom > 0 && tr.top < window.innerHeight) {
          const picked = pickAutoBox(pr, tr, { allowIfNoOverlap: true });
          if (picked) return picked;
        }
      }
      if (size === 'keep') {
        left = pr.left + pr.width / 2 > vw / 2 ? minLeft : maxLeft;
      }
      break;
    }
    default:
      return null;
  }

  return { left, top, width: nextW, height: nextH };
}

function setCursorTag(c, label) {
  const tag = c?.querySelector?.('.ai-cursor-tag');
  if (tag) tag.textContent = label;
}

const gripMeta = (mode, L, T, W, H) => {
  const R = L + W;
  const B = T + H;
  switch (mode) {
    case 'w':
      return { tag: 'K ↔', point: (l, t, w, h) => [l + 2, t + h * 0.48], resize: true };
    case 'e':
      return { tag: 'K ↔', point: (l, t, w, h) => [l + w - 2, t + h * 0.48], resize: true };
    case 'n':
      return { tag: 'K ↕', point: (l, t, w) => [l + w * 0.5, t + 2], resize: true };
    case 's':
      return { tag: 'K ↕', point: (l, t, w, h) => [l + w * 0.5, t + h - 2], resize: true };
    case 'nw':
      return { tag: 'K ⤡', point: (l, t) => [l + 4, t + 4], resize: true };
    case 'ne':
      return { tag: 'K ⤢', point: (l, t, w) => [l + w - 4, t + 4], resize: true };
    case 'sw':
      return { tag: 'K ⤢', point: (l, t, w, h) => [l + 4, t + h - 4], resize: true };
    case 'se':
      return { tag: 'K ⤡', point: (l, t, w, h) => [l + w - 4, t + h - 4], resize: true };
    default: {
      const grabOffsetX = Math.min(Math.max(56, W * 0.36), Math.max(56, W - 128));
      const grabOffsetY = Math.min(20, Math.max(14, H * 0.04));
      return { tag: 'K', point: (l, t) => [l + grabOffsetX, t + grabOffsetY], resize: false, R, B };
    }
  }
};

function buildMotionPhases(from, to) {
  const dW = Math.abs(to.width - from.width) >= 6;
  const dH = Math.abs(to.height - from.height) >= 6;
  if (!dW && !dH) return [{ mode: 'header', from, to }];

  const eps = 8;
  const leftFixed = Math.abs(to.left - from.left) <= eps;
  const rightFixed = Math.abs(to.left + to.width - (from.left + from.width)) <= eps;
  const topFixed = Math.abs(to.top - from.top) <= eps;
  const bottomFixed = Math.abs(to.top + to.height - (from.top + from.height)) <= eps;

  if (dW && !dH && (leftFixed || rightFixed) && topFixed) {
    return [{ mode: leftFixed ? 'e' : 'w', from, to }];
  }
  if (dH && !dW && (leftFixed || rightFixed) && (topFixed || bottomFixed)) {
    return [{ mode: topFixed ? 's' : 'n', from, to }];
  }
  if ((leftFixed || rightFixed) && (topFixed || bottomFixed)) {
    if (dW && !dH) return [{ mode: leftFixed ? 'e' : 'w', from, to }];
    if (dH && !dW) return [{ mode: topFixed ? 's' : 'n', from, to }];
    return [{ mode: `${topFixed ? 's' : 'n'}${leftFixed ? 'e' : 'w'}`, from, to }];
  }

  // Both moved across screen & changed size: shrink first (or move into space first when expanding).
  const shrinking = to.width * to.height < from.width * from.height;
  if (shrinking) {
    const anchorRight = Math.abs(to.left + to.width - (from.left + from.width)) < Math.abs(to.left - from.left);
    const anchorBottom = Math.abs(to.top + to.height - (from.top + from.height)) < Math.abs(to.top - from.top);
    const mid = {
      left: anchorRight ? from.left + from.width - to.width : from.left,
      top: anchorBottom ? from.top + from.height - to.height : from.top,
      width: to.width,
      height: to.height,
    };
    const resizeMode =
      dW && dH
        ? `${anchorBottom ? 'n' : 's'}${anchorRight ? 'w' : 'e'}`
        : dW
          ? anchorRight ? 'w' : 'e'
          : anchorBottom ? 'n' : 's';
    return [
      { mode: resizeMode, from, to: mid },
      { mode: 'header', from: mid, to },
    ];
  }

  const anchorRight = Math.abs(to.left + to.width - (from.left + from.width)) < Math.abs(to.left - from.left);
  const anchorBottom = Math.abs(to.top + to.height - (from.top + from.height)) < Math.abs(to.top - from.top);
  const mid = {
    left: anchorRight ? to.left + to.width - from.width : to.left,
    top: anchorBottom ? to.top + to.height - from.height : to.top,
    width: from.width,
    height: from.height,
  };
  const resizeMode =
    dW && dH
      ? `${anchorBottom ? 'n' : 's'}${anchorRight ? 'w' : 'e'}`
      : dW
        ? anchorRight ? 'w' : 'e'
        : anchorBottom ? 'n' : 's';
  return [
    { mode: 'header', from, to: mid },
    { mode: resizeMode, from: mid, to },
  ];
}

async function runBoxPhase(panel, c, phase, myToken, wideSheet) {
  const { from, to, mode } = phase;
  const dist = Math.max(
    Math.hypot(to.left - from.left, to.top - from.top),
    Math.hypot(to.width - from.width, to.height - from.height),
  );
  if (dist < 4) return true;

  const meta = gripMeta(mode, from.left, from.top, from.width, from.height);
  const [grabX, grabY] = meta.point(from.left, from.top, from.width, from.height);
  const tipOffsetX = 4;
  const tipOffsetY = 3;

  const { x: dx0, y: dy0 } = getDragOffset(panel);
  const R0 = from.left + from.width;
  const B0 = from.top + from.height;

  await frame();
  if (myToken !== dragToken) return false;
  const alreadyVisible = c.classList.contains('is-on');
  c.classList.add('is-on');
  c.classList.remove('is-grab', 'is-press', 'is-resize');
  setCursorTag(c, meta.tag);
  lastCursorX = grabX - tipOffsetX;
  lastCursorY = grabY - tipOffsetY;
  positionCursorBubble(c, lastCursorX, lastCursorY);
  c.style.transform = `translate3d(${lastCursorX.toFixed(1)}px, ${lastCursorY.toFixed(1)}px, 0)`;
  await wait(alreadyVisible ? 180 : 280);
  if (myToken !== dragToken || !document.body.contains(panel) || !panel.classList.contains('is-companion')) return false;

  c.classList.add('is-press');
  ripple(grabX, grabY);
  await wait(100);
  if (myToken !== dragToken) return false;

  c.classList.remove('is-press');
  c.classList.add('is-grab');
  if (meta.resize) c.classList.add('is-resize');
  panel.classList.add('is-dragging');

  const duration = Math.min(700, Math.max(360, 260 + dist * 0.55));
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  await new Promise((resolve) => {
    const startTime = performance.now();
    const step = (now) => {
      if (myToken !== dragToken || !document.body.contains(panel) || !panel.classList.contains('is-companion')) {
        resolve();
        return;
      }
      const rawT = Math.min(1, (now - startTime) / duration);
      const k = easeInOutCubic(rawT);
      const L = from.left + (to.left - from.left) * k;
      const T = from.top + (to.top - from.top) * k;
      const W = from.width + (to.width - from.width) * k;
      const H = from.height + (to.height - from.height) * k;
      setPanelBoxState(panel, {
        width: W,
        height: H,
        dragX: dx0 + (L + W - R0),
        dragY: dy0 + (T + H - B0),
        wideSheet,
      });
      const [px, py] = meta.point(L, T, W, H);
      lastCursorX = px - tipOffsetX;
      lastCursorY = py - tipOffsetY;
      positionCursorBubble(c, lastCursorX, lastCursorY);
      c.style.transform = `translate3d(${lastCursorX.toFixed(1)}px, ${lastCursorY.toFixed(1)}px, 0)`;
      if (rawT < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });

  panel.classList.remove('is-dragging');
  c.classList.remove('is-grab', 'is-press', 'is-resize');
  return myToken === dragToken;
}

/** Physically fly pointer to header, edge, or corner and move/resize the chat box in real time. */
async function animatePanelBox(panel, targetBox) {
  if (!panel || !panel.classList.contains('is-companion') || !targetBox) return false;
  const myToken = ++dragToken;
  const pr = panel.getBoundingClientRect();
  const wideSheet = pr.width > window.innerWidth * 0.7 || window.innerWidth < 768;
  const from = { left: pr.left, top: pr.top, width: pr.width, height: pr.height };
  const to = {
    left: targetBox.left,
    top: targetBox.top,
    width: wideSheet ? pr.width : targetBox.width,
    height: targetBox.height,
  };
  const totalDelta =
    Math.hypot(to.left - from.left, to.top - from.top) + Math.hypot(to.width - from.width, to.height - from.height);
  if (totalDelta < 6) {
    if (targetBox.resetAtEnd) resetPanelDrag(panel);
    return false;
  }

  if (reduce()) {
    if (targetBox.resetAtEnd) {
      resetPanelDrag(panel);
    } else {
      const { x: dx0, y: dy0 } = getDragOffset(panel);
      setPanelBoxState(panel, {
        width: to.width,
        height: to.height,
        dragX: dx0 + (to.left + to.width - pr.right),
        dragY: dy0 + (to.top + to.height - pr.bottom),
        wideSheet,
      });
    }
    return true;
  }

  const c = ensureCursor();
  clearTimeout(cursorIdle);
  window.dispatchEvent(new CustomEvent('ai:panel-dodging', { detail: { active: true } }));
  const lastUserText = [...document.querySelectorAll('.as-row.is-user .as-bubble')].pop()?.textContent || '';
  const isVi = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i.test(lastUserText);
  setCursorSpeech(isVi ? 'Né sang bên cho bạn dễ nhìn…' : 'Stepping aside for a clear view…', { duration: 2400 });

  try {
    const phases = buildMotionPhases(from, to);
    for (let i = 0; i < phases.length; i += 1) {
      const ok = await runBoxPhase(panel, c, phases[i], myToken, wideSheet);
      if (!ok) return false;
      if (i < phases.length - 1) await wait(80);
    }
    if (myToken !== dragToken) return false;
    setCursorTag(c, 'K');
    await wait(110);
    cursorIdle = setTimeout(() => {
      c.classList.remove('is-on');
      clearCursorSpeech();
    }, 4400);
    if (targetBox.resetAtEnd) resetPanelDrag(panel);
    return true;
  } finally {
    panel.classList.remove('is-dragging');
    c.classList.remove('is-grab', 'is-press', 'is-resize');
    setCursorTag(c, 'K');
    window.dispatchEvent(new CustomEvent('ai:panel-dodging', { detail: { active: false } }));
  }
}

/** Check if the companion box overlaps a page element and physically move/resize it aside. */
export async function avoidOverlap(el) {
  if (!el) return false;
  activeTargetEl = el;
  const panel = document.querySelector('.as-panel.is-companion');
  if (!panel) return false;
  const tr = el.getBoundingClientRect();
  if (tr.width <= 0 || tr.height <= 0) return false;
  const pr = panel.getBoundingClientRect();
  const next = pickAutoBox(pr, tr);
  if (!next) return false;
  return animatePanelBox(panel, next);
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
  dragToken += 1;
  contactWalkToken += 1;
  activeTargetEl = null;
  disposeSpot();
  disposeSpot = () => {};
  clearCursorSpeech();
  cursor?.classList.remove('is-on', 'is-grab', 'is-press', 'is-resize');
  setCursorTag(cursor, 'K');
  document.querySelector('#assistant-panel')?.classList.remove('is-dragging');
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
  if (target === 'publication') {
    return `${PUBLICATION.venue} (${PUBLICATION.year}) · Paper No. ${PUBLICATION.paperNo}: "${PUBLICATION.title}" by ${PUBLICATION.authors}. ${PUBLICATION.summary} URL: ${PUBLICATION.href}`;
  }
  if (target === 'education') {
    return `${EDUCATION.school} (${EDUCATION.location}) — ${EDUCATION.degree} (${EDUCATION.period}), Cumulative GPA ${EDUCATION.gpa}. Awards: ${EDUCATION.awards.join(', ')}. Publication: "${PUBLICATION.title}" (SSRN Paper No. ${PUBLICATION.paperNo}).`;
  }

  const el = LANDMARKS[target] ? document.querySelector(LANDMARKS[target].sel) : document.getElementById(target);
  const text = textOf(el);
  return text ? clip(text) : 'That part of the page is empty right now.';
}

/* ---- running a call ------------------------------------------------------ */

const landmark = (id) => (LANDMARKS[id] ? document.querySelector(LANDMARKS[id].sel) : null);

const CONTACT_WALK_FIELDS = [
  {
    key: 'topic',
    landmarkId: 'contact-topic',
    vi: '1/6 Topic: Chọn 1 trong 4 nhóm (Hiring, Build, Advisory, Other).',
    en: '1/6 Topic: Pick 1 of 4 categories (Hiring, Build, Advisory, Other).',
  },
  {
    key: 'name',
    landmarkId: 'contact-name',
    vi: '2/6 Name *: Nhập tên hoặc cách bạn muốn anh Khang xưng hô.',
    en: '2/6 Name *: Enter your name or how Khang should address you.',
  },
  {
    key: 'email',
    landmarkId: 'contact-email-input',
    vi: '3/6 Email *: Điền email nhận phản hồi & lời mời trao đổi.',
    en: '3/6 Email *: Enter your email for replies and calendar invites.',
  },
  {
    key: 'company',
    landmarkId: 'contact-company',
    vi: '4/6 Company: Tùy chọn — ghi team hoặc tech stack đang dùng.',
    en: '4/6 Company: Optional — share your org or stack context.',
  },
  {
    key: 'message',
    landmarkId: 'contact-message',
    vi: '5/6 Brief *: Viết 2–4 câu mục tiêu & timeline (hoặc bấm Draft with AI).',
    en: '5/6 Brief *: Write 2–4 lines on goal & timing (or click Draft with AI).',
  },
  {
    key: 'submit',
    landmarkId: 'contact-submit',
    vi: '6/6 Send: Kiểm tra rồi bấm Send — chuyển tới Gmail kèm mã KHG-….',
    en: '6/6 Send: Review details & click Send — forwards via Gmail with KHG-… ID.',
  },
];

function detectViDialogue() {
  const lastUserText = [...document.querySelectorAll('.as-row.is-user .as-bubble')].pop()?.textContent || '';
  if (/[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i.test(lastUserText)) {
    return true;
  }
  if (lastUserText.trim()) return false;
  return /^vi/i.test(navigator?.language || '');
}

/** Smoothly glide the pointer and mini bubble sequentially across all 6 contact form sections. */
export async function runContactWalkthrough(formEl, { patch = {}, isVi, nonBlocking = true } = {}) {
  if (!formEl) return { walked: [], cancelled: true };
  const myWalk = ++contactWalkToken;
  const useVi = typeof isVi === 'boolean' ? isVi : detectViDialogue();

  await ensureInSightline(formEl, { extra: 26, dodgeEl: formEl });
  if (myWalk !== contactWalkToken) return { walked: [], cancelled: true };

  let disposeActiveSpot = () => {};
  let userTookOver = false;
  const cleanupListeners = [];
  const onTakeover = (ev) => {
    const t = ev?.target;
    if (t?.closest?.('.contact-coach-actions, .contact-coach-steps, .contact-ai-trigger')) return;
    if (t?.matches?.('input, textarea, .contact-topic-pill, .contact-submit-btn')) {
      userTookOver = true;
      contactWalkToken += 1;
      disposeActiveSpot();
    }
  };
  formEl.addEventListener('pointerdown', onTakeover, { capture: true });
  formEl.addEventListener('focusin', onTakeover, { capture: true });
  cleanupListeners.push(() => {
    formEl.removeEventListener('pointerdown', onTakeover, { capture: true });
    formEl.removeEventListener('focusin', onTakeover, { capture: true });
  });

  const visitStep = async (i) => {
    if (myWalk !== contactWalkToken || !document.body.contains(formEl)) return false;
    const step = CONTACT_WALK_FIELDS[i];
    const tip = useVi ? step.vi : step.en;
    const targetEl = landmark(step.landmarkId) || formEl;
    const stepTitle = LANDMARKS[step.landmarkId]?.label || step.key;

    await ensureInSightline(targetEl, { extra: 30, dodgeEl: i === 0 ? formEl : targetEl });
    if (myWalk !== contactWalkToken || !document.body.contains(formEl)) return false;

    window.dispatchEvent(
      new CustomEvent('ai:contact-fill', {
        detail: {
          fields: i === 0 ? patch : {},
          focus: step.key,
          note: tip,
        },
      }),
    );
    window.dispatchEvent(
      new CustomEvent('ai:walkthrough-progress', {
        detail: { step: i + 1, total: CONTACT_WALK_FIELDS.length, field: step.key, line: tip },
      }),
    );

    disposeActiveSpot();
    disposeActiveSpot = spotlight(targetEl, stepTitle, '');
    await flyTo(targetEl, { duration: 380 });
    if (myWalk !== contactWalkToken) return false;
    setCursorSpeech(tip, { duration: 2400 });
    return true;
  };

  const walked = [];
  const finishTail = async () => {
    try {
      for (let i = 1; i < CONTACT_WALK_FIELDS.length; i += 1) {
        await wait(reduce() ? 140 : 950);
        if (myWalk !== contactWalkToken) break;
        const ok = await visitStep(i);
        if (!ok) break;
        walked.push(CONTACT_WALK_FIELDS[i].key);
      }
      if (myWalk === contactWalkToken && !userTookOver) {
        await wait(reduce() ? 140 : 950);
        if (myWalk === contactWalkToken && !userTookOver) {
          const doneCue = useVi
            ? 'Đã chỉ đủ cả 6 ô! Bạn bắt đầu nhập hoặc nhắn mình nháp giúp nhé.'
            : 'All 6 fields covered! Start typing above or ask me to draft.';
          setCursorSpeech(doneCue, { duration: 4200 });
          setTimeout(() => disposeActiveSpot(), 1600);
        }
      }
    } finally {
      cleanupListeners.forEach((fn) => fn());
    }
  };

  const ok0 = await visitStep(0);
  if (ok0) walked.push(CONTACT_WALK_FIELDS[0].key);

  if (nonBlocking && ok0 && myWalk === contactWalkToken) {
    finishTail();
    return { walked: CONTACT_WALK_FIELDS.map((s) => s.key), cancelled: false };
  }

  await finishTail();
  return { walked, cancelled: myWalk !== contactWalkToken };
}

/** Proactively glide the pointer and mini bubble across 1-6 landmarks without redundant chat drags. */
async function runPointSweep(rawStops, { nonBlocking = true } = {}) {
  const stops = (rawStops || [])
    .map((s) => {
      const el = landmark(s.target);
      return el
        ? {
            target: s.target,
            el,
            label: LANDMARKS[s.target]?.label || s.target,
            note: s.note || LANDMARKS[s.target]?.label || s.target,
          }
        : null;
    })
    .filter(Boolean);

  if (!stops.length) return { walked: [], first: null };

  const myWalk = ++contactWalkToken;
  const firstEl = stops[0].el;
  const isContactGroup = stops.some((s) => s.target.startsWith('contact') || s.target === 'odoo-listing');
  const dodgeEl = isContactGroup
    ? document.querySelector('#contact .contact-channels, #contact .contact-direct, #contact .contact-grid') || firstEl
    : firstEl;

  await ensureInSightline(firstEl, { extra: 34, dodgeEl });
  if (myWalk !== contactWalkToken) return { walked: [], first: null };

  let disposeActiveSpot = () => {};
  const visitStop = async (idx) => {
    if (myWalk !== contactWalkToken) return false;
    const stop = stops[idx];
    if (!stop?.el || !document.body.contains(stop.el)) return false;
    if (idx > 0 || !isComfortablyInView(stop.el, 30)) {
      await ensureInSightline(stop.el, { extra: 34, dodgeEl: idx === 0 ? dodgeEl : stop.el });
      if (myWalk !== contactWalkToken || !document.body.contains(stop.el)) return false;
    }
    disposeActiveSpot();
    disposeActiveSpot = spotlight(stop.el, stop.label, '');
    await flyTo(stop.el, { duration: 380 });
    if (myWalk !== contactWalkToken) return false;
    setCursorSpeech(stop.note, { duration: idx === stops.length - 1 ? 4200 : 2500 });
    if (stops.length > 1) {
      window.dispatchEvent(
        new CustomEvent('ai:walkthrough-progress', {
          detail: { step: idx + 1, total: stops.length, field: stop.target, line: stop.note },
        }),
      );
    }
    return true;
  };

  const ok0 = await visitStop(0);
  if (!ok0 || stops.length === 1) {
    setTimeout(() => {
      if (myWalk === contactWalkToken) disposeActiveSpot();
    }, 4500);
    return { walked: ok0 ? [stops[0].target] : [], first: stops[0] };
  }

  const continueSweep = async () => {
    for (let i = 1; i < stops.length; i += 1) {
      await wait(reduce() ? 140 : 950);
      if (myWalk !== contactWalkToken) return;
      const ok = await visitStop(i);
      if (!ok) return;
    }
    setTimeout(() => {
      if (myWalk === contactWalkToken) disposeActiveSpot();
    }, 3600);
  };

  if (nonBlocking) {
    continueSweep();
    return { walked: stops.map((s) => s.target), first: stops[0] };
  }

  await continueSweep();
  return { walked: stops.map((s) => s.target), first: stops[0] };
}

/**
 * Run one validated call. Resolves to { result, step, shown }:
 *   result — what the model is told happened (truthful, terse)
 *   step   — the model's own words for it, if it gave any
 *   shown  — true when the visitor saw the page change (the widget then
 *            records a step, in their language when the model gave no words)
 */
export async function runTool({ name, args }) {
  if (name !== 'read_page' && name !== 'point_at' && name !== 'fill_contact') {
    contactWalkToken += 1;
  }
  switch (name) {
    case 'read_page':
      return { result: readTarget(args.target), step: '' };

    case 'navigate': {
      const el = landmark(args.to) || document.getElementById(args.to);
      if (!el) return { result: `Could not find ${args.to}.`, step: '' };
      await bring(el, 26);
      const focusEl = el.matches?.('section, header')
        ? el.querySelector('.hero-title, .sec-head, .tabs, .exp-list, #contact-form, .contact-grid') || el
        : el;
      await ensureInSightline(focusEl, { extra: 26, dodgeEl: focusEl });
      await flyTo(focusEl, { duration: 420 });
      setCursorSpeech(args.say || LANDMARKS[args.to]?.label || args.to, { duration: 4200 });
      return { result: `Scrolled to ${args.to}; it is on screen.`, step: args.say, shown: true };
    }

    case 'show_system':
    case 'play_demo': {
      const tabs = document.querySelector('#work .tabs');
      const tab = document.getElementById(`tab-${args.system}`);
      await ensureInSightline(tab || tabs, { extra: 26, dodgeEl: tab || tabs });
      await flyTo(tab, { press: true });
      const sys = SYSTEM_DATA.find((s) => s.id === args.system);
      setCursorSpeech(args.say || `Opening ${sys?.short || args.system}`, { duration: 4200 });
      window.dispatchEvent(new CustomEvent('ai:show-system', { detail: { id: args.system } }));
      await wait(180);
      if (name === 'show_system') {
        const panelEl = document.querySelector('#work .sys-panel');
        const focusEl = document.querySelector('#work .sys-copy') || panelEl;
        if (focusEl) await ensureInSightline(focusEl, { extra: 26, dodgeEl: panelEl || focusEl });
        return { result: `Opened ${sys?.name || args.system}; its panel is visible.`, step: args.say, shown: true };
      }
      const video = document.querySelector('#work .video-stack video');
      if (!video) return { result: 'This system has no demo video.', step: args.say, shown: true };
      await ensureInSightline(video, { extra: 26, dodgeEl: video });
      await flyTo(video, { press: true });
      setCursorSpeech(args.say || `Playing ${sys?.short || ''} demo`, { duration: 4200 });
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
      const trigger = row?.querySelector('.exp-trigger');
      await ensureInSightline(trigger || row || document.getElementById('experience'), {
        extra: 28,
        dodgeEl: trigger || row,
      });
      await flyTo(trigger, { press: true });
      setCursorSpeech(args.say || `${job?.company || args.company}`, { duration: 4200 });
      window.dispatchEvent(new CustomEvent('ai:open-experience', { detail: { id: args.company } }));
      await wait(420); // the accordion opens on a 0.4s transition
      if (row) await ensureInSightline(row, { extra: 26, dodgeEl: row });
      return { result: `Expanded ${job?.company} (${job?.role}).`, step: args.say, shown: true };
    }

    case 'point_at': {
      const stopList = Array.isArray(args.stops) && args.stops.length ? args.stops : [{ target: args.target, note: args.note }];
      const sweep = await runPointSweep(stopList, { nonBlocking: args._blocking !== true });
      if (!sweep.walked.length) return { result: `${args.target || 'target'} is not on screen right now.`, step: '' };
      const liveSummary = stopList
        .map((s) => {
          const t = textOf(landmark(s.target));
          return t ? `${s.target}: ${t.replace(/\s+/g, ' ').slice(0, 90)}` : '';
        })
        .filter(Boolean)
        .join(' | ');
      return {
        result:
          sweep.walked.length > 1
            ? `Guiding pointer proactively across ${sweep.walked.join(' -> ')}.${liveSummary ? ` Live text: [${liveSummary}].` : ''} Do NOT call read_page or point_at again — answer the visitor directly now.`
            : `Pointing at ${sweep.walked[0]}.${liveSummary ? ` Live text: [${liveSummary}].` : ''}`,
        step: args.say || sweep.first?.note || '',
        shown: true,
      };
    }

    case 'press': {
      const el = landmark(args.target);
      if (!el) return { result: `${args.target} is not on screen right now.`, step: '', shown: false };
      await ensureInSightline(el, { extra: 34, dodgeEl: el });
      await flyTo(el, { press: true });
      const label = LANDMARKS[args.target].label;
      setCursorSpeech(args.say || `Opening ${label}`, { duration: 3800 });
      // A real click, so the browser treats it as the visitor's own press.
      el.click();
      await wait(360);
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
      const el = landmark(args.what === 'email' ? 'contact-email' : 'contact-phone');
      const value = args.what === 'email' ? LINKS.email.slice(7) : '+84 834 684 568';
      await ensureInSightline(el, { extra: 34, dodgeEl: el });
      await flyTo(el, { press: true });
      try {
        await navigator.clipboard.writeText(value);
        setCursorSpeech(args.say || `Copied ${value}`, { duration: 3800 });
        return { result: `Copied ${value} to the clipboard.`, step: args.say, shown: true };
      } catch {
        return { result: `Clipboard blocked by the browser; tell them the ${args.what} is ${value}.`, step: '' };
      }
    }

    case 'fill_contact': {
      const formEl = document.getElementById('contact-form') || document.getElementById('contact');
      if (!formEl) return { result: 'Contact form is not available on this page.', step: '' };

      const patch = {};
      if (typeof args.name === 'string' && args.name.trim()) patch.name = args.name.trim();
      if (typeof args.email === 'string' && args.email.trim()) patch.email = args.email.trim();
      if (args.topic) patch.topic = args.topic;
      if (typeof args.company === 'string' && args.company.trim()) patch.company = args.company.trim();
      if (typeof args.message === 'string' && args.message.trim()) patch.message = args.message.trim();

      const liveForm = document.getElementById('contact-form');
      if (liveForm?.dataset?.submitted === 'true') {
        return {
          result: 'The contact form is currently showing the submitted confirmation receipt.',
          step: args.say || args.note,
          shown: true,
        };
      }

      const shouldWalkAll = Boolean(args.walkthrough) || (!args.focus && !Object.keys(patch).length);
      if (shouldWalkAll) {
        const walkRes = await runContactWalkthrough(formEl, { patch });
        const covered = walkRes.walked.length ? walkRes.walked.join(' -> ') : 'topic -> submit';
        return {
          result: `Positioned chat aside and walked pointer + mini bubble across form fields (${covered}). Do NOT call fill_contact or point_at again — now write the full 6-section Markdown guide in chat.`,
          step: args.say || args.note || 'Walked through all 6 form fields',
          shown: true,
        };
      }

      const fieldMap = {
        name: 'contact-name',
        email: 'contact-email-input',
        topic: 'contact-topic',
        company: 'contact-company',
        message: 'contact-message',
        submit: 'contact-submit',
      };
      const defaultFocus = Object.keys(patch).find((k) => fieldMap[k]) || 'name';
      const focusKey = args.focus && fieldMap[args.focus] ? args.focus : defaultFocus;
      const landmarkId = fieldMap[focusKey] || 'contact-form';

      contactWalkToken += 1;
      await ensureInSightline(formEl, { extra: 26, dodgeEl: formEl });
      window.dispatchEvent(
        new CustomEvent('ai:contact-fill', {
          detail: {
            fields: patch,
            focus: focusKey,
            note: args.note || args.say || '',
          },
        }),
      );
      await wait(80);
      const updatedTarget = landmark(landmarkId) || landmark('contact-form') || formEl;
      await ensureInSightline(updatedTarget, { extra: 30, dodgeEl: formEl });
      await flyTo(updatedTarget, { press: Boolean(Object.keys(patch).length && focusKey !== 'submit') });
      const calloutTitle = LANDMARKS[landmarkId]?.label || 'Contact form';
      setCursorSpeech(args.note || args.say || calloutTitle, { duration: 5400 });
      // Keep the note inside `.contact-ai-coach` in-flow so a floating callout never covers adjacent inputs like Name/Email.
      const disposeContactSpot = spotlight(updatedTarget, calloutTitle, '');
      const clearOnInteract = () => {
        disposeContactSpot();
        formEl.removeEventListener('pointerdown', clearOnInteract);
        formEl.removeEventListener('focusin', clearOnInteract);
      };
      formEl.addEventListener('pointerdown', clearOnInteract, { once: true });
      formEl.addEventListener('focusin', clearOnInteract, { once: true });
      setTimeout(clearOnInteract, 3400);

      const patchedNames = Object.keys(patch);
      return {
        result: `${
          patchedNames.length ? `Pre-filled ${patchedNames.join(', ')}; ` : ''
        }Highlighted ${focusKey} and positioned chat clear of #contact-form. Do NOT call fill_contact, point_at, or navigate again this turn — explain all relevant fields directly in your message.`,
        step: args.say || args.note,
        shown: true,
      };
    }

    case 'move_chat': {
      const panel = document.querySelector('.as-panel.is-companion');
      if (!panel) return { result: 'The chat panel is not currently floating over the page.', step: '', shown: false };
      const pos = args.position || 'auto';
      const sz = args.size || (pos === 'reset' ? 'default' : 'keep');
      const target = pickExplicitBox(panel, pos, sz);
      if (!target) return { result: 'Chat panel is already in a clear spot.', step: args.say, shown: false };
      const moved = await animatePanelBox(panel, target);
      if (moved && args.say) setCursorSpeech(args.say, { duration: 3600 });
      return {
        result: moved ? `Adjusted the chat panel (${pos}, size: ${sz}).` : `Chat panel is already at ${pos}.`,
        step: args.say,
        shown: moved,
      };
    }

    default:
      return { result: 'Not available.', step: '' };
  }
}

/** Live snapshot of what the visitor currently sees on the page. */
export function getPageState() {
  const activeTab = document.querySelector('#work .tab.is-active');
  const openExpEl = document.querySelector('#experience .exp-item.is-open');
  const expRows = [...document.querySelectorAll('#experience .exp-item')];
  const openIndex = openExpEl ? expRows.indexOf(openExpEl) : -1;
  const form = document.getElementById('contact-form');
  const val = (id) => (document.getElementById(id)?.value || '').trim();
  const filled = ['name', 'email', 'company', 'message'].filter((f) =>
    val(f === 'email' ? 'contact-email-input' : `contact-${f}`),
  );
  const missing = [
    !val('contact-name') && 'name',
    !val('contact-email-input') && 'email',
    !val('contact-message') && 'message',
  ].filter(Boolean);
  return {
    section: currentSection() || 'top',
    activeSystem: activeTab?.id?.replace(/^tab-/, '') || SYSTEM_DATA[0]?.id || '',
    openExperience: openIndex >= 0 ? ROLES[openIndex]?.id || '' : '',
    contact: form
      ? {
          topic: form.dataset.topic || 'project',
          submitted: form.dataset.submitted === 'true',
          filled,
          missing,
        }
      : null,
  };
}

/** Execute a declarative sequence of page steps (workflow macro or sandbox bridge). */
export async function runWorkflowSteps(steps, onStep) {
  const results = [];
  for (const step of steps || []) {
    if (!step) continue;
    if (step.action === 'wait') {
      await wait(reduce() ? 0 : Math.min(2500, Math.max(100, Number(step.args?.ms) || 600)));
      results.push(`Waited ${step.args?.ms || 600}ms`);
      continue;
    }
    const out = await runTool({ name: step.action, args: step.args || {} }).catch(() => ({
      result: `${step.action} failed.`,
      step: '',
      shown: false,
    }));
    results.push(out.result);
    if (out.shown) onStep?.(out.step || '', step.action, step.args || {});
  }
  return results;
}

if (typeof window !== 'undefined' && !window.__aiCursorPointBound) {
  window.__aiCursorPointBound = true;
  const CONTACT_FIELD_IDS = {
    topic: 'contact-topic',
    name: 'contact-name',
    email: 'contact-email-input',
    company: 'contact-company',
    message: 'contact-message',
    submit: 'contact-submit',
  };
  window.addEventListener('ai:cursor-point-field', async (e) => {
    const field = e?.detail?.field;
    const note = e?.detail?.note || '';
    const targetId = CONTACT_FIELD_IDS[field];
    const targetEl = targetId ? document.getElementById(targetId) : null;
    if (!targetEl) return;
    const myToken = ++contactWalkToken;
    const formEl = document.getElementById('contact-form');
    await ensureInSightline(targetEl, { extra: 30, dodgeEl: formEl || targetEl });
    if (myToken !== contactWalkToken || !document.body.contains(targetEl)) return;
    await flyTo(targetEl, { press: false, duration: 440 });
    if (note && myToken === contactWalkToken) setCursorSpeech(note, { duration: 4800 });
  });
  window.addEventListener('ai:cursor-walk-all', async (e) => {
    const formEl = document.getElementById('contact-form') || document.getElementById('contact');
    if (!formEl) return;
    await runContactWalkthrough(formEl, { isVi: e?.detail?.isVi });
  });
}
