import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GREETING, QUICK_REPLIES, resolveChip } from './knowledge';
import { answerLocally, cancel, converse } from './client';
import { clearStage, focusStop, scrollIntoView } from './director';
import { LANDMARKS, LINKS } from './tools';
import { EXPERIENCES, SYSTEMS } from '../content';
import { ackLine, actionLine, afterLine, doneLine, thinkingLine, voiceFor } from './voice';
import { DEFAULT_ROUTE, TOUR_DWELL, buildStops } from './tour';
import {
  clearMemory,
  currentSection,
  hasHistory,
  inferStyle,
  loadMemory,
  mergeStyle,
  noteShown,
  noteTopic,
  rememberTurn,
  saveMemory,
  visitorPrompt,
} from './memory';
import TourBar from './TourBar';

function Icon({ d, size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

const ICON = {
  chat: 'M21 12a8 8 0 01-8 8H7l-4 3 1.2-4.2A8 8 0 1121 12z',
  close: 'M6 6l12 12M18 6L6 18',
  send: 'M21 3L3 10.5l7 3 3 7L21 3z',
  expand: 'M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7',
  collapse: 'M4 14h6v6M20 10h-6V4M10 14l-7 7M14 10l7-7',
  link: 'M7 17L17 7M9 7h8v8',
};

function Avatar() {
  return (
    <span className="as-avatar" aria-hidden>
      K
    </span>
  );
}

/**
 * A new answer arrives word by word, the way someone says it. Restored turns
 * render whole. Screen readers get the whole sentence from the log at once.
 */
function Spoken({ text, fresh }) {
  if (!fresh) return text;
  const parts = text.split(/(\s+)/);
  const step = Math.min(28, 900 / Math.max(1, parts.length / 2));
  let n = 0;
  return parts.map((w, i) =>
    /^\s*$/.test(w) ? (
      w
    ) : (
      // eslint-disable-next-line react/no-array-index-key
      <span key={i} className="as-word" style={{ animationDelay: `${Math.round(n++ * step)}ms` }}>
        {w}
      </span>
    ),
  );
}

// A per-load prefix keeps ids unique even if this module is re-evaluated
// (hot reload) while the thread in state still holds the old ids.
const RUN = Math.random().toString(36).slice(2, 7);
let seq = 0;
const nextId = () => {
  seq += 1;
  return `${RUN}-${seq}`;
};

const CLOSE_MS = 500; // matches the drawer's 0.5s slide-out
const MORPH_MS = 420; // drawer → companion
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Typed tour requests, so the walk also works when the model is unavailable.
const TOUR_ASK = /\b(tour|walk ?through|show me around)\b|dẫn (mình|tôi|em)? ?(đi )?(xem|tham quan)|tham quan|giới thiệu (tổng quan|toàn bộ|cả trang)/i;

/** Human names for what the guide is handling, for its wait lines. */
const NAMES = {
  system: (id) => SYSTEMS.find((s) => s.id === id)?.short || id,
  company: (id) => EXPERIENCES.find((j) => j.id === id)?.company || id,
  landmark: (id) => LANDMARKS[id]?.label || '',
};

const greeting = () =>
  GREETING.map((text, i) => ({
    id: nextId(),
    role: 'bot',
    text,
    chips: i === GREETING.length - 1 ? QUICK_REPLIES.map((q) => q.label) : [],
  }));

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  // companion: the drawer shrinks beside the page while the guide acts on it
  const [companion, setCompanion] = useState(false);
  const [teaser, setTeaser] = useState(true);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [acting, setActing] = useState(false);

  // what the guide says while it works; never a bare spinner for long
  const [waitLine, setWaitLine] = useState('');
  const [tour, setTour] = useState(null);
  const [, setMemory] = useState(loadMemory);
  const [resumed, setResumed] = useState(false);

  const [messages, setMessages] = useState(() => {
    const mem = loadMemory();
    if (!hasHistory(mem)) return greeting();
    return mem.messages.map((m, i) => ({
      id: nextId(),
      role: m.role === 'user' ? 'user' : 'bot',
      text: m.text,
      chips: i === mem.messages.length - 1 && m.role !== 'user' ? QUICK_REPLIES.map((q) => q.label) : [],
    }));
  });

  const inputRef = useRef(null);
  const logRef = useRef(null);
  const toggleRef = useRef(null);
  const timers = useRef(new Set());
  const restoreFocus = useRef(false);
  const alive = useRef(true);
  const spotRef = useRef(() => {});
  const companionRef = useRef(false);
  companionRef.current = companion;
  const waitTimer = useRef(0);

  /* Speak now, and if nothing new happens for a while, say something again —
     silence past ~3s is where people start wondering if it broke. */
  const speakWhileWaiting = useCallback((line, voice, since) => {
    clearTimeout(waitTimer.current);
    if (line) setWaitLine(line);
    const again = () => {
      waitTimer.current = setTimeout(() => {
        if (!alive.current) return;
        setWaitLine(thinkingLine(voice, Date.now() - since));
        again();
      }, 3400);
    };
    again();
  }, []);

  const stopWaiting = useCallback(() => {
    clearTimeout(waitTimer.current);
    setWaitLine('');
  }, []);

  useEffect(() => () => clearTimeout(waitTimer.current), []);

  useEffect(() => {
    alive.current = true;
    const pending = timers.current;
    return () => {
      alive.current = false;
      pending.forEach(clearTimeout);
      cancel();
      clearStage();
    };
  }, []);

  const later = useCallback((fn, ms) => {
    const t = setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (el && open && !closing) el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion() ? 'auto' : 'smooth' });
  }, [messages, busy, open, closing, companion]);

  /* ---- open / close / companion ------------------------------------------ */

  const openPanel = useCallback(() => {
    setTeaser(false);
    setClosing(false);
    setCompanion(false);
    setOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    if (!open || closing) return;
    setClosing(true);
    clearStage();
    later(() => {
      restoreFocus.current = true;
      setOpen(false);
      setClosing(false);
      setCompanion(false);
    }, CLOSE_MS);
  }, [open, closing, later]);

  /** Shrink beside the page so the visitor can watch it move. */
  const toCompanion = useCallback(async () => {
    if (companionRef.current) return;
    companionRef.current = true;
    setCompanion(true);
    await wait(reduceMotion() ? 0 : MORPH_MS);
  }, []);

  const expand = useCallback(() => {
    clearStage();
    setCompanion(false);
  }, []);

  useEffect(() => {
    if (open || !restoreFocus.current) return;
    restoreFocus.current = false;
    toggleRef.current?.focus();
  }, [open]);

  /* Escape closes. Tab is trapped only while the drawer is modal — the
     companion sits beside a page the visitor is free to use. */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePanel();
        return;
      }
      if (companion || e.key !== 'Tab') return;
      const panel = document.getElementById('assistant-panel');
      if (!panel) return;
      const items = Array.from(
        panel.querySelectorAll('button:not([disabled]), textarea, a[href], [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, companion, closePanel]);

  useEffect(() => {
    if (!open || closing || companion) return undefined;
    const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), CLOSE_MS);
    return () => clearTimeout(t);
  }, [open, closing, companion]);

  /* scroll lock only while the drawer is a modal */
  useEffect(() => {
    if (!open || companion) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, companion]);

  /* ---- guided tour -------------------------------------------------------- */

  const startTour = useCallback((stops) => {
    clearStage();
    setTeaser(false);
    setClosing(false);
    setCompanion(false);
    setOpen(false);
    restoreFocus.current = false;
    setTour({ stops, index: 0, paused: false });
  }, []);

  const endTour = useCallback(() => {
    setTour(null);
    spotRef.current();
    spotRef.current = () => {};
    setClosing(false);
    setCompanion(false);
    setOpen(true);
  }, []);

  const stepTo = useCallback((next) => {
    setTour((t) => (t && next >= 0 && next < t.stops.length ? { ...t, index: next } : t));
  }, []);

  useEffect(() => {
    if (!tour) return undefined;
    spotRef.current();
    const stop = tour.stops[tour.index];
    const t = setTimeout(() => {
      spotRef.current = focusStop(stop) || (() => {});
    }, 60);
    return () => clearTimeout(t);
  }, [tour]);

  useEffect(() => {
    if (!tour || tour.paused || tour.index >= tour.stops.length - 1) return undefined;
    const t = setTimeout(
      () => setTour((cur) => (cur && !cur.paused ? { ...cur, index: cur.index + 1 } : cur)),
      TOUR_DWELL,
    );
    return () => clearTimeout(t);
  }, [tour]);

  useEffect(() => () => spotRef.current(), []);

  /* ---- memory -------------------------------------------------------------- */

  const remember = useCallback((fn) => {
    setMemory((mem) => {
      const next = fn(mem);
      saveMemory(next);
      return next;
    });
  }, []);

  const recordTurn = useCallback((role, text) => remember((mem) => rememberTurn(mem, role, text)), [remember]);

  const counted = useRef(false);
  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    setResumed(hasHistory(loadMemory()));
    remember((mem) => ({
      ...mem,
      visits: (mem.visits || 0) + 1,
      firstSeen: mem.firstSeen || new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    }));
  }, [remember]);

  /* ---- messaging ------------------------------------------------------------ */

  const push = useCallback((msg) => {
    setMessages((prev) => [...prev, { id: nextId(), ...msg }]);
  }, []);

  const pushBot = useCallback(
    (payload) => {
      push({ role: 'bot', fresh: true, ...payload });
      recordTurn('bot', payload.text);
    },
    [push, recordTurn],
  );

  const askAndAnswer = useCallback(
    async (label) => {
      const history = [...messages, { id: nextId(), role: 'user', text: label }];
      setMessages(history);
      setBusy(true);

      // Profile is built synchronously from the transcript: React state lands a
      // render late, which would send last turn's style with this message.
      const base = loadMemory();
      const withTurn = rememberTurn(base, 'user', label);
      const userTexts = withTurn.messages.filter((m) => m.role === 'user').map((m) => m.text);
      const style = mergeStyle(base.style, inferStyle(userTexts.slice(-6)));
      const nextMem = { ...withTurn, style, lang: style?.lang || base.lang };
      saveMemory(nextMem);
      setMemory(nextMem);

      // The language of this message decides the wait lines; the register
      // (mình/bạn vs em/anh-chị) comes from how they have written so far.
      const voice = voiceFor({ lang: inferStyle([label])?.lang, register: style?.register });
      const since = Date.now();
      setWaitLine('');
      // A fast answer needs no "hold on"; anything slower gets one at once.
      clearTimeout(waitTimer.current);
      waitTimer.current = setTimeout(() => speakWhileWaiting(ackLine(voice), voice, since), 600);

      let spoke = '';
      const result =
        (await converse(history, {
          profile: visitorPrompt(nextMem, currentSection()),
          hooks: {
            beforeAct: async () => {
              setActing(true);
              await toCompanion();
            },
            onTool: (name, args) => {
              if (alive.current) speakWhileWaiting(actionLine(voice, name, args, NAMES), voice, since);
            },
            onThink: (acted) => {
              if (alive.current) speakWhileWaiting(acted ? afterLine(voice) : thinkingLine(voice, 0), voice, since);
            },
            onSay: (text) => {
              if (!alive.current) return;
              spoke = text;
              pushBot({ text });
            },
            onStep: (text, name, args) => {
              if (!alive.current) return;
              const line = text || doneLine(voice, name, args, NAMES);
              if (line) push({ role: 'step', text: line, fresh: true });
              const shown = args?.system || args?.company || args?.to;
              if (shown) remember((mem) => noteShown(noteTopic(mem, shown), shown));
            },
          },
        })) || answerLocally(label);

      if (!alive.current || result.aborted) return;
      stopWaiting();
      setActing(false);

      if (result.tour) {
        const stops = buildStops(
          result.tour.stops.map((x) => x.id),
          Object.fromEntries(result.tour.stops.map((x) => [x.id, x.note])),
        );
        if (result.text && result.text !== spoke) pushBot({ text: result.text });
        setBusy(false);
        startTour(stops);
        return;
      }

      if (result.local && TOUR_ASK.test(label)) {
        pushBot({ text: 'Let me walk you through it.' });
        setBusy(false);
        startTour(buildStops(DEFAULT_ROUTE));
        return;
      }

      const text = result.text?.trim();
      const extras = { replies: result.replies || undefined, chips: result.local ? result.chips : undefined };
      if (text && text === spoke) {
        // Already said mid-walk: hang the suggestions on that turn instead.
        setMessages((prev) => {
          const at = prev.map((m) => m.role === 'bot' && m.text === text).lastIndexOf(true);
          return at < 0 ? prev : prev.map((m, i) => (i === at ? { ...m, ...extras } : m));
        });
      } else {
        pushBot({
          text: text || (result.acted ? 'It is on screen now.' : "I couldn't put that together — try asking another way."),
          ...extras,
        });
      }
      setBusy(false);
    },
    [messages, push, pushBot, remember, speakWhileWaiting, startTour, stopWaiting, toCompanion],
  );

  const runChip = useCallback(
    async (label) => {
      const action = resolveChip(label);

      if (label === 'Take the tour') {
        pushBot({ text: 'Let me walk you through it.' });
        startTour(buildStops(DEFAULT_ROUTE));
        return;
      }
      if (action?.intent) {
        askAndAnswer(label);
        return;
      }
      if (action?.copy) {
        navigator.clipboard?.writeText(action.copy).then(
          () => pushBot({ text: `Email copied — ${action.copy}`, chips: ['Talk to Khang'] }),
          () => pushBot({ text: `Copy blocked by the browser. The address is ${action.copy}` }),
        );
        return;
      }
      if (action?.href) {
        window.open(action.href, action.href.startsWith('mailto:') ? '_self' : '_blank', 'noopener');
        return;
      }
      if (action?.anchor) {
        const el = document.querySelector(action.anchor);
        if (el) {
          await toCompanion();
          scrollIntoView(el, 24);
          return;
        }
      }
      askAndAnswer(label);
    },
    [askAndAnswer, pushBot, startTour, toCompanion],
  );

  /* model-written reply buttons: a question to send, or a link to open */
  const runReply = useCallback(
    (r) => {
      if (r.link && LINKS[r.link]) {
        const href = LINKS[r.link];
        window.open(href, /^(mailto|tel):/.test(href) ? '_self' : '_blank', 'noopener');
        return;
      }
      if (r.ask) askAndAnswer(r.ask);
    },
    [askAndAnswer],
  );

  const send = (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    askAndAnswer(text);
  };

  const onKeyDown = (e) => {
    // isComposing: Vietnamese/Japanese IMEs confirm a word with Enter
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  /* grow the composer with its text, up to four lines */
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = '';
    if (el.scrollHeight > el.clientHeight + 2) el.style.height = `${Math.min(el.scrollHeight + 1, 110)}px`;
  }, [input, open]);

  // Suggestions belong to the newest turn only.
  const lastId = useMemo(() => {
    const last = messages[messages.length - 1];
    return last && last.role === 'bot' && (last.chips?.length || last.replies?.length) ? last.id : null;
  }, [messages]);

  const reset = () => {
    cancel();
    clearStage();
    clearMemory();
    setMemory(loadMemory());
    setResumed(false);
    setBusy(false);
    setActing(false);
    stopWaiting();
    setMessages(greeting());
  };

  /* ---- render --------------------------------------------------------------- */

  if (tour) {
    return (
      <TourBar
        stops={tour.stops}
        index={tour.index}
        paused={tour.paused}
        dwell={TOUR_DWELL}
        onNext={() => (tour.index >= tour.stops.length - 1 ? endTour() : stepTo(tour.index + 1))}
        onPrev={() => stepTo(tour.index - 1)}
        onTogglePause={() => setTour((t) => (t ? { ...t, paused: !t.paused } : t))}
        onEnd={endTour}
      />
    );
  }

  if (!open && !closing) {
    return (
      <div className="as-launcher">
        {teaser ? (
          <div className="as-teaser">
            <button type="button" className="as-teaser-close" onClick={() => setTeaser(false)} aria-label="Dismiss greeting">
              <Icon d={ICON.close} size={12} />
            </button>
            <button type="button" className="as-teaser-text" onClick={openPanel}>
              Hi! I can show you around.
            </button>
          </div>
        ) : null}
        <button
          ref={toggleRef}
          type="button"
          className="as-toggle"
          onClick={openPanel}
          aria-expanded={false}
          aria-controls="assistant-panel"
          aria-label="Open Khang AI Agents"
        >
          <Icon d={ICON.chat} />
        </button>
      </div>
    );
  }

  return (
    <>
      {!companion ? <div className="as-scrim" onClick={closePanel} aria-hidden /> : null}

      <div
        id="assistant-panel"
        className={`as-panel${companion ? ' is-companion' : ''}${acting ? ' is-acting' : ''}`}
        role="dialog"
        aria-modal={companion ? 'false' : 'true'}
        aria-label="Khang AI Agents chat"
        style={closing ? { animationName: companion ? 'as-sink' : 'as-slide-to-right' } : undefined}
      >
        <div className="as-head">
          <div className="as-head-text">
            <h2 className="as-title">Khang AI Agents</h2>
            <p className="as-status">
              {acting ? (
                <>
                  <span className="as-live" aria-hidden />
                  Showing you on the page
                </>
              ) : (
                'Online · answers from this page'
              )}
            </p>
          </div>
          <div className="as-head-actions">
            {companion ? (
              <button type="button" className="as-close" onClick={expand} aria-label="Expand chat">
                <Icon d={ICON.expand} size={20} />
              </button>
            ) : (
              <button
                type="button"
                className="as-close"
                onClick={() => setCompanion(true)}
                aria-label="Shrink chat beside the page"
              >
                <Icon d={ICON.collapse} size={20} />
              </button>
            )}
            <button type="button" className="as-close" onClick={closePanel} aria-label="Close Khang AI Agents">
              <Icon d={ICON.close} />
            </button>
          </div>
        </div>

        <div className="as-log" ref={logRef} role="log" aria-live="polite" aria-relevant="additions">
          {resumed ? (
            <p className="as-resumed">
              Continuing from your last visit
              <button type="button" className="as-resumed-reset" onClick={reset}>
                Start fresh
              </button>
            </p>
          ) : null}

          {messages.map((m, i) => {
            if (m.role === 'step') {
              // a step is pushed once it has happened, so it is always done;
              // the typing dots below say the guide is deciding what is next
              return (
                <div key={m.id} className="as-step">
                  <span className="as-step-mark" aria-hidden />
                  <span className="as-step-text">{m.text}</span>
                </div>
              );
            }
            const prevRole = messages[i - 1]?.role;
            const grouped = prevRole === 'bot' || prevRole === 'step';
            return (
              <div key={m.id} className={`as-row as-row-${m.role}`}>
                {m.role === 'bot' ? grouped ? <span className="as-avatar-gap" aria-hidden /> : <Avatar /> : null}
                <div className="as-bubble-wrap">
                  <div className="as-bubble">{m.role === 'bot' ? <Spoken text={m.text} fresh={m.fresh} /> : m.text}</div>
                  {m.id === lastId && !busy ? (
                    <div className="as-chips">
                      {(m.replies || []).map((r) => (
                        <button
                          type="button"
                          key={r.label}
                          className={`as-chip${r.link ? ' is-link' : ''}`}
                          onClick={() => runReply(r)}
                        >
                          {r.label}
                          {r.link ? <Icon d={ICON.link} size={14} /> : null}
                        </button>
                      ))}
                      {(m.chips || []).map((chip) => (
                        <button type="button" key={chip} className="as-chip" onClick={() => runChip(chip)}>
                          {chip}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          {busy ? (
            <div className="as-row as-row-bot">
              {messages[messages.length - 1]?.role === 'user' ? <Avatar /> : <span className="as-avatar-gap" aria-hidden />}
              <div className={`as-bubble as-typing${waitLine ? ' has-line' : ''}`}>
                {waitLine ? (
                  <span className="as-wait-line" key={waitLine}>
                    {waitLine}
                  </span>
                ) : (
                  <span className="sr-only">Assistant is typing</span>
                )}
                <span className="as-dots" aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="as-strip" aria-hidden />

        <form className="as-compose" onSubmit={send}>
          <label className="sr-only" htmlFor="assistant-input">
            Type your question
          </label>
          <textarea
            id="assistant-input"
            ref={inputRef}
            className="as-input"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 600))}
            onKeyDown={onKeyDown}
            placeholder={acting ? 'Ask while I show you…' : 'Ask about work, stack or contact'}
          />
          <button type="submit" className="as-send" disabled={!input.trim() || busy} aria-label="Send message">
            <Icon d={ICON.send} size={16} />
          </button>
        </form>
      </div>
    </>
  );
}
