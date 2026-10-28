import { useEffect, useMemo, useRef, useState } from 'react';

const NAV = [
  { href: '#work', label: 'Work' },
  { href: '#experience', label: 'Experience' },
  { href: '#capabilities', label: 'Capabilities' },
  { href: '#education', label: 'Education' },
  { href: '#contact', label: 'Contact' },
];

const PROFILE = [
  'Build production AI systems — not demo-only prototypes.',
  'Focus: LLM systems, multi-agent runtimes, RAG architecture, workflow orchestration, backend platforms.',
  'Own the full lifecycle: architecture → deployment → optimization → scaling.',
  'Strong research orientation with continuous system improvement.',
];

const STATS = [
  { value: 'V2 → V5.0', label: 'Tasker roadmap owned at bTaskee' },
  { value: '~6×', label: 'Retrieval latency cut (30s → <5s)' },
  { value: 'CER 0.066', label: 'Vietnamese ASR — EraX-WoW-medium' },
  { value: '3', label: 'KAMI agent surfaces shipped' },
];

const SYSTEMS = [
  {
    id: 'kami-pro',
    year: '2026',
    name: 'KAMI AI Agent Pro for Odoo',
    short: 'KAMI Pro',
    tag: 'Odoo 17–19 · Python · Production',
    badge: 'Flagship',
    tone: 'lime',
    hero: '/kami/pro/screenshot_dashboard.png',
    summary:
      'Native Odoo AI work layer. Users describe outcomes in plain language; KAMI discovers apps, models, views, and permissions, then finds, creates, updates, and reviews real records under signed-in ACLs — with Assist, Copilot, Autopilot, approval gates, audit ledger, undo, workflows, and sub-agents.',
    points: [
      'Action Layer + Quick Chat on every backend screen',
      'Governed CRUD with dry-run diffs and mutation budgets',
      'Audit ledger + one-click undo',
      'Multi-provider routing (DeepSeek default + OpenAI, Anthropic, Gemini, …)',
    ],
    stack: ['Odoo 17/18/19', 'Python', 'OWL', 'DeepSeek V4', 'Telegram'],
    link: { href: 'https://apps.odoo.com/apps/modules/19.0/kami_agent', label: 'Odoo Apps Store' },
    videos: [
      {
        src: '/kami/pro/Action-Layer-kami.mp4',
        poster: '/kami/pro/screenshot_quick_chat.png',
        caption: 'Action Layer — ask from any Odoo screen with live record context.',
      },
      {
        src: '/kami/pro/create-update-undo.mp4',
        poster: '/kami/pro/screenshot_chat.png',
        caption: 'Create, update, then undo — field-level diffs and full audit trail.',
      },
    ],
    images: [
      { src: '/kami/pro/screenshot_dashboard.png', alt: 'KAMI Pro dashboard' },
      { src: '/kami/pro/screenshot_chat.png', alt: 'KAMI Pro chat workspace' },
      { src: '/kami/pro/screenshot_quick_chat.png', alt: 'Floating Quick Chat launcher' },
      { src: '/kami/pro/screenshot_approvals.png', alt: 'Approval queue' },
      { src: '/kami/pro/screenshot_audit_log.png', alt: 'Audit ledger' },
      { src: '/kami/pro/screenshot_policies.png', alt: 'Policy configuration' },
      { src: '/kami/pro/screenshot_subagents.png', alt: 'Sub-agents' },
      { src: '/kami/pro/screenshot_workflows.png', alt: 'Reusable workflows' },
      { src: '/kami/pro/screenshot_providers.png', alt: 'Provider catalog' },
      { src: '/kami/pro/screenshot_file_reading.png', alt: 'File import / reading' },
    ],
  },
  {
    id: 'kami-community',
    year: '2026',
    name: 'KAMI AI Agent Community',
    short: 'KAMI Community',
    tag: 'Odoo 19 · Python · Open source',
    badge: 'Open source',
    tone: 'mint',
    hero: '/kami/community/kami-odoo-hero.png',
    summary:
      'Community edition native to Odoo 19: chat with business data, controlled CRUD tools, policy engine, approval dry-runs, immutable audit ledger, and reversible write operations.',
    points: [
      'Visible tool traces in conversation',
      'Policy engine for models, operations, fields, domains',
      'Approval gate with dry-run diffs',
      'DeepSeek V4 flash → pro routing',
    ],
    stack: ['Odoo 19', 'Python', 'OWL', 'DeepSeek V4'],
    link: { href: 'https://github.com/daovinhkhang/kami-odoo-agent', label: 'GitHub' },
    videos: [
      {
        src: '/kami/community/Kami-agent-odoo.mp4',
        poster: '/kami/community/kami-odoo-chat.png',
        caption: 'Community agent triages tasks, creates work, and pauses for approval inside Odoo.',
      },
    ],
    images: [
      { src: '/kami/community/kami-odoo-hero.png', alt: 'KAMI Community product hero' },
      { src: '/kami/community/kami-odoo-chat.png', alt: 'Chat with tool traces and approval card' },
      { src: '/kami/community/kami-odoo-activity.png', alt: 'Activity panel and audit ledger' },
      { src: '/kami/community/kami-odoo-policy.png', alt: 'Per-model policy editor' },
      { src: '/kami/community/kami-odoo-deepseek.png', alt: 'DeepSeek model configuration' },
    ],
  },
  {
    id: 'kami-medusa',
    year: '2026',
    name: 'KAMI for Medusa Commerce',
    short: 'KAMI Medusa',
    tag: 'Medusa 2 · Node.js / TypeScript',
    badge: 'Production',
    tone: 'blue',
    hero: null,
    summary:
      'DeepSeek-powered agent inside Medusa admin — 25+ commerce tools, streaming chat, structured artifacts, approval gates, cron autonomy, vector memory, and multi-channel gateways.',
    points: [
      '25+ Medusa API tools across the store',
      'Resumable SSE with reasoning + execution traces',
      'Cron jobs + embedding memory',
      'Discord / Slack / Telegram gateways',
    ],
    stack: ['Medusa 2.17', 'Node.js', 'TypeScript', 'PostgreSQL', 'Redis'],
    link: { href: 'https://github.com/daovinhkhang/kami-agents', label: 'GitHub' },
    videos: [
      {
        src: '/kami/medusa/kami-agent.mp4',
        caption: 'KAMI querying, drafting, and acting on a live Medusa store.',
      },
    ],
    images: [],
  },
  {
    id: 'tasker',
    year: '2025–Present',
    name: 'Tasker Platform Evolution (V2 → V5.0)',
    short: 'Tasker V2→V5',
    tag: 'bTaskee · Native Runtime · AI Mart',
    badge: 'Production',
    tone: 'beige',
    hero: null,
    summary:
      'End-to-end roadmap Tasker V2 → V5.0: multi-agent RAG (V3), LangGraph runtime (V4), then a native TaskerV5Runtime with PromptPack context, wiki evidence gates, ToolRegistry side effects, AI Mart personalization, and measured canary rollout.',
    points: [
      'V5 native turn loop — cleaner boundaries than graph-state V4',
      'AI Mart scenarios with cohort rollout + kill-switch',
      'Mobile Socket.IO streaming · multilang VN/TH/ID/MY',
      'Retrieval latency ~30s → under 5s on V3–V4 path; V4-vs-V5 eval gates',
    ],
    stack: ['Python', 'FastAPI', 'LangGraph', 'ClickHouse', 'MongoDB', 'Redis', 'Weaviate', 'Langfuse', 'MCP'],
    link: null,
    videos: [],
    images: [],
  },
  {
    id: 'stt',
    year: '2024–2025',
    name: 'Speech-to-Text · Vietnamese Accents',
    short: 'Vietnamese ASR',
    tag: 'EraX / Gtel · Whisper · ASR',
    badge: 'Shipped',
    tone: 'mint',
    hero: null,
    summary:
      'Accent-aware ASR pipeline for Vietnamese: Whisper finetuning, Faster-Whisper, CTranslate2, multi-region data, and production benchmarking.',
    points: [
      'Whisper Medium finetune · ~245k samples · ~870 hours',
      'EraX-WoW-medium CER 0.066 / WER 0.107',
      '~60% WER reduction vs baselines',
      '~30% faster STT with CTranslate2 on RTX 3090',
    ],
    stack: ['Whisper', 'Faster-Whisper', 'CTranslate2', 'Torchaudio', 'Librosa'],
    link: null,
    videos: [],
    images: [],
  },
];

