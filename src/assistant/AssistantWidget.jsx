import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GREETING, QUICK_REPLIES, resolveChip, resolveReply } from './knowledge';
import { answerLocally, ask, followUp, perform } from './client';
import { focusStop } from './director';
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

function Icon({ d, size = 24, stroke = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={stroke ? 'none' : 'currentColor'}
      stroke={stroke ? 'currentColor' : 'none'}
      strokeWidth={stroke ? 1.6 : 0}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

function Avatar() {
  return (
    <span className="as-avatar" aria-hidden>
      K
    </span>
  );
}

let seq = 0;
const nextId = () => {
  seq += 1;
  return `m${seq}`;
};

const CLOSE_MS = 500; // matches the drawer's 0.5s slide-out
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  // mini: the drawer steps aside so the page it just changed is visible
  const [mini, setMini] = useState(false);
  const [teaser, setTeaser] = useState(true);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [narration, setNarration] = useState('');
  // null = not touring; otherwise the whole walk lives here
  const [tour, setTour] = useState(null);
  const [, setMemory] = useState(loadMemory);
  const [resumed, setResumed] = useState(false);

  const [messages, setMessages] = useState(() => {
    const mem = loadMemory();
    if (!hasHistory(mem)) {
      return GREETING.map((text, i) => ({
        id: nextId(),
        role: 'bot',
        text,
        chips: i === GREETING.length - 1 ? QUICK_REPLIES.map((q) => q.label) : [],
      }));
    }
    // Welcome them back to the same thread rather than restarting cold.
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

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const later = useCallback((fn, ms) => {
    const t = setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
    return t;
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (open && !closing && !mini) scrollToBottom();
  }, [messages, open, closing, mini, scrollToBottom]);

  /* open / close / minimise --------------------------------------------- */

  const openPanel = useCallback(() => {
    setTeaser(false);
    setClosing(false);
    setMini(false);
    setOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    if (!open || closing) return;
    setClosing(true);
    later(() => {
      restoreFocus.current = true;
      setOpen(false);
      setClosing(false);
      setMini(false);
    }, CLOSE_MS);
  }, [open, closing, later]);

  /* the launcher only exists while closed, so restore focus after it remounts */
  useEffect(() => {
    if (open || !restoreFocus.current) return;
    restoreFocus.current = false;
    toggleRef.current?.focus();
  }, [open]);

  /* Escape closes; Tab is trapped while the drawer is modal */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePanel();
        return;
      }
      if (mini || e.key !== 'Tab') return;
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
  }, [open, closing, mini, closePanel]);

  /* focus the composer once the drawer has landed */
  useEffect(() => {
    if (!open || closing || mini) return undefined;
    const t = setTimeout(() => inputRef.current?.focus(), CLOSE_MS);
    timers.current.add(t);
    return () => clearTimeout(t);
  }, [open, closing, mini]);

  /* ---- guided tour ---------------------------------------------------
     The drawer closes and the page becomes the presentation. Each stop
     scrolls, rings its element, and speaks; the walk advances on a timer
     until the visitor pauses, steps back, or ends it. */

  const startTour = useCallback(
    (stops) => {
      setTeaser(false);
      setClosing(false);
      setMini(false);
      setOpen(false); // release the scroll lock: the page must be able to move
      restoreFocus.current = false;
      setTour({ stops, index: 0, paused: false });
    },
    [],
  );

  const endTour = useCallback(() => {
    setTour(null);
    spotRef.current();
    spotRef.current = () => {};
    setClosing(false);
    setMini(false);
    setOpen(true);
  }, []);

  const stepTo = useCallback((next) => {
    setTour((t) => {
      if (!t) return t;
      if (next < 0) return t;
      if (next >= t.stops.length) return t;
      return { ...t, index: next };
    });
  }, []);

  const nextStop = useCallback(() => {
    setTour((t) => {
      if (!t) return t;
      if (t.index >= t.stops.length - 1) return t; // finish is handled below
      return { ...t, index: t.index + 1 };
    });
  }, []);

  /* move the page whenever the stop changes */
  useEffect(() => {
    if (!tour) return undefined;
    spotRef.current();
    const stop = tour.stops[tour.index];
    // let the drawer's exit finish before scrolling, so the move is visible
    const t = setTimeout(() => {
      spotRef.current = focusStop(stop) || (() => {});
    }, 60);
    return () => clearTimeout(t);
  }, [tour]);

  /* auto-advance: the guide leads, the visitor can interrupt */
  useEffect(() => {
    if (!tour || tour.paused) return undefined;
    const atEnd = tour.index >= tour.stops.length - 1;
    if (atEnd) return undefined;
    const t = setTimeout(() => setTour((cur) => (cur && !cur.paused ? { ...cur, index: cur.index + 1 } : cur)), TOUR_DWELL);
    return () => clearTimeout(t);
  }, [tour]);

  /* leaving the page mid-tour should not strand a spotlight */
  useEffect(() => () => spotRef.current(), []);

  /* body scroll lock — released while the drawer is minimised so the page moves */
  useEffect(() => {
    if (!open || mini) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, mini]);

  /* messaging ---------------------------------------------------------- */

  /* persist: transcript, visit count, and the register we infer from what they
     actually type (not from what we say back) */
  const recordTurn = useCallback((role, text) => {
    setMemory((mem) => {
      const userTexts = [...mem.messages.filter((m) => m.role === 'user').map((m) => m.text), role === 'user' ? text : ''].filter(Boolean);
      const next = {
        ...rememberTurn(mem, role, text),
        style: mergeStyle(mem.style, inferStyle(userTexts.slice(-6))),
        lang: inferStyle(userTexts.slice(-6))?.lang || mem.lang,
      };
      saveMemory(next);
      return next;
    });
  }, []);

  const pushBot = useCallback(
    (payload) => {
      setMessages((prev) => [...prev, { id: nextId(), role: 'bot', ...payload }]);
      recordTurn('bot', payload.text);
    },
    [recordTurn],
  );

  /* one visit per page load, not per render: StrictMode runs effects twice */
  const counted = useRef(false);
  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    setResumed(hasHistory(loadMemory()));
    setMemory((mem) => {
      const next = {
        ...mem,
        visits: (mem.visits || 0) + 1,
        firstSeen: mem.firstSeen || new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      };
      saveMemory(next);
      return next;
    });
  }, []);

  const askAndAnswer = useCallback(
    async (label) => {
      const history = [...messages, { id: nextId(), role: 'user', text: label }];
      setMessages(history);
      setBusy(true);
      setNarration('');

      // Persist and derive the profile in one pass: state updates land after
      // this render, so the request would otherwise carry last turn's profile.
      const base = loadMemory();
      const withTurn = rememberTurn(base, 'user', label);
      const userTexts = withTurn.messages.filter((m) => m.role === 'user').map((m) => m.text);
      const style = mergeStyle(base.style, inferStyle(userTexts.slice(-6)));
      const nextMem = { ...withTurn, style, lang: style?.lang || base.lang };
      saveMemory(nextMem);
      setMemory(nextMem);

      const profile = visitorPrompt(nextMem, currentSection());
      const result = (await ask(history, { profile })) || answerLocally(label);
      if (!alive.current) return;

      const calls = result.calls || [];

      // A tour is a whole mode, not a page nudge — handle it before anything else.
      const tourCall = calls.find((c) => c.name === 'start_tour');
      if (tourCall) {
        const stops = buildStops(tourCall.args.stops.map((x) => x.id), Object.fromEntries(tourCall.args.stops.map((x) => [x.id, x.note])));
        if (tourCall.args.intro) pushBot({ text: tourCall.args.intro });
        setBusy(false);
        startTour(stops);
        return;
      }

      if (!calls.length) {
        pushBot({ text: result.text, chips: result.local ? result.chips : undefined });
        setBusy(false);
        return;
      }

      // Step aside FIRST: the drawer is modal, so while it is open the body is
      // scroll-locked and window.scrollTo silently does nothing.
      setNarration(calls[0].args.reason || '');
      setClosing(true);
      await wait(300);
      if (!alive.current) return;
      setMini(true); // releases the scroll lock and shows the narration bar
      setClosing(false);
      await wait(80); // let React commit before driving the page
      if (!alive.current) return;

      const shownId = calls.find((c) => c.args.system)?.args.system || calls.find((c) => c.args.section)?.args.section;
      if (shownId) setMemory((mem) => { const n = noteShown(noteTopic(mem, shownId), shownId); saveMemory(n); return n; });

      const results = await perform(calls);
      if (!alive.current) return;
      setNarration(results.filter(Boolean).join(' · ') || calls[0].args.reason || 'Showing you the page.');

      // A tool-calling turn returns no prose, so ask for the explanation now
      // that the page has already moved.
      const said = result.text || (await followUp(history, calls, results, undefined, profile));
      if (!alive.current) return;
      pushBot({ text: said || 'There you go — it is on screen now.' });
      setBusy(false);
    },
    [messages, pushBot, startTour],
  );

  const runChip = useCallback(
    (label) => {
      const action = resolveChip(label);

      // Checked before intent routing: a tour is a mode, not a question.
      if (label === 'Take the tour') {
        pushBot({ text: 'Let me walk you through it.' });
        startTour(buildStops(DEFAULT_ROUTE));
        return;
      }

      if (action?.intent) {
        askAndAnswer(label);
        return;
      }

      // Link / copy chips act without polluting the thread with a fake question.
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

      askAndAnswer(label);
    },
    [askAndAnswer, pushBot, startTour],
  );

  const send = (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    askAndAnswer(text);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const lastChips = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.role === 'bot' && m.chips?.length);
    return last ? last.id : null;
  }, [messages]);

  /* ---- touring: the docent bar replaces the drawer --------------------- */

  if (tour) {
    return (
      <TourBar
        stops={tour.stops}
        index={tour.index}
        paused={tour.paused}
        dwell={TOUR_DWELL}
        onNext={() => {
          if (tour.index >= tour.stops.length - 1) endTour();
          else nextStop();
        }}
        onPrev={() => stepTo(tour.index - 1)}
        onTogglePause={() => setTour((t) => (t ? { ...t, paused: !t.paused } : t))}
        onEnd={endTour}
      />
    );
  }

  /* ---- minimised: a narration bar instead of the drawer ---------------- */

  if (open && mini) {
    return (
      <div className="as-narrator" role="status" aria-live="polite">
        <span className="as-narrator-dot" aria-hidden />
        <p className="as-narrator-text">{narration || 'Showing you the page.'}</p>
        <button type="button" className="as-narrator-btn" onClick={() => setMini(false)} aria-label="Back to chat">
          <Icon d="M21 12a8 8 0 01-8 8H7l-4 3 1.2-4.2A8 8 0 1121 12z" size={18} />
        </button>
        <button type="button" className="as-narrator-btn" onClick={closePanel} aria-label="Close assistant">
          <Icon d="M6 6l12 12M18 6L6 18" size={18} />
        </button>
      </div>
    );
  }

  if (!open && !closing) {
    return (
      <div className="as-launcher">
        {teaser ? (
          <div className="as-teaser">
            <button
              type="button"
              className="as-teaser-close"
              onClick={() => setTeaser(false)}
              aria-label="Dismiss greeting"
            >
              <Icon d="M6 6l12 12M18 6L6 18" size={12} />
            </button>
            <button type="button" className="as-teaser-text" onClick={openPanel}>
              Hi! Ask about Khang's work.
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
          aria-label="Open assistant"
        >
          <Icon d="M21 12a8 8 0 01-8 8H7l-4 3 1.2-4.2A8 8 0 1121 12z" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="as-scrim" onClick={closePanel} aria-hidden />

      <div
        id="assistant-panel"
        className="as-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Assistant chat"
        style={closing ? { animationName: 'as-slide-to-right' } : undefined}
      >
        <div className="as-head">
          <div className="as-head-text">
            <h2 className="as-title">Khang&apos;s assistant</h2>
            <p className="as-status">Online · answers from this page</p>
          </div>
          <button type="button" className="as-close" onClick={closePanel} aria-label="Close assistant">
            <Icon d="M6 6l12 12M18 6L6 18" />
          </button>
        </div>

        <div className="as-log" ref={logRef} role="log" aria-live="polite" aria-relevant="additions">
          {resumed ? (
            <p className="as-resumed">
              Continuing from your last visit
              <button
                type="button"
                className="as-resumed-reset"
                onClick={() => {
                  clearMemory();
                  setMemory(loadMemory());
                  setResumed(false);
                  setMessages(
                    GREETING.map((text, i) => ({
                      id: nextId(),
                      role: 'bot',
                      text,
                      chips: i === GREETING.length - 1 ? QUICK_REPLIES.map((q) => q.label) : [],
                    })),
                  );
                }}
              >
                Start fresh
              </button>
            </p>
          ) : null}
          {messages.map((m) => (
            <div key={m.id} className={`as-row as-row-${m.role}`}>
              {m.role === 'bot' ? <Avatar /> : null}
              <div className="as-bubble-wrap">
                <div className="as-bubble">{m.text}</div>
                {m.id === lastChips && !busy ? (
                  <div className="as-chips">
                    {m.chips.map((chip) => (
                      <button type="button" key={chip} className="as-chip" onClick={() => runChip(chip)}>
                        {chip}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {busy ? (
            <div className="as-row as-row-bot">
              <Avatar />
              <div className="as-bubble as-typing" aria-label="Assistant is typing">
                <span />
                <span />
                <span />
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
            placeholder="Ask about the work, the stack, or contact"
          />
          <button type="submit" className="as-send" disabled={!input.trim() || busy} aria-label="Send message">
            <Icon d="M21 3L3 10.5l7 3 3 7L21 3z" size={16} />
          </button>
        </form>
      </div>
    </>
  );
}
