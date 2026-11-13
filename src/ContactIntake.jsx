import { useEffect, useMemo, useRef, useState } from 'react';
import { PROFILE } from './content';
import { openLinkWindow } from './openLink';

export const CONTACT_TOPICS = [
  {
    id: 'hiring',
    label: 'Hiring / AI Role',
    short: 'Hiring',
    briefHint: 'Include team mission, seniority/role scope, primary AI/backend stack, and target timeline.',
    sample:
      'Hi Khang, we are hiring for an AI / Backend Engineer working on production LLM agents and retrieval systems. Our team stack is Python/FastAPI with PostgreSQL & Redis — would love to discuss fit and timeline.',
  },
  {
    id: 'project',
    label: 'AI Product / Build',
    short: 'Product Build',
    briefHint: 'Outline the workflow to automate, current platform (Odoo, Medusa, Python/Node), and target launch.',
    sample:
      'Hi Khang, we want to build a governed AI copilot for our internal operations workflow. Key priorities are ACL-safe tool execution, low retrieval latency, and human approval gates.',
  },
  {
    id: 'consulting',
    label: 'Architecture Advisory',
    short: 'Advisory',
    briefHint: 'Describe the bottleneck to audit (RAG latency, agent hallucinations, evals, or compaction).',
    sample:
      'Hi Khang, we need an architecture review of our multi-agent RAG pipeline — specifically cutting response latency and adding deterministic evidence gates before tool calls.',
  },
  {
    id: 'other',
    label: 'Collaboration / Other',
    short: 'General',
    briefHint: 'Share what you have in mind — open-source KAMI, SSRN #5023739, speaking, or a quick intro.',
    sample:
      'Hi Khang, reaching out after reviewing your KAMI agent architecture and SSRN research preprint — would love to connect and explore collaboration.',
  },
];

const FIELD_GUIDES = {
  topic: {
    pill: 'Topic',
    label: '1. Topic',
    text: 'Choose 1 of 4 options (Hiring / AI Role, AI Product / Build, Architecture Advisory, or Collaboration / Other) so Khang immediately knows your goal.',
  },
  name: {
    pill: 'Name *',
    label: '2. Name (Required)',
    text: 'Required (2+ chars): enter your name or preferred way for Khang to address you in his reply.',
  },
  email: {
    pill: 'Email *',
    label: '3. Email (Required)',
    text: 'Required: enter your work or direct email so Khang can send replies, notes, or calendar invites.',
  },
  company: {
    pill: 'Company',
    label: '4. Company / Stack (Optional)',
    text: 'Optional: share your organization, product, or current stack (e.g. Odoo, FastAPI, RAG) for faster context.',
  },
  message: {
    pill: 'Brief *',
    label: '5. Brief & Timeline (Required)',
    text: 'Required (10+ chars): write 2–4 lines covering your goal, current stack, and timing — or use Fill template / Draft with AI.',
  },
  submit: {
    pill: 'Send',
    label: '6. Review & Send Inquiry',
    text: 'Human-gated: AI never auto-submits. Click Send inquiry when ready — it forwards to Gmail with a KHG-... receipt ID.',
  },
};