/* flat gallery rail pulled from every system that has screenshots */
const GALLERY = SYSTEMS.flatMap((s) =>
  (s.images || []).map((img) => ({ ...img, system: s.short, tone: s.tone })),
);

function videoType(src = '') {
  if (/\.mov($|\?)/i.test(src)) return 'video/quicktime';
  if (/\.webm($|\?)/i.test(src)) return 'video/webm';
  return 'video/mp4';
}

const EXPERIENCES = [
  {
    id: 'btaskee',
    company: 'bTaskee',
    role: 'AI / Backend Engineer — Tasker Platform (BeeTa)',
    time: 'Oct 2025 – Present',
    bullets: [
      'Owned the Tasker assistant roadmap from V2 through V5.0 for Taskers across VN / TH / ID / MY.',
      'Tasker V3–V4: NodeRAG, ComposeRAG, Meta-Thinker, and LangGraph-native runtime (route, memory, retrieval, execute, verify); cut retrieval latency from ~30s to under 5s (~6×).',
      'Tasker V5.0 native runtime: re-architected the turn loop into explicit services — TaskerV5Runtime, PromptPack context orchestration, country-scoped wiki with score/char gates, ToolRegistry for schedule/escalation side effects, and post-turn memory gateway.',
      'AI Mart personalization (V5 phases 1–6): live ClickHouse propensity signals into risk/growth/behavior slots; deterministic scenario engine with shadow mode, hash-stable cohort rollout, internal allowlist, kill-switch, and render-vs-control telemetry.',
      'Production delivery: mobile Socket.IO streaming for V5, golden-trace / schedule / business-tool E2E evals, and V4-vs-V5 benchmarks to gate canary rollout with V4 as rollback baseline.',
    ],
    stack: ['Python', 'FastAPI', 'LangChain', 'LangGraph', 'MongoDB', 'Redis', 'Weaviate', 'ClickHouse', 'Docker', 'MCP', 'Langfuse'],
  },
  {
    id: 'erax',
    company: 'EraX → Gtel Global Mobile Telecommunications JSC',
    role: 'AI Engineer',
    time: 'Sep 2024 – Jul 2025',
    bullets: [
      'Built LangChain Agent chatbot with Odoo integration and universal workflow engine.',
      'Integrated Redis memory and vector database for semantic retrieval.',
      'Developed 6 TensorFlow Lite mobile AI models (noise reduction, emotion detection, NER).',
      'Led Speech-to-Text for Vietnamese accents: preprocessing, finetuning, benchmarking, Vast.ai training.',
    ],
    stack: ['LangChain', 'Odoo', 'Whisper', 'TensorFlow Lite', 'CTranslate2', 'Redis'],
  },
  {
    id: 'fptis',
    company: 'FPT IS',
    role: 'Intern AI Engineer',
    time: 'Jun 2023 – Sep 2023',
    bullets: [
      'Built chatbot architecture using Flask.',
      'Integrated DialoGPT and spaCy for intent analysis.',
      'Optimized deep learning models for response accuracy and performance.',
    ],
    stack: ['Flask', 'DialoGPT', 'spaCy', 'Python'],
  },
  {
    id: 'greenwich',
    company: 'FPT Greenwich',
    role: 'Teaching Assistant — AI',
    time: 'Feb 2023 – Nov 2024',
    bullets: [
      'Guided students in ML, DL, and AI workshops.',
      'Supported AI projects using Python, TensorFlow, and Colab.',
      'Supported 50+ students; improved performance ~30%.',
    ],
    stack: ['Python', 'TensorFlow', 'Teaching'],
  },
];

