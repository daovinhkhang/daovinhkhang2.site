import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GREETING, QUICK_REPLIES, resolveChip } from './knowledge';
import { answerLocally, cancel, converse, executeApprovedRequest } from './client';
import {
  clampPanelDrag,
  clearStage,
  focusStop,
  getDragBounds,
  getDragOffset,
  clearCursorSpeech,
  getPageState,
  getSizeBounds,
  resetPanelDrag,
  runTool,
  scrollIntoView,
  setCursorSpeech,
  setDragOffset,
  setPanelBoxState,
} from './director';
import { CONTACT_TOPICS } from '../ContactIntake';
import { clearRegistry, deleteCustomTool, loadRegistry } from './registry';
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
import { ApprovalCard, ArtifactCard, ToolsPanel, TraceCard } from './AgentArtifacts';
import TourBar from './TourBar';
import FormatReply from './FormatReply';
import { openLinkWindow } from '../openLink';

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
  wrench: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z',
};

function Avatar() {
  return (
    <span className="as-avatar" aria-hidden>
      K
    </span>
  );
}

function Spoken({ text, fresh }) {
  return <FormatReply text={text} fresh={fresh} />;
}

const RUN = Math.random().toString(36).slice(2, 7);
let seq = 0;
const nextId = () => {
  seq += 1;
  return `${RUN}-${seq}`;
};

