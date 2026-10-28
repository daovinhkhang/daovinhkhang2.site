/**
 * The director: turns a validated tool call into real movement on the page.
 *
 * Every step is expressed as a plain DOM sequence so the widget never needs a
 * handle into React state. `show_system` and `open_experience` dispatch a
 * CustomEvent that App listens for — that is the only coupling, and it is one
 * line on each side.
 *
 * prefers-reduced-motion collapses every transition to an instant jump.
 */

const reduce = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Smooth-scroll an element clear of the sticky header + ticker. */
export function scrollIntoView(el, extra = 12) {
  if (!el) return;
  const header = document.querySelector('.site-header');
  const ticker = document.querySelector('.ticker');
  const offset =
    (header?.getBoundingClientRect().height ?? 0) + (ticker?.getBoundingClientRect().height ?? 0) + extra;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: reduce() ? 'auto' : 'smooth' });
}

/**
 * Spotlight: draws a ring around a target and dims the rest of the viewport.
 * Returns a disposer.
 */
export function spotlight(el, label) {
  if (!el) return () => {};
  const ring = document.createElement('div');
  ring.className = 'ai-spotlight';
  ring.setAttribute('aria-hidden', 'true');

  const tag = document.createElement('span');
  tag.className = 'ai-spotlight-tag';
  tag.textContent = label || '';
  if (label) ring.appendChild(tag);

  document.body.appendChild(ring);

  const place = () => {
    const r = el.getBoundingClientRect();
    const pad = 10;
    ring.style.transform = `translate3d(${r.left - pad}px, ${r.top - pad}px, 0)`;
    ring.style.width = `${r.width + pad * 2}px`;
    ring.style.height = `${r.height + pad * 2}px`;
  };

  place();
  requestAnimationFrame(() => ring.classList.add('is-on'));

  const onScroll = () => place();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    ring.classList.remove('is-on');
    setTimeout(() => ring.remove(), 400);
  };
}

/**
 * Runs one validated tool call. Resolves to a short log line for the thread.
 */
export async function runTool(call) {
  const { name, args } = call;

  if (name === 'show_system') {
    window.dispatchEvent(new CustomEvent('ai:show-system', { detail: { id: args.system } }));
    await wait(120);
    const el = document.querySelector('#work .tabs');
    scrollIntoView(el, 24);
    await wait(reduce() ? 0 : 620);
    return args.reason || 'Opened that system.';
  }

  if (name === 'open_experience') {
    window.dispatchEvent(new CustomEvent('ai:open-experience', { detail: { id: args.company } }));
    await wait(120);
    const el = document.querySelector('#experience');
    scrollIntoView(el, 24);
    await wait(reduce() ? 0 : 620);
    return args.reason || 'Opened that role.';
  }

  if (name === 'go_to_section') {
    const el = document.getElementById(args.section);
    scrollIntoView(el, 24);
    await wait(reduce() ? 0 : 620);
    return args.reason || 'Scrolled there.';
  }

  if (name === 'highlight') {
    let el = null;
    try {
      el = document.querySelector(args.selector);
    } catch {
      el = null; // model produced an invalid selector
    }
    if (!el) return "Couldn't find that on the page.";
    scrollIntoView(el, 40);
    await wait(reduce() ? 0 : 560);
    const dispose = spotlight(el, args.label);
    setTimeout(dispose, 5200);
    return args.label ? `Pointed out: ${args.label}` : 'Pointed it out.';
  }

  return '';
}
