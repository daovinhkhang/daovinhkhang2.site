import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GREETING, QUICK_REPLIES, resolveChip, resolveReply } from './knowledge';

/* Avatar: the same "K" mark used in the site header, so the assistant
   reads as part of the brand rather than a third-party widget. */
function Avatar({ size = 24 }) {
  return (
    <span className="as-avatar" style={{ width: size, height: size }} aria-hidden>
      K
    </span>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M21 12a8 8 0 01-8 8H7l-4 3 1.2-4.2A8 8 0 1121 12z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M1.7 1.2l13 6.2a.6.6 0 010 1.1l-13 6.2a.6.6 0 01-.83-.72L2.6 8 .87 1.92a.6.6 0 01.83-.72z" />
    </svg>
  );
}

let messageId = 0;
const nextId = () => {
  messageId += 1;
  return `m${messageId}`;
};

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(true);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [messages, setMessages] = useState(() =>
    GREETING.map((text, i) => ({
      id: nextId(),
      role: 'bot',
      text,
      chips: i === GREETING.length - 1 ? QUICK_REPLIES.map((q) => q.label) : [],
    })),
  );

  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const logRef = useRef(null);
  const toggleRef = useRef(null);
  const timers = useRef([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  /* Only ever one timer chain at a time; clears on unmount. */
  const later = (fn, ms) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
    return t;
  };

  const scrollToBottom = useCallback(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open, scrollToBottom]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  /* Escape closes and returns focus to the launcher. */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 220);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  const openPanel = () => {
    setOpen(true);
    setTeaser(false);
  };

  const pushBot = (payload) => {
    setMessages((prev) => [...prev, { id: nextId(), role: 'bot', ...payload }]);
  };

  const goTo = (anchor) => {
    if (!anchor) return;
    const el = document.querySelector(anchor);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setToast('Moved to the section');
    }
  };

  const runChip = (label) => {
    const action = resolveChip(label);

    if (action?.intent) {
      setMessages((prev) => [...prev, { id: nextId(), role: 'user', text: label }]);
      setBusy(true);
      later(() => {
        const reply = resolveReply(label);
        pushBot({ text: reply.answer, chips: reply.chips });
        setBusy(false);
      }, 620);
      return;
    }

    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text: label }]);

    if (action?.copy) {
      navigator.clipboard?.writeText(action.copy).then(
        () => setToast('Email copied'),
        () => setToast('Copy failed — email is in the Contact section'),
      );
      return;
    }

    if (action?.href) {
      window.open(action.href, action.href.startsWith('mailto:') ? '_self' : '_blank', 'noopener');
      return;
    }

    if (action?.anchor) goTo(action.anchor);
  };

  const send = (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text }]);
    setInput('');
    setBusy(true);

    later(() => {
      const reply = resolveReply(text);
      pushBot({ text: reply.answer, chips: reply.chips });
      if (reply.anchor) goTo(reply.anchor);
      setBusy(false);
    }, 700);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const lastBotChips = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.role === 'bot' && m.chips?.length);
    return last ? { id: last.id, chips: last.chips } : null;
  }, [messages]);

  return (
    <>
      {/* launcher */}
      <div className={`as-launcher ${open ? 'is-open' : ''}`}>
        {!open && teaser ? (
          <div className="as-teaser">
            <button type="button" className="as-teaser-close" onClick={() => setTeaser(false)} aria-label="Dismiss greeting">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
                <path d="M2 2l6 6M8 2L2 8" strokeLinecap="round" />
              </svg>
            </button>
            <button type="button" className="as-teaser-text" onClick={openPanel}>
              Questions about the work? Ask here.
            </button>
          </div>
        ) : null}

        <button
          ref={toggleRef}
          type="button"
          className="as-toggle"
          onClick={() => (open ? setOpen(false) : openPanel())}
          aria-expanded={open}
          aria-controls="assistant-panel"
          aria-label={open ? 'Close assistant' : 'Open assistant'}
        >
          {open ? <CloseIcon /> : <ChatIcon />}
        </button>
      </div>

      {/* panel */}
      <div
        id="assistant-panel"
        className={`as-panel ${open ? 'is-open' : ''}`}
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-label="Assistant chat"
        aria-hidden={!open}
        {...(!open ? { inert: '' } : {})}
      >
        <div className="as-head">
          <div className="as-head-id">
            <Avatar size={36} />
            <div className="as-head-text">
              <p className="as-title">Khang&apos;s assistant</p>
              <p className="as-status">
                <span className="as-dot" aria-hidden />
                Online · answers from this page
              </p>
            </div>
          </div>
          <button type="button" className="as-close" onClick={() => setOpen(false)} aria-label="Close assistant">
            <CloseIcon />
          </button>
        </div>

        <div className="as-log" ref={logRef} role="log" aria-live="polite" aria-relevant="additions">
          {messages.map((m) => (
            <div key={m.id} className={`as-row as-row-${m.role}`}>
              {m.role === 'bot' ? <Avatar size={22} /> : null}
              <div className="as-bubble-wrap">
                <div className="as-bubble">{m.text}</div>
                {m.id === lastBotChips?.id && !busy ? (
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
              <Avatar size={22} />
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
            <SendIcon />
          </button>
        </form>

        <p className="as-toast" role="status" aria-live="polite">
          {toast}
        </p>
      </div>
    </>
  );
}