const COACH_STEP_ORDER = ['topic', 'name', 'email', 'company', 'message', 'submit'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const INITIAL_VALUES = {
  name: '',
  email: '',
  topic: 'project',
  company: '',
  message: '',
  botField: '',
};

function formatChannelLabel(channels = []) {
  if (channels.includes('gmail')) return 'Sent directly to daovinhkhang0834@gmail.com via Gmail.';
  if (channels.includes('webhook') || channels.includes('telegram')) return 'Delivered via live notification webhook';
  if (channels.includes('netlify-forms')) return 'Synced via Netlify Forms & function intake';
  if (channels.includes('netlify-function-log')) return 'Logged by Netlify intake service';
  return 'Confirmed in preview mode — use Open Email App below to send straight from your mail client';
}

function buildMailtoHref(summary, id) {
  const to = PROFILE.email || 'daovinhkhang0834@gmail.com';
  const subject = `[${summary.topicLabel}] Inquiry from ${summary.name} (${id})`;
  const body = [
    `Reference: ${id}`,
    `From: ${summary.name} <${summary.email}>`,
    summary.company ? `Company / Team: ${summary.company}` : null,
    `Topic: ${summary.topicLabel}`,
    '',
    summary.message,
  ]
    .filter((line) => line !== null)
    .join('\n');
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

async function syncNetlifyFormIfHosted(values) {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return false;
  try {
    const body = new URLSearchParams({
      'form-name': 'contact',
      'bot-field': values.botField || '',
      name: values.name,
      email: values.email,
      topic: values.topic,
      company: values.company || '',
      message: values.message,
    }).toString();
    const res = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Interactive contact intake paired with two-way AI concierge guidance:
 * Khang AI can spotlight fields, pre-draft from chat context, and stay beside
 * the visitor right through post-submission confirmation.
 */
export default function ContactIntake() {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [activeField, setActiveField] = useState('topic');
  const [aiField, setAiField] = useState('');
  const [aiNote, setAiNote] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [status, setStatus] = useState('idle');
  const [receipt, setReceipt] = useState(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const highlightTimer = useRef(0);
  const topicMeta = useMemo(
    () => CONTACT_TOPICS.find((t) => t.id === values.topic) || CONTACT_TOPICS[1],
    [values.topic],
  );

  useEffect(() => () => clearTimeout(highlightTimer.current), []);

  // Listen for AI cursor fills / spotlights dispatched by `director.js`.
  useEffect(() => {
    const onAiFill = (e) => {
      const detail = e?.detail || {};
      const fields = detail.fields || {};
      const focus = detail.focus || '';
      const note = detail.note || '';

      setValues((prev) => ({
        ...prev,
        ...(typeof fields.name === 'string' ? { name: fields.name } : {}),
        ...(typeof fields.email === 'string' ? { email: fields.email } : {}),
        ...(typeof fields.topic === 'string' ? { topic: fields.topic } : {}),
        ...(typeof fields.company === 'string' ? { company: fields.company } : {}),
        ...(typeof fields.message === 'string' ? { message: fields.message } : {}),
      }));

      setFieldErrors({});
      setServerError('');
      if (Object.keys(fields).length) {
        setStatus((curr) => (curr === 'submitted' ? 'idle' : curr));
      }
      if (focus) setActiveField(focus);
      if (focus) setAiField(focus);
      if (note) setAiNote(note);

      clearTimeout(highlightTimer.current);
      highlightTimer.current = setTimeout(() => setAiField(''), 3400);
    };

    window.addEventListener('ai:contact-fill', onAiFill);
    return () => window.removeEventListener('ai:contact-fill', onAiFill);
  }, []);

  const updateField = (key, nextVal) => {
    setValues((prev) => ({ ...prev, [key]: nextVal }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    setServerError('');
  };

  const selectCoachStep = (stepKey) => {
    const guide = FIELD_GUIDES[stepKey] || FIELD_GUIDES.topic;
    setActiveField(stepKey);
    setAiNote(stepKey === 'message' ? topicMeta.briefHint : guide.text);
    setAiField(stepKey);
    clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setAiField(''), 3400);
    window.dispatchEvent(
      new CustomEvent('ai:cursor-point-field', {
        detail: {
          field: stepKey,
          note: stepKey === 'message' ? topicMeta.briefHint : guide.text,
        },
      }),
    );
  };

  const askAiAssist = (mode = 'guide') => {
    window.dispatchEvent(
      new CustomEvent('ai:contact-assist', {
        detail: {
          mode,
          topic: values.topic,
          focus: activeField,
          values: {
            hasName: Boolean(values.name.trim()),
            hasEmail: Boolean(values.email.trim()),
            hasCompany: Boolean(values.company.trim()),
            messageLen: values.message.trim().length,
            topic: values.topic,
          },
        },
      }),
    );
  };

  const validateClient = () => {
    const errs = {};
    if (values.name.trim().length < 2) errs.name = 'Please enter at least 2 characters.';
    if (!EMAIL_RE.test(values.email.trim())) errs.email = 'Please enter a valid email address.';
    if (values.message.trim().length < 10) errs.message = 'Please write a short brief (at least 10 characters).';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'submitting') return;

    const errs = validateClient();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      const firstErr = errs.name ? 'name' : errs.email ? 'email' : 'message';
      setActiveField(firstErr);
      document
        .getElementById(firstErr === 'email' ? 'contact-email-input' : `contact-${firstErr}`)
        ?.focus();
      return;
    }

    setStatus('submitting');
    setServerError('');

    const netlifySynced = await syncNetlifyFormIfHosted(values);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...values, netlifySynced }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        if (data?.fields) setFieldErrors(data.fields);
        setServerError('Could not validate or submit right now — you can review above or use direct Email.');
        setStatus('error');
        return;
      }

      setReceipt(data);
      setStatus('submitted');
      setAiNote('');
      window.dispatchEvent(new CustomEvent('ai:contact-submitted', { detail: data }));
    } catch {
      setServerError('Connection interrupted — please retry or use Email directly.');
      setStatus('error');
    }
  };

  const copySummary = async () => {
    if (!receipt) return;
    const text = [
      `Reference: ${receipt.id}`,
      `From: ${receipt.summary.name} (${receipt.summary.email})`,
      receipt.summary.company ? `Company: ${receipt.summary.company}` : null,
      `Topic: ${receipt.summary.topicLabel}`,
      '',
      receipt.summary.message,
    ]
      .filter((x) => x !== null)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2200);
    } catch {
      setCopiedSummary(false);
    }
  };

  const resetForm = () => {
    setReceipt(null);
    setStatus('idle');
    setValues((prev) => ({ ...INITIAL_VALUES, topic: prev.topic }));
    setFieldErrors({});
    setServerError('');
    setAiNote('');
    setActiveField('topic');
  };

  const activeGuide = FIELD_GUIDES[activeField] || FIELD_GUIDES.topic;
  const completedCount = [
    values.name.trim().length >= 2,
    EMAIL_RE.test(values.email.trim()),
    values.message.trim().length >= 10,
  ].filter(Boolean).length;

  if (status === 'submitted' && receipt) {
    const mailtoHref = buildMailtoHref(receipt.summary, receipt.id);
    return (
      <div
        id="contact-form"
        className="contact-card contact-receipt reveal is-in"
        data-topic={receipt.summary.topic}
        data-submitted="true"
      >
        <div className="contact-card-head">
          <div>
            <p className="contact-kicker">Inquiry Logged · {receipt.id}</p>
            <h3 className="contact-card-title">Ready for Dao Vinh Khang</h3>
          </div>
          <span className="contact-status-pill is-done">Step 3 / 3 · Complete</span>
        </div>

        <p className="contact-receipt-note">{formatChannelLabel(receipt.deliveredVia)}</p>

        <dl className="contact-receipt-summary">
          <div>
            <dt>From</dt>
            <dd>
              {receipt.summary.name} · {receipt.summary.email}
            </dd>
          </div>
          <div>
            <dt>Topic</dt>
            <dd>{receipt.summary.topicLabel}</dd>
          </div>
          {receipt.summary.company ? (
            <div>
              <dt>Company / Team</dt>
              <dd>{receipt.summary.company}</dd>
            </div>
          ) : null}
          <div>
            <dt>Brief</dt>
            <dd>{receipt.summary.message}</dd>
          </div>
        </dl>

        <div className="contact-receipt-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openLinkWindow(mailtoHref)}
          >
            Open Email App to Send Copy ↗
          </button>
          <button type="button" className="btn btn-secondary" onClick={copySummary}>
            {copiedSummary ? 'Copied Summary' : 'Copy Summary'}
          </button>
          <button type="button" className="contact-reset-btn" onClick={resetForm}>
            Write another brief
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      id="contact-form"
      name="contact"
      className="contact-card reveal"
      onSubmit={handleSubmit}
      noValidate
      data-topic={values.topic}
      data-submitted="false"
    >
      <input
        type="text"
        name="bot-field"
        value={values.botField}
        onChange={(e) => updateField('botField', e.target.value)}
        className="sr-only"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className="contact-card-head">
        <div>
          <p className="contact-kicker">Guided Intake · {completedCount}/3 Required</p>
          <h3 className="contact-card-title">Send a scoped inquiry</h3>
        </div>
        <button
          type="button"
          className="contact-ai-trigger"
          onClick={() => askAiAssist('guide')}
        >
          <span className="as-live" aria-hidden="true" />
          <span>AI hỗ trợ điền &amp; giải thích</span>
        </button>
      </div>

      <div className="contact-ai-coach" role="region" aria-live="polite" aria-label="AI form guidance">
        <div className="contact-coach-copy">
          <span className="contact-coach-tag">AI Coach · {activeGuide.label}</span>
          <p className="contact-coach-text">
            {aiNote || (activeField === 'message' ? topicMeta.briefHint : activeGuide.text)}
          </p>
        </div>
        <div className="contact-coach-actions">
          <button
            type="button"
            className="contact-coach-btn"
            onClick={() => updateField('message', topicMeta.sample)}
          >
            Fill template
          </button>
          <button
            type="button"
            className="contact-coach-btn is-primary"
            onClick={() => askAiAssist('draft')}
          >
            Draft with AI
          </button>
        </div>
        <div className="contact-coach-steps" role="group" aria-label="Walk through every form section">
          {COACH_STEP_ORDER.map((stepKey) => {
            const meta = FIELD_GUIDES[stepKey];
            const active = activeField === stepKey;
            return (
              <button
                key={stepKey}
                type="button"
                className={`contact-coach-step${active ? ' is-active' : ''}`}
                aria-pressed={active}
                onClick={() => selectCoachStep(stepKey)}
              >
                {meta.pill}
              </button>
            );
          })}
          <button
            type="button"
            className="contact-coach-step"
            onClick={() => window.dispatchEvent(new CustomEvent('ai:cursor-walk-all'))}
          >
            ▶ Walk all 6
          </button>
        </div>
      </div>

      <div
        id="contact-topic"
        className={`contact-field${aiField === 'topic' ? ' is-ai-focused' : ''}`}
      >
        <span className="contact-field-label">Topic</span>
        <div className="contact-topic-pills" role="radiogroup" aria-label="Inquiry topic">
          {CONTACT_TOPICS.map((item) => {
            const active = values.topic === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={active}
                className={`contact-topic-pill${active ? ' is-active' : ''}`}
                onFocus={() => setActiveField('topic')}
                onClick={() => {
                  updateField('topic', item.id);
                  setActiveField('topic');
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="contact-field-row">
        <div className={`contact-field${aiField === 'name' ? ' is-ai-focused' : ''}`}>
          <label htmlFor="contact-name" className="contact-field-label">
            Name <span aria-hidden="true">*</span>
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            value={values.name}
            onFocus={() => setActiveField('name')}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Minh Nguyen"
            autoComplete="name"
            aria-invalid={Boolean(fieldErrors.name)}
          />
          {fieldErrors.name ? <span className="contact-field-err">{fieldErrors.name}</span> : null}
        </div>

        <div className={`contact-field${aiField === 'email' ? ' is-ai-focused' : ''}`}>
          <label htmlFor="contact-email-input" className="contact-field-label">
            Email <span aria-hidden="true">*</span>
          </label>
          <input
            id="contact-email-input"
            name="email"
            type="email"
            value={values.email}
            onFocus={() => setActiveField('email')}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="minh@company.com"
            autoComplete="email"
            aria-invalid={Boolean(fieldErrors.email)}
          />
          {fieldErrors.email ? <span className="contact-field-err">{fieldErrors.email}</span> : null}
        </div>
      </div>

      <div className={`contact-field${aiField === 'company' ? ' is-ai-focused' : ''}`}>
        <label htmlFor="contact-company" className="contact-field-label">
          Company / Stack Context
        </label>
        <input
          id="contact-company"
          name="company"
          type="text"
          value={values.company}
          onFocus={() => setActiveField('company')}
          onChange={(e) => updateField('company', e.target.value)}
          placeholder="Optional — e.g. Acme AI · Odoo 19 / FastAPI"
          autoComplete="organization"
        />
      </div>

      <div className={`contact-field${aiField === 'message' ? ' is-ai-focused' : ''}`}>
        <div className="contact-field-head">
          <label htmlFor="contact-message" className="contact-field-label">
            Brief <span aria-hidden="true">*</span>
          </label>
          <span className="contact-field-meta">{values.message.trim().length} / 3000 chars</span>
        </div>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          value={values.message}
          onFocus={() => setActiveField('message')}
          onChange={(e) => updateField('message', e.target.value)}
          placeholder={topicMeta.briefHint}
          aria-invalid={Boolean(fieldErrors.message)}
        />
        {fieldErrors.message ? <span className="contact-field-err">{fieldErrors.message}</span> : null}
      </div>

      {serverError ? (
        <div className="contact-server-err" role="alert">
          <span>{serverError} </span>
          <button
            type="button"
            className="contact-reset-btn"
            onClick={() => openLinkWindow(buildMailtoHref({ ...values, topicLabel: topicMeta.label }, 'DRAFT'))}
          >
            Open Email App ↗
          </button>
        </div>
      ) : null}

      <div className="contact-form-foot">
        <p className="contact-foot-note">
          Human-gated: AI can explain or pre-draft, but only your click sends.
        </p>
        <button
          id="contact-submit"
          type="submit"
          className={`contact-submit-btn${aiField === 'submit' ? ' is-ai-focused' : ''}`}
          disabled={status === 'submitting'}
          onFocus={() => setActiveField('submit')}
        >
          {status === 'submitting' ? 'Sending…' : 'Send inquiry →'}
        </button>
      </div>
    </form>
  );
}