const CAPABILITIES = [
  {
    num: '01',
    title: 'AI Systems & LLM',
    tone: 'lime',
    items: ['LLMs · Transformers · LangChain · LangGraph · RAG', 'NodeRAG · ComposeRAG · Meta-Thinker', 'Multi-agent systems · tool calling · memory orchestration'],
  },
  {
    num: '02',
    title: 'Backend & Platform',
    tone: 'mint',
    items: ['Python · FastAPI · Flask · Express', 'MongoDB · PostgreSQL · Redis · Weaviate', 'Docker · MCP · Langfuse'],
  },
  {
    num: '03',
    title: 'ML / ASR / Applied',
    tone: 'beige',
    items: ['TensorFlow · Keras · Scikit-learn · BERT', 'Whisper · Faster-Whisper · Torchaudio · Librosa', 'Benchmarking · regression testing · observability'],
  },
  {
    num: '04',
    title: 'Additional',
    items: ['TypeScript · JavaScript · React Native', 'Firebase · Redux · Axios', 'Scientific writing · English B1 Vstep'],
  },
];

const METHOD = [
  { phase: 'Phase 01', name: 'Discover', detail: 'Map processes and pinpoint where AI agents deliver measurable value.' },
  { phase: 'Phase 02', name: 'Design', detail: 'Define agent workflow, controls, and approval gates matched to operations.' },
  { phase: 'Phase 03', name: 'Deploy', detail: 'Ship into production with monitoring, auditability, and zero-downtime rollout.' },
  { phase: 'Phase 04', name: 'Optimize', detail: 'Tune against real-world data for latency, quality, and scale.' },
];