const CLOSE_MS = 500;
const MORPH_MS = 420;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const TOUR_ASK =
  /\b(tour|walk ?through|show me around)\b|dẫn (mình|tôi|em)? ?(đi )?(xem|tham quan)|tham quan|giới thiệu (tổng quan|toàn bộ|cả trang)/i;

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
  const [companion, setCompanion] = useState(false);
  const [teaser, setTeaser] = useState(true);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [acting, setActing] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [customTools, setCustomTools] = useState(loadRegistry);
  const [dodging, setDodging] = useState(false);

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

  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const logRef = useRef(null);
  const toggleRef = useRef(null);
  const timers = useRef(new Set());
  const restoreFocus = useRef(false);
  const alive = useRef(true);
  const spotRef = useRef(() => {});
  const companionRef = useRef(false);
  companionRef.current = companion;
  const openRef = useRef(false);
  openRef.current = open;
  const waitTimer = useRef(0);
  const actingRef = useRef(false);

  const cursorLead = useCallback((text) => {
    const clean = String(text || '')
      .replace(/[`*_#>]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return '';
    const stop = clean.search(/[.!?](?:\s|$)/);
    return stop > 12 && stop <= 82 ? clean.slice(0, stop + 1) : clean.slice(0, 84);
  }, []);

  const refreshTools = useCallback(() => {
    setCustomTools(loadRegistry());
  }, []);

  const speakWhileWaiting = useCallback((line, voice, since) => {
    clearTimeout(waitTimer.current);
    if (line) {
      setWaitLine(line);
      if (actingRef.current || document.querySelector('.ai-cursor.is-on')) {
        setCursorSpeech(line, { duration: 4000 });
      }
    }
    const again = () => {
      waitTimer.current = setTimeout(() => {
        if (!alive.current) return;
        const nextLine = thinkingLine(voice, Date.now() - since);
        setWaitLine(nextLine);
        if (actingRef.current || document.querySelector('.ai-cursor.is-on')) {
          setCursorSpeech(nextLine, { duration: 3600 });
        }
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
    const onDodge = (e) => {
      if (alive.current) setDodging(Boolean(e?.detail?.active));
    };
    const onWalkProgress = (e) => {
      const line = e?.detail?.line;
      if (alive.current && line) {
        clearTimeout(waitTimer.current);
        setWaitLine(line);
      }
    };
    const onResize = () => clampPanelDrag(panelRef.current);
    window.addEventListener('ai:panel-dodging', onDodge);
    window.addEventListener('ai:walkthrough-progress', onWalkProgress);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('ai:panel-dodging', onDodge);
      window.removeEventListener('ai:walkthrough-progress', onWalkProgress);
      window.removeEventListener('resize', onResize);
    };
  }, []);

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
    resetPanelDrag(panelRef.current);
    setTeaser(false);
    setClosing(false);
    setCompanion(false);
    setOpen(true);
    refreshTools();
  }, [refreshTools]);

  const closePanel = useCallback(() => {
    if (!open || closing) return;
    setClosing(true);
    setToolsOpen(false);
    clearStage();
    later(() => {
      restoreFocus.current = true;
      resetPanelDrag(panelRef.current);
      setOpen(false);
      setClosing(false);
      setCompanion(false);
    }, CLOSE_MS);
  }, [open, closing, later]);

  const toCompanion = useCallback(async () => {
    if (companionRef.current) return;
    companionRef.current = true;
    setToolsOpen(false);
    setCompanion(true);
    const settleMs = window.innerWidth >= 768 ? 60 : MORPH_MS;
    await wait(reduceMotion() ? 0 : settleMs);
  }, []);

  const expand = useCallback(() => {
    clearStage();
    resetPanelDrag(panelRef.current);
    setCompanion(false);
  }, []);

  const onHeadPointerDown = useCallback((e) => {
    if (!companionRef.current) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('button, a, input, textarea')) return;
    const panel = panelRef.current;
    if (!panel) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startRect = panel.getBoundingClientRect();
    const { x: baseDx, y: baseDy } = getDragOffset(panel);
    const bounds = getDragBounds(startRect);
    let moved = false;

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      if (!moved) {
        moved = true;
        panel.classList.add('is-dragging');
      }
      const nextLeft = Math.min(bounds.maxLeft, Math.max(bounds.minLeft, startRect.left + dx));
      const nextTop = Math.min(bounds.maxTop, Math.max(bounds.minTop, startRect.top + dy));
      setDragOffset(panel, baseDx + (nextLeft - startRect.left), baseDy + (nextTop - startRect.top));
    };

    const finish = () => {
      panel.classList.remove('is-dragging');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  }, []);

  const onResizePointerDown = useCallback((e, dir) => {
    if (!companionRef.current) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.stopPropagation();
    const panel = panelRef.current;
    if (!panel) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const r0 = panel.getBoundingClientRect();
    const { x: dx0, y: dy0 } = getDragOffset(panel);
    const wideSheet = window.innerWidth < 768 || r0.width > window.innerWidth * 0.7;
    const sb = getSizeBounds(wideSheet);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let moved = false;

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 2) return;
      if (!moved) {
        moved = true;
        panel.classList.add('is-dragging');
      }
      let nextL = r0.left;
      let nextT = r0.top;
      let nextW = r0.width;
      let nextH = r0.height;
      const clampVal = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

      if (!wideSheet) {
        if (dir.includes('w')) {
          const minL = Math.max(16, r0.right - sb.maxW);
          const maxL = r0.right - sb.minW;
          nextL = clampVal(r0.left + dx, minL, maxL);
          nextW = r0.right - nextL;
        } else if (dir.includes('e')) {
          const maxWHere = Math.min(sb.maxW, vw - 16 - r0.left);
          nextW = clampVal(r0.width + dx, sb.minW, Math.max(sb.minW, maxWHere));
        }
      }
      if (dir.includes('n')) {
        const minT = Math.max(wideSheet ? 56 : 16, r0.bottom - sb.maxH);
        const maxT = r0.bottom - sb.minH;
        nextT = clampVal(r0.top + dy, minT, maxT);
        nextH = r0.bottom - nextT;
      } else if (dir.includes('s')) {
        const maxHHere = Math.min(sb.maxH, (wideSheet ? vh : vh - 16) - r0.top);
        nextH = clampVal(r0.height + dy, sb.minH, Math.max(sb.minH, maxHHere));
      }

      setPanelBoxState(panel, {
        width: wideSheet ? undefined : nextW,
        height: nextH,
        dragX: dx0 + (nextL + nextW - r0.right),
        dragY: dy0 + (nextT + nextH - r0.bottom),
        wideSheet,
      });
    };

    const finish = () => {
      panel.classList.remove('is-dragging');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  }, []);

  useEffect(() => {
    if (open || !restoreFocus.current) return;
    restoreFocus.current = false;
    toggleRef.current?.focus();
  }, [open]);

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
    resetPanelDrag(panelRef.current);
    setTeaser(false);
    setClosing(false);
    setCompanion(false);
    setToolsOpen(false);
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

  const handleArtifactAction = useCallback(
    async (act) => {
      if (!act) return;
      await toCompanion();
      if (act.system) {
        await runTool({ name: 'show_system', args: { system: act.system } });
      } else if (act.company) {
        await runTool({ name: 'open_experience', args: { company: act.company } });
      } else if (act.to) {
        await runTool({ name: 'navigate', args: { to: act.to } });
      }
    },
    [toCompanion],
  );

  const handleApprove = useCallback(
    async (item) => {
      setMessages((prev) => prev.map((m) => (m.id === item.id ? { ...m, status: 'approved' } : m)));
      const out = await executeApprovedRequest(item.approval, {
        beforeAct: async () => {
          setActing(true);
          await toCompanion();
        },
        onStep: (text, name, args) => {
          if (!alive.current) return;
          const line = text || doneLine('en', name, args, NAMES);
          if (line) push({ role: 'step', text: line, fresh: true });
        },
        onTrace: (trace) => {
          if (alive.current) push({ role: 'trace', trace });
        },
        onArtifact: (artifact) => {
          if (alive.current) push({ role: 'artifact', artifact });
        },
        onRegistryChange: refreshTools,
      });
      setActing(false);
      if (out && out.ok === false && out.error) {
        pushBot({ text: `Execution stopped: ${out.error}` });
      }
    },
    [push, pushBot, refreshTools, toCompanion],
  );

  const handleReject = useCallback((item) => {
    setMessages((prev) => prev.map((m) => (m.id === item.id ? { ...m, status: 'rejected' } : m)));
  }, []);

  const runToolFromDrawer = useCallback(
    async (tool) => {
      setToolsOpen(false);
      if (tool.requiresApproval) {
        push({
          role: 'approval',
          status: 'pending',
          approval: {
            kind: 'custom_tool',
            toolName: tool.name,
            toolKind: tool.kind,
            title: `Approve tool: ${tool.name}`,
            description: tool.description,
            input: {},
            code: tool.code,
            steps: tool.steps,
          },
        });
        return;
      }

      const out = await executeApprovedRequest(
        { kind: 'custom_tool', toolName: tool.name, input: {} },
        {
          beforeAct: async () => {
            setActing(true);
            await toCompanion();
          },
          onStep: (text, name, args) => {
            if (!alive.current) return;
            const line = text || doneLine('en', name, args, NAMES);
            if (line) push({ role: 'step', text: line, fresh: true });
          },
          onTrace: (trace) => {
            if (alive.current) push({ role: 'trace', trace });
          },
          onArtifact: (artifact) => {
            if (alive.current) push({ role: 'artifact', artifact });
          },
          onRegistryChange: refreshTools,
        },
      );
      setActing(false);
      if (out?.result && !out.artifact) {
        const text = typeof out.result === 'string' ? out.result : JSON.stringify(out.result);
        pushBot({ text: `${tool.name}: ${text}` });
      }
    },
    [push, pushBot, refreshTools, toCompanion],
  );

  const askAndAnswer = useCallback(
    async (label, opts = {}) => {
      setToolsOpen(false);
      const displayText = opts.displayText || label;
      const history = [...messages, { id: nextId(), role: 'user', text: displayText }];
      const apiHistory =
        displayText === label ? history : [...messages, { id: nextId(), role: 'user', text: label }];
      setMessages(history);
      setBusy(true);

      const base = loadMemory();
      const withTurn = rememberTurn(base, 'user', displayText);
      const userTexts = withTurn.messages.filter((m) => m.role === 'user').map((m) => m.text);
      const style = mergeStyle(base.style, inferStyle(userTexts.slice(-6)));
      const nextMem = { ...withTurn, style, lang: style?.lang || base.lang };
      saveMemory(nextMem);
      setMemory(nextMem);

      const pageSnap = getPageState();
      const contactLine = pageSnap?.contact
        ? `\n- Contact form state: topic=${pageSnap.contact.topic}, filled=[${pageSnap.contact.filled.join(',') || 'none'}], missing=[${pageSnap.contact.missing.join(',') || 'none'}], submitted=${pageSnap.contact.submitted}.`
        : '';

      const voice = voiceFor({ lang: inferStyle([displayText])?.lang || style?.lang, register: style?.register });
      const since = Date.now();
      setWaitLine('');
      clearTimeout(waitTimer.current);
      waitTimer.current = setTimeout(() => speakWhileWaiting(ackLine(voice), voice, since), 220);

      let spoke = '';
      let actedThisTurn = false;
      const result =
        (await converse(apiHistory, {
          profile: `${visitorPrompt(nextMem, currentSection())}${contactLine}`,
          hooks: {
            beforeAct: async () => {
              actedThisTurn = true;
              actingRef.current = true;
              setActing(true);
              await toCompanion();
            },
            onTool: (name, args) => {
              if (!alive.current) return;
              const line = actionLine(voice, name, args, NAMES);
              speakWhileWaiting(line, voice, since);
              if (actingRef.current || document.querySelector('.ai-cursor.is-on')) {
                setCursorSpeech(line, { duration: 4200 });
              }
            },
            onThink: (acted) => {
              if (alive.current) speakWhileWaiting(acted ? afterLine(voice) : thinkingLine(voice, 0), voice, since);
            },
            onSay: (text) => {
              if (!alive.current) return;
              spoke = text;
              pushBot({ text });
              if (actedThisTurn || document.querySelector('.ai-cursor.is-on')) {
                setCursorSpeech(cursorLead(text), { duration: 5000 });
              }
            },
            onStep: (text, name, args) => {
              if (!alive.current) return;
              const line = text || doneLine(voice, name, args, NAMES);
              if (line) {
                push({ role: 'step', text: line, fresh: true });
                if (actingRef.current || document.querySelector('.ai-cursor.is-on')) {
                  setCursorSpeech(line, { duration: 4800 });
                }
              }
              const shown = args?.system || args?.company || args?.to;
              if (shown) remember((mem) => noteShown(noteTopic(mem, shown), shown));
            },
            onTrace: (trace) => {
              if (alive.current) push({ role: 'trace', trace });
            },
            onArtifact: (artifact) => {
              if (alive.current) push({ role: 'artifact', artifact });
            },
            onApproval: (approval) => {
              if (alive.current) push({ role: 'approval', approval, status: 'pending' });
            },
            onRegistryChange: refreshTools,
          },
        })) || (typeof opts.onLocalFallback === 'function' ? await opts.onLocalFallback(voice) : answerLocally(label));

      if (!alive.current || result.aborted) return;
      stopWaiting();
      actingRef.current = false;
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
        setMessages((prev) => {
          const at = prev.map((m) => m.role === 'bot' && m.text === text).lastIndexOf(true);
          return at < 0 ? prev : prev.map((m, i) => (i === at ? { ...m, ...extras } : m));
        });
      } else {
        const timeoutFallback = result.errorStatus
          ? style?.lang === 'vi'
            ? 'Kết nối tới model vừa bị timeout tạm thời — bạn gửi lại giúp mình hoặc thử các nút gợi ý bên dưới nhé.'
            : 'The model gateway timed out on that step — please retry or pick one of the shortcuts below.'
          : '';
        const finalReply =
          text ||
          timeoutFallback ||
          (result.artifacts?.length
            ? 'Here is the view I put together.'
            : result.acted
              ? 'It is on screen now.'
              : "I couldn't put that together — try asking another way.");
        pushBot({
          text: finalReply,
          ...extras,
          chips: result.errorStatus ? QUICK_REPLIES.map((q) => q.label) : extras.chips,
        });
        if (finalReply && (actedThisTurn || result.acted || document.querySelector('.ai-cursor.is-on'))) {
          setCursorSpeech(cursorLead(finalReply), { duration: 5000 });
        }
      }
      setBusy(false);
    },
    [messages, push, pushBot, refreshTools, remember, speakWhileWaiting, startTour, stopWaiting, toCompanion],
  );

  const askRef = useRef(askAndAnswer);
  askRef.current = askAndAnswer;

  useEffect(() => {
    const onContactAssist = async (e) => {
      if (!alive.current || busy) return;
      const detail = e?.detail || {};
      const topic = detail.topic || 'project';
      const focus = detail.focus || 'message';
      const mode = detail.mode === 'draft' ? 'draft' : 'guide';
      const topicMeta = CONTACT_TOPICS.find((t) => t.id === topic) || CONTACT_TOPICS[1];
      const mem = loadMemory();
      const isVi = mem.style?.lang !== 'en';

      const wasClosed = !openRef.current;
      setTeaser(false);
      setClosing(false);
      setOpen(true);
      await wait(reduceMotion() ? 0 : wasClosed ? 360 : 40);
      await toCompanion();

      const displayText =
        mode === 'draft'
          ? isVi
            ? `Gợi ý điền giúp mình phần "${focus}" (${topicMeta.short})`
            : `Help me draft the "${focus}" field (${topicMeta.short})`
          : isVi
            ? 'Hướng dẫn mình điền đầy đủ từng ô trong form liên hệ'
            : 'Walk me through every field in the contact form';

      const missingList = [
        !detail.values?.hasName && 'name',
        !detail.values?.hasEmail && 'email',
        (detail.values?.messageLen || 0) < 10 && 'message',
      ]
        .filter(Boolean)
        .join(', ');

      const prompt = [
        displayText,
        `(Context: visitor clicked "${mode}" on #contact-form; topic="${topic}", current focus="${focus}", missing required fields=[${missingList || 'none'}]. Call fill_contact AT MOST ONCE ${mode === 'draft' ? 'with focus="message" and pre-draft a concise starter brief' : 'with walkthrough=true so the pointer smoothly walks across ALL 6 sections (topic -> name -> email -> company -> message -> submit) with mini speech cues'}. Do NOT chain extra fill_contact or point_at calls. Then in your final formatted Markdown reply, guide them COMPLETELY through ALL 6 parts of the form: (1) Topic (Hiring / AI Role, AI Product / Build, Architecture Advisory, Collaboration / Other), (2) Name (*required*), (3) Email (*required*), (4) Company / Stack Context (optional), (5) Brief (*required*, min 10 chars — goal, current stack, timeline + mention "Fill template" / "Draft with AI" buttons), and (6) Send inquiry button (human-gated — sends to daovinhkhang0834@gmail.com with a KHG-... receipt ID).)`,
      ].join(' ');

      askRef.current(prompt, {
        displayText,
        onLocalFallback: async () => {
          actingRef.current = true;
          setActing(true);
          await toCompanion();
          const note =
            mode === 'draft'
              ? isVi
                ? 'Đã điền mẫu vào ô Brief — bạn chỉnh lại chút rồi gửi nhé!'
                : 'Added a starter draft to Brief — tailor it and send when ready.'
              : isVi
                ? 'Đã chỉ lần lượt đủ 6 ô — xem hướng dẫn chi tiết bên cạnh nhé!'
                : 'Walked through all 6 fields — see the full breakdown beside the form.';
          const out = await runTool({
            name: 'fill_contact',
            args: {
              topic,
              focus: mode === 'draft' ? 'message' : 'topic',
              walkthrough: mode !== 'draft',
              ...(mode === 'draft' ? { message: topicMeta.sample } : {}),
              note,
              say: note,
            },
          });
          setCursorSpeech(note, { duration: 5000 });
          if (out?.shown) push({ role: 'step', text: note, fresh: true });
          actingRef.current = false;
          setActing(false);
          return {
            local: true,
            text:
              mode === 'draft'
                ? isVi
                  ? 'Mình đã chèn sẵn một bản nháp chuẩn vào ô **Brief** để bạn chỉnh nhanh:\n\n1. **Topic**: kiểm tra lại nhóm đã chọn (`Hiring`, `Product Build`, `Advisory` hoặc `Other`).\n2. **Name** (*bắt buộc*): nhập tên hoặc danh xưng để anh Khang tiện phản hồi.\n3. **Email** (*bắt buộc*): nhập email nhận trả lời hoặc lịch hẹn.\n4. **Company / Stack Context** (*tùy chọn*): ghi công ty/team hoặc tech stack bạn đang dùng.\n5. **Brief** (*bắt buộc*, tối thiểu `10` ký tự): chỉnh nhẹ phần vừa điền cho sát mục tiêu & timeline.\n6. **Send inquiry**: AI không bao giờ tự gửi — kiểm tra kỹ rồi bấm **Send inquiry →** để chuyển thẳng tới `daovinhkhang0834@gmail.com` kèm mã xác nhận.'
                  : 'I added a structured draft into **Brief** so you can finish quickly:\n\n1. **Topic**: confirm the best match (`Hiring`, `Product Build`, `Advisory`, or `Other`).\n2. **Name** (*required*): how Khang should address you.\n3. **Email** (*required*): where Khang replies or sends a calendar invite.\n4. **Company / Stack Context** (*optional*): your org and stack for instant context.\n5. **Brief** (*required*, min `10` chars): tweak the draft for your goal and timing.\n6. **Send inquiry**: AI never auto-submits — click **Send inquiry →** when ready to deliver to `daovinhkhang0834@gmail.com` with a tracking ID.'
                : isVi
                  ? 'Dưới đây là **hướng dẫn chi tiết cả 6 phần** của form liên hệ:\n\n1. **Topic**: chọn 1 trong 4 mục (`Hiring / AI Role`, `AI Product / Build`, `Architecture Advisory`, `Collaboration / Other`) để đúng ngữ cảnh trao đổi.\n2. **Name** (*bắt buộc*): tên đầy đủ hoặc cách bạn muốn anh Khang xưng hô.\n3. **Email** (*bắt buộc*): địa chỉ email chính để nhận hồi âm hoặc lời mời họp.\n4. **Company / Stack Context** (*tùy chọn*): tên công ty, sản phẩm hoặc stack (`Odoo`, `FastAPI`, `RAG`...) để tiết kiệm thời gian trao đổi đầu.\n5. **Brief** (*bắt buộc*, tối thiểu `10` ký tự): viết 2–4 câu nêu mục tiêu, vấn đề và timeline dự kiến. Bạn có thể bấm các nút bước ngay trên **AI Coach**, bấm **Fill template**, hoặc bấm **Draft with AI** để mình soạn hộ.\n6. **Send inquiry**: chỉ gửi khi chính bạn bấm **Send inquiry →**; gửi xong hệ thống báo mã `KHG-...` và chuyển qua `daovinhkhang0834@gmail.com`.\n\nBạn có thể bấm trực tiếp từng bước trên thanh **AI Coach** hoặc nhắn thông tin cho mình điền giúp nhé!'
                  : 'Here is the **complete guide to all 6 sections** of the contact form:\n\n1. **Topic**: pick `Hiring / AI Role`, `AI Product / Build`, `Architecture Advisory`, or `Collaboration / Other`.\n2. **Name** (*required*): your name or preferred salutation.\n3. **Email** (*required*): your reply address for notes or invites.\n4. **Company / Stack Context** (*optional*): team name or current tech stack for quick context.\n5. **Brief** (*required*, min `10` chars): 2–4 lines on your goal, stack, and target timeline — click any step pill in **AI Coach**, **Fill template**, or **Draft with AI** for instant help.\n6. **Send inquiry**: strictly human-gated — click **Send inquiry →** when ready to deliver to `daovinhkhang0834@gmail.com` with a `KHG-...` receipt ID.\n\nTell me your details anytime if you want me to pre-fill them!',
            chips: ['Copy email', 'Take the tour'],
          };
        },
      });
    };

    const onContactSubmitted = async (e) => {
      if (!alive.current) return;
      const receipt = e?.detail || {};
      const mem = loadMemory();
      const summary = receipt.summary || {};
      const isVi =
        mem.style?.lang === 'vi' ||
        (!mem.style?.lang &&
          /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i.test(
            summary.message || '',
          ));

      setTeaser(false);
      setClosing(false);
      setOpen(true);
      await wait(reduceMotion() ? 0 : 40);
      await toCompanion();

      const via = Array.isArray(receipt.deliveredVia) ? receipt.deliveredVia : [];
      const sentViaGmail = via.includes('gmail');
      const syncedRemotely = sentViaGmail || via.some((c) => ['webhook', 'telegram', 'netlify-forms'].includes(c));
      const text = isVi
        ? `**Đã gửi xong rồi nè!** Mã yêu cầu của ${summary.name || 'bạn'}: \`${receipt.id || 'mới'}\` (${summary.topicLabel || summary.topic}).\n\n${
            sentViaGmail
              ? '- Hệ thống đã **gửi thẳng tới Gmail** `daovinhkhang0834@gmail.com` kèm email phản hồi của bạn.\n- Anh Khang thường hồi âm trong vòng **24 giờ**.'
              : syncedRemotely
                ? '- Thông tin đã được chuyển qua kênh thông báo trực tiếp tới anh Khang.'
                : '- Đang ở chế độ xem trước: bấm **Open Email App to Send Copy** ngay trên thẻ để gửi thẳng tới `daovinhkhang0834@gmail.com`.'
          }\n\nMình vẫn ở đây nếu bạn muốn xem thêm kiến trúc hay hỏi sâu về kinh nghiệm của anh Khang nhé!`
        : `**All set!** Your inquiry is logged as \`${receipt.id || ''}\` (${summary.topicLabel || summary.topic}).\n\n${
            sentViaGmail
              ? '- **Sent directly via Gmail** to `daovinhkhang0834@gmail.com` with your `reply-to` address attached.\n- Khang typically replies within **24 hours**.'
              : syncedRemotely
                ? '- Forwarded to Dao Vinh Khang’s live intake channel.'
                : '- Preview mode: click **Open Email App to Send Copy** on the receipt card to send directly to `daovinhkhang0834@gmail.com`.'
          }\n\nI am still right here if you would like to review any shipped systems in the meantime.`;

      pushBot({
        text,
        replies: [
          { label: isVi ? 'Mở Email gửi ngay' : 'Open Email App', link: 'email' },
          { label: isVi ? 'Xem LinkedIn' : 'Open LinkedIn', link: 'linkedin' },
          { label: isVi ? 'Xem KAMI Pro' : 'Review KAMI Pro', ask: isVi ? 'Cho mình xem KAMI Pro' : 'Show me KAMI Pro' },
        ],
      });
      setCursorSpeech(
        isVi
          ? `Đã gửi xong (${receipt.id || 'OK'}) — check chi tiết trong chat nhé!`
          : `Sent (${receipt.id || 'OK'}) — receipt details in chat!`,
        { duration: 4800 },
      );
    };

    window.addEventListener('ai:contact-assist', onContactAssist);
    window.addEventListener('ai:contact-submitted', onContactSubmitted);
    return () => {
      window.removeEventListener('ai:contact-assist', onContactAssist);
      window.removeEventListener('ai:contact-submitted', onContactSubmitted);
    };
  }, [busy, push, pushBot, toCompanion]);

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
        openLinkWindow(action.href);
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

  const runReply = useCallback(
    (r) => {
      if (r.link && LINKS[r.link]) {
        openLinkWindow(LINKS[r.link]);
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
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = '';
    if (el.scrollHeight > el.clientHeight + 2) el.style.height = `${Math.min(el.scrollHeight + 1, 110)}px`;
  }, [input, open]);

  // Suggestions belong to the newest bot turn of the current exchange.
  const lastId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (m.role === 'user') return null;
      if (m.role === 'bot' && (m.chips?.length || m.replies?.length)) return m.id;
    }
    return null;
  }, [messages]);

  const reset = () => {
    cancel();
    clearStage();
    resetPanelDrag(panelRef.current);
    clearMemory();
    clearRegistry();
    setMemory(loadMemory());
    setCustomTools([]);
    setToolsOpen(false);
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
        ref={panelRef}
        id="assistant-panel"
        className={`as-panel${companion ? ' is-companion' : ''}${acting ? ' is-acting' : ''}`}
        role="dialog"
        aria-modal={companion ? 'false' : 'true'}
        aria-label="Khang AI Agents chat"
        style={closing ? { animationName: companion ? 'as-sink' : 'as-slide-to-right' } : undefined}
      >
        {companion ? (
          <>
            {['n', 's', 'w', 'e', 'nw', 'ne', 'sw', 'se'].map((dir) => (
              <div
                key={dir}
                className={`as-resize as-resize-${dir}`}
                onPointerDown={(e) => onResizePointerDown(e, dir)}
                aria-hidden="true"
              />
            ))}
          </>
        ) : null}
        <div className="as-head" onPointerDown={onHeadPointerDown}>
          <div className="as-head-text">
            <h2 className="as-title">Khang AI Agents</h2>
            {dodging || acting ? (
              <p className="as-status">
                {dodging ? (
                  <>
                    <span className="as-live" aria-hidden />
                    Moving chat aside…
                  </>
                ) : (
                  <>
                    <span className="as-live" aria-hidden />
                    Showing you on the page
                  </>
                )}
              </p>
            ) : null}
          </div>
          <div className="as-head-actions">
            {customTools.length > 0 ? (
              <button
                type="button"
                className={`as-tools-toggle${toolsOpen ? ' is-active' : ''}`}
                onClick={() => setToolsOpen((v) => !v)}
                aria-expanded={toolsOpen}
                aria-label={`Session tools (${customTools.length})`}
                title="View agent-created tools"
              >
                <Icon d={ICON.wrench} size={15} />
                <span>{customTools.length}</span>
              </button>
            ) : null}
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

        {toolsOpen ? (
          <ToolsPanel
            tools={customTools}
            onRun={runToolFromDrawer}
            onDelete={(name) => setCustomTools(deleteCustomTool(name))}
            onClose={() => setToolsOpen(false)}
          />
        ) : null}

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
              return (
                <div key={m.id} className="as-step">
                  <span className="as-step-mark" aria-hidden />
                  <span className="as-step-text">{m.text}</span>
                </div>
              );
            }
            if (m.role === 'trace') {
              return <TraceCard key={m.id} trace={m.trace} />;
            }
            if (m.role === 'artifact') {
              return <ArtifactCard key={m.id} artifact={m.artifact} onAction={handleArtifactAction} />;
            }
            if (m.role === 'approval') {
              return (
                <ApprovalCard
                  key={m.id}
                  item={m}
                  onApprove={() => handleApprove(m)}
                  onReject={() => handleReject(m)}
                />
              );
            }
            const prevRole = messages[i - 1]?.role;
            const grouped = ['bot', 'step', 'trace', 'artifact', 'approval'].includes(prevRole);
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
                          {r.link ? <Icon d={ICON.link} size={11} /> : null}
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
            onChange={(e) => setInput(e.target.value.slice(0, 2000))}
            onKeyDown={onKeyDown}
            placeholder={acting ? 'Ask while I show you…' : 'Ask, paste a JD, or request a tool…'}
          />
          <button type="submit" className="as-send" disabled={!input.trim() || busy} aria-label="Send message">
            <Icon d={ICON.send} size={16} />
          </button>
        </form>
      </div>
    </>
  );
}