const TICKER = [
  'Production AI, not demos',
  'LLM agents · RAG · multi-agent runtimes',
  'Ho Chi Minh City · Vietnam',
  'Open to AI / Backend roles',
  'KAMI for Odoo & Medusa',
];

const CREDENTIALS = [
  { k: 'Odoo Apps Store', v: 'Commercial module' },
  { k: 'First Class Honours', v: 'Greenwich University' },
  { k: 'Best Final Project', v: 'Spring 2024' },
  { k: 'SSRN preprint', v: 'Hybrid DL forecasting' },
  { k: 'Certificate of Merit', v: 'RVR' },
];

/* ---------- hooks ---------- */

function useReveal(deps = []) {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('.reveal, .reveal-fade')).filter(
      (n) => !n.classList.contains('is-in'),
    );
    if (!nodes.length) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* ---------- components ---------- */

function Ticker() {
  // Four identical sets: one animation half (two sets) always exceeds wide viewports.
  const row = [...TICKER, ...TICKER, ...TICKER, ...TICKER];
  return (
    <div className="ticker" aria-hidden>
      <div className="ticker-track">
        {row.map((text, i) => (
          <span className="ticker-item" key={`${text}-${i}`}>
            <span className="ticker-star">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
                <path d="M6 0l1.6 4.4L12 6l-4.4 1.6L6 12 4.4 7.6 0 6l4.4-1.6L6 0z" />
              </svg>
            </span>
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

function Header({ navOpen, onToggle, onClose }) {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header className={`site-header ${stuck ? 'is-stuck' : ''}`}>
        <div className="container header-inner">
          <a className="brand" href="#top" onClick={onClose} aria-label="Dao Vinh Khang — back to top">
            <span className="brand-mark" aria-hidden>
              K
            </span>
            <span className="brand-text" aria-hidden>
              <span className="brand-name">Dao Vinh Khang</span>
              <span className="brand-role">AI / Backend Engineer</span>
            </span>
          </a>

          <nav className="site-nav" aria-label="Primary">
            <ul>
              {NAV.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <a className="header-cta" href="#contact">
            Let&apos;s talk
            <span aria-hidden>↗</span>
          </a>

          <button
            type="button"
            className="nav-toggle"
            onClick={onToggle}
            aria-expanded={navOpen}
            aria-controls="mobile-nav"
          >
            {navOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </header>

      <nav id="mobile-nav" className={`mobile-nav ${navOpen ? 'is-open' : ''}`} aria-label="Mobile">
        <ul>
          {NAV.map((item, i) => (
            <li key={item.href}>
              <a href={item.href} onClick={onClose}>
                {item.label}
                <span>{String(i + 1).padStart(2, '0')}</span>
              </a>
            </li>
          ))}
          <li>
            <a href="#contact" onClick={onClose}>
              Let&apos;s talk
              <span>↗</span>
            </a>
          </li>
        </ul>
      </nav>
    </>
  );
}

function SectionHead({ index, title, lead, id }) {
  return (
    <div className="section-head reveal">
      <p className="section-index">{index}</p>
      <h2 className="section-title" id={id}>
        {title}
      </h2>
      {lead ? <p className="section-lead">{lead}</p> : null}
    </div>
  );
}

function Sticker() {
  return (
    <div className="hero-sticker" aria-hidden>
      <svg className="hero-sticker-text" viewBox="0 0 112 112">
        <defs>
          <path id="sticker-path" d="M56,56 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0" />
        </defs>
        <text>
          <textPath href="#sticker-path" startOffset="0%">
            Always building · Always shipping ·
          </textPath>
        </text>
      </svg>
      <span className="hero-sticker-core">
        EST
        <br />
        2026
      </span>
    </div>
  );
}

/* --- image stage: a browser-like frame that makes bright screenshots pop on colour --- */
function Stage({ src, alt, tone = 'blue', caption, headline, overlay = false, priority = false }) {
  return (
    <figure className={`stage stage-${tone} ${overlay ? 'stage-overlay' : ''}`}>
      <div className="stage-bar" aria-hidden>
        <span className="stage-dot" />
        <span className="stage-dot" />
        <span className="stage-dot" />
        <span className="stage-url">kami / {alt}</span>
      </div>
      <div className="stage-frame">
        <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async" />
        {overlay && (headline || caption) ? (
          <figcaption className="stage-cap">
            {headline ? <span className="cap-head">{headline}</span> : null}
            {caption ? <span className="cap-sub">{caption}</span> : null}
          </figcaption>
        ) : null}
      </div>
      {!overlay && caption ? <figcaption className="stage-cap">{caption}</figcaption> : null}
    </figure>
  );
}

function MediaRail({ items, label }) {
  const ref = useRef(null);

  const scrollBy = (dir) => {
    const el = ref.current;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.8, 640);
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  return (
    <div className="rail-block">
      <div className="rail-head">
        <p className="media-label">{label}</p>
        <div className="rail-buttons">
          <button type="button" className="rail-btn" onClick={() => scrollBy(-1)} aria-label="Scroll gallery left">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <path d="M10 2L4 8l6 6" />
            </svg>
          </button>
          <button type="button" className="rail-btn" onClick={() => scrollBy(1)} aria-label="Scroll gallery right">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <path d="M6 2l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
      <div className="rail" ref={ref} tabIndex={0} role="region" aria-label={label}>
        {items.map((img) => (
          <figure className="rail-item" key={img.src}>
            <img src={img.src} alt={img.alt} loading="lazy" decoding="async" />
            <figcaption>
              <span className="rail-tag">{img.system}</span>
              {img.alt}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function SystemTabs({ active, onChange }) {
  const refs = useRef([]);

  const onKeyDown = (e, i) => {
    let next = null;
    if (e.key === 'ArrowRight') next = (i + 1) % SYSTEMS.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + SYSTEMS.length) % SYSTEMS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = SYSTEMS.length - 1;
    if (next === null) return;
    e.preventDefault();
    onChange(SYSTEMS[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div className="tabs" role="tablist" aria-label="Deployed systems">
      {SYSTEMS.map((s, i) => {
        const selected = active === s.id;
        return (
          <button
            key={s.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${s.id}`}
            aria-selected={selected}
            aria-controls={`panel-${s.id}`}
            tabIndex={selected ? 0 : -1}
            className={`tab ${selected ? 'is-active' : ''}`}
            onClick={() => onChange(s.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            <span className="tab-year">{s.year}</span>
            <span className="tab-label">{s.short}</span>
            <span className="tab-badge" data-tone={s.tone || 'lime'}>
              {s.badge}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SystemPanel({ system }) {
  return (
    <div
      className="sys-panel"
      role="tabpanel"
      id={`panel-${system.id}`}
      aria-labelledby={`tab-${system.id}`}
      tabIndex={0}
    >
      <div className="sys-grid">
        <div className="sys-media">
          {system.hero ? (
            <Stage src={system.hero} alt={`${system.short} — ${system.name}`} tone="blue" priority />
          ) : (
            <div className="sys-placeholder">
              <p className="placeholder-kicker">No public screenshots</p>
              <p className="placeholder-name">{system.short}</p>
              <p className="placeholder-note">Internal production system — details on request.</p>
            </div>
          )}
        </div>

        <div className="sys-copy">
          <p className="sys-tag">{system.tag}</p>
          <h3 className="sys-name">{system.name}</h3>
          <p className="sys-summary">{system.summary}</p>

          <ul className="point-list">
            {system.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>

          <div className="tags">
            {system.stack.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>

          {system.link ? (
            <a className="project-link" href={system.link.href} target="_blank" rel="noreferrer">
              {system.link.label}
              <span aria-hidden>↗</span>
            </a>
          ) : null}
        </div>
      </div>

      {!!system.videos?.length && (
        <div className="media-block">
          <p className="media-label">Demo</p>
          <div className="video-stack">
            {system.videos.map((video) => (
              <figure key={video.src} className="video-card">
                <video className="project-video" controls playsInline preload="metadata" poster={video.poster || undefined}>
                  <source src={video.src} type={videoType(video.src)} />
                </video>
                {video.caption ? <figcaption>{video.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
        </div>
      )}

      {!!system.images?.length && (
        <div className="media-block">
          <p className="media-label">Screenshots</p>
          <div className="shot-grid">
            {system.images.slice(0, 6).map((image) => (
              <figure key={image.src} className="shot-card">
                <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
                <figcaption>{image.alt}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExpRow({ job, isOpen, onToggle }) {
  return (
    <div className={`exp-item ${isOpen ? 'is-open' : ''}`}>
      <button type="button" className="exp-trigger" onClick={onToggle} aria-expanded={isOpen}>
        <span className="exp-title-block">
          <span className="exp-company">{job.company}</span>
          <span className="exp-meta">
            {job.role} · {job.time}
          </span>
        </span>
        <span className="exp-icon" aria-hidden>
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M1 1l5 5 5-5" />
          </svg>
        </span>
      </button>

      <div className="exp-panel" aria-hidden={!isOpen} {...(!isOpen ? { inert: '' } : {})}>
        <div className="exp-panel-inner">
          <div className="exp-body">
            <ul className="point-list">
              {job.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <div className="tags">
              {job.stack.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const year = useMemo(() => new Date().getFullYear(), []);
  const [navOpen, setNavOpen] = useState(false);
  const [activeSystem, setActiveSystem] = useState(SYSTEMS[0].id);
  const [openExp, setOpenExp] = useState('btaskee');

  useReveal([activeSystem]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = navOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [navOpen]);

  const active = SYSTEMS.find((s) => s.id === activeSystem) || SYSTEMS[0];
  const toggleExp = (id) => setOpenExp((prev) => (prev === id ? null : id));

  return (
    <div id="top">
      <a href="#work" className="sr-only">
        Skip to work
      </a>

      <Ticker />
      <Header navOpen={navOpen} onToggle={() => setNavOpen((v) => !v)} onClose={() => setNavOpen(false)} />

      <main>
        {/* ================= HERO — image led ================= */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="container hero-inner">
            <div className="hero-split">
              <div className="hero-col">
            <div className="hero-head">
              <div className="hero-top reveal">
                <span className="hero-badge">
                  <span className="status-dot" aria-hidden />
                  Available for production AI work
                </span>
                <span className="eyebrow">Ho Chi Minh City · Vietnam</span>
              </div>
              <Sticker />
            </div>

            <h1 className="hero-title" id="hero-title">
              <span className="line reveal" style={{ '--d': '40ms' }}>
                <span>Dao Vinh</span>
              </span>
              <span className="line reveal" style={{ '--d': '140ms' }}>
                <span>
                  Khang<em>.</em>
                </span>
              </span>
            </h1>

            <div className="hero-lede reveal" style={{ '--d': '220ms' }}>
              <p className="hero-sub">
                I design and ship <strong>production AI agents and backends</strong> — governed, observable systems
                that run inside real business platforms. From RAG runtimes to ERP and commerce agents.
              </p>
              <div className="hero-actions">
                <a className="btn btn-primary" href="#work">
                  View deployed systems
                  <span className="btn-arrow" aria-hidden>
                    →
                  </span>
                </a>
                <a className="btn btn-outline" href="#contact">
                  Get in touch
                </a>
              </div>
            </div>
              </div>

              {/* the stage: bright product UI on a saturated field */}
              <div className="hero-stage reveal" style={{ '--d': '300ms' }}>
                <Stage
                  src="/kami/pro/screenshot_chat.png"
                  alt="KAMI Pro chat workspace with governed tool traces"
                  tone="blue"
                  overlay
                  headline="Every write reviewable."
                  caption="KAMI Pro — approval gates, dry-run diffs and a one-click undo on top of Odoo 19"
                  priority
                />
              </div>
            </div>

            <dl className="hero-meta reveal" style={{ '--d': '360ms' }}>
              <div className="hero-meta-row">
                <dt>Email</dt>
                <dd>
                  <a href="mailto:daovinhkhang0834@gmail.com">daovinhkhang0834@gmail.com</a>
                </dd>
              </div>
              <div className="hero-meta-row">
                <dt>Phone</dt>
                <dd>
                  <a href="tel:+84834684568">+84 834 684 568</a>
                </dd>
              </div>
              <div className="hero-meta-row">
                <dt>LinkedIn</dt>
                <dd>
                  <a href="https://www.linkedin.com/in/dao-vinh-khang-32748023a/" target="_blank" rel="noreferrer">
                    dao-vinh-khang
                  </a>
                </dd>
              </div>
              <div className="hero-meta-row">
                <dt>GitHub</dt>
                <dd>
                  <a href="https://github.com/daovinhkhang" target="_blank" rel="noreferrer">
                    @daovinhkhang
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* ================= STAT STRIP (VNM awards strip) ================= */}
        <section className="stats" aria-label="Selected metrics">
          <div className="container">
            <div className="stats-grid">
              {STATS.map((s) => (
                <div className="stat" key={s.label}>
                  <p className="stat-value">{s.value}</p>
                  <p className="stat-label">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= 01 PROFILE — split panel ================= */}
        <section id="about" className="section" aria-labelledby="about-title">
          <div className="container">
            <SectionHead
              index="01 — Profile"
              id="about-title"
              title={
                <>
                  Engineer who ships, <em>not just prototypes.</em>
                </>
              }
              lead="What I optimize for in every system I put into production."
            />

            <div className="split reveal">
              <div className="split-media">
                <Stage
                  src="/kami/pro/screenshot_approvals.png"
                  alt="Human approval queue gating an agent write"
                  tone="lime"
                  caption="Approval queue — a human gates every irreversible action"
                />
              </div>
              <div className="split-copy">
                <ul className="profile-lines">
                  {PROFILE.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <div className="aside-tags">
                  {['Evals', 'Canary rollout', 'Observability', 'Cost control'].map((t) => (
                    <span className="system-badge" data-tone="beige" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 02 WORK — tabs + stage + rail ================= */}
        <section id="work" className="section section-alt" aria-labelledby="work-title">
          <div className="container">
            <SectionHead
              index="02 — Deployed systems"
              id="work-title"
              title={
                <>
                  Shipped. Auditable. <em>In production.</em>
                </>
              }
              lead="Flagship KAMI AI agents for commerce and ERP, plus production systems from professional work."
            />

            <div className="reveal">
              <SystemTabs active={activeSystem} onChange={setActiveSystem} />
              <SystemPanel key={active.id} system={active} />
            </div>

            <MediaRail items={GALLERY} label="Gallery — every shipped surface" />

            <p className="work-foot reveal">
              KAMI product work ·{' '}
              <a href="https://github.com/daovinhkhang" target="_blank" rel="noreferrer">
                github.com/daovinhkhang
              </a>
            </p>
          </div>
        </section>

        {/* ================= GIANT TYPE MOMENT (VNM "Mới!") ================= */}
        <section className="giant" aria-label="Statement">
          <div className="container giant-inner">
            <p className="giant-line reveal">
              Ship<span className="giant-dot">.</span>
            </p>
            <p className="giant-sub reveal" style={{ '--d': '80ms' }}>
              Architecture → deploy → optimize → scale. Every system measured, every write reversible.
            </p>
          </div>
        </section>

        {/* ================= 03 EXPERIENCE ================= */}
        <section id="experience" className="section" aria-labelledby="exp-title">
          <div className="container">
            <SectionHead
              index="03 — Experience"
              id="exp-title"
              title={
                <>
                  Professional <em>trace.</em>
                </>
              }
              lead="Roles where production delivery mattered more than slides."
            />
            <div className="exp-list reveal">
              {EXPERIENCES.map((job) => (
                <ExpRow key={job.id} job={job} isOpen={openExp === job.id} onToggle={() => toggleExp(job.id)} />
              ))}
            </div>
          </div>
        </section>

        {/* ================= 04 CAPABILITIES ================= */}
        <section id="capabilities" className="section section-alt" aria-labelledby="cap-title">
          <div className="container">
            <SectionHead
              index="04 — Capabilities"
              id="cap-title"
              title={
                <>
                  The stack <em>I build on.</em>
                </>
              }
              lead="Systems skills grouped for clarity — not a keyword dump."
            />

            <div className="cap-grid">
              {CAPABILITIES.map((cap, i) => (
                <article key={cap.num} className="cap-card reveal" data-tone={cap.tone} style={{ '--d': `${i * 70}ms` }}>
                  <p className="cap-num">[ {cap.num} ]</p>
                  <h3>{cap.title}</h3>
                  <ul>
                    {cap.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <div className="method">
              <p className="eyebrow">Implementation</p>
              <div className="method-grid">
                {METHOD.map((step) => (
                  <article key={step.phase} className="method-card">
                    <p className="method-phase">{step.phase}</p>
                    <h4>{step.name}</h4>
                    <p>{step.detail}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================= 05 EDUCATION + credentials strip ================= */}
        <section id="education" className="section" aria-labelledby="edu-title">
          <div className="container">
            <SectionHead index="05 — Education" id="edu-title" title={<>Credentials.</>} />

            <div className="edu-grid">
              <article className="edu-card reveal">
                <p className="cap-num">Degree</p>
                <h3>Greenwich University</h3>
                <p className="edu-line">BSc (Hons) in Computing · 2020 – 2024</p>
                <p className="edu-line">First Class Honours · GPA 3.7 / 4.0</p>
                <ul className="plain-list">
                  <li>Certificate of Merit (RVR)</li>
                  <li>Best Final Project (Spring 2024)</li>
                </ul>
              </article>
              <article className="edu-card reveal" style={{ '--d': '90ms' }}>
                <p className="cap-num">Commitment</p>
                <h3>How I ship</h3>
                <ul className="plain-list">
                  <li>Production systems over demos</li>
                  <li>Governed agents with auditability</li>
                  <li>Latency, retrieval, and observability at scale</li>
                  <li>Architecture → deploy → optimize → scale</li>
                </ul>
              </article>
            </div>

            <div className="cred-strip reveal">
              {CREDENTIALS.map((c) => (
                <div className="cred" key={c.k}>
                  <p className="cred-k">{c.k}</p>
                  <p className="cred-v">{c.v}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= 06 CONTACT ================= */}
        <section id="contact" className="section contact" aria-labelledby="contact-title">
          <div className="container">
            <SectionHead
              index="06 — Contact"
              id="contact-title"
              title={
                <>
                  Let&apos;s <em>build.</em>
                </>
              }
              lead="Open to production AI / backend collaborations and serious product work."
            />
            <div className="contact-grid">
              <a className="contact-item reveal" href="mailto:daovinhkhang0834@gmail.com">
                <span className="contact-label">Email</span>
                <span className="contact-value">daovinhkhang0834@gmail.com</span>
              </a>
              <a className="contact-item reveal" href="tel:+84834684568" style={{ '--d': '50ms' }}>
                <span className="contact-label">Phone</span>
                <span className="contact-value">+84 834 684 568</span>
              </a>
              <a
                className="contact-item reveal"
                href="https://www.linkedin.com/in/dao-vinh-khang-32748023a/"
                target="_blank"
                rel="noreferrer"
                style={{ '--d': '100ms' }}
              >
                <span className="contact-label">LinkedIn</span>
                <span className="contact-value">Dao Vinh Khang ↗</span>
              </a>
              <a
                className="contact-item reveal"
                href="https://github.com/daovinhkhang"
                target="_blank"
                rel="noreferrer"
                style={{ '--d': '150ms' }}
              >
                <span className="contact-label">GitHub</span>
                <span className="contact-value">@daovinhkhang ↗</span>
              </a>
              <a
                className="contact-item reveal"
                href="https://apps.odoo.com/apps/modules/19.0/kami_agent"
                target="_blank"
                rel="noreferrer"
                style={{ '--d': '200ms' }}
              >
                <span className="contact-label">KAMI Pro</span>
                <span className="contact-value">Odoo Apps Store ↗</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-top">
            <p className="footer-cta">
              Automate the complex.
              <br />
              Ship <em>production AI.</em>
            </p>
            <a className="btn btn-accent" href="mailto:daovinhkhang0834@gmail.com">
              Start a conversation
              <span aria-hidden>→</span>
            </a>
          </div>
          <div className="footer-bottom">
            <span>© {year} Dao Vinh Khang · KAMI AI · k-lab</span>
            <span>Architecting production AI.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
