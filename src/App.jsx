import { useEffect, useMemo, useState } from 'react';

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

const SYSTEMS = [
  {
    id: 'kami-pro',
    year: '2026',
    name: 'KAMI AI Agent Pro for Odoo',
    tag: 'Odoo 17–19 · Python · Production',
    badge: 'FLAGSHIP',
    summary:
      'Native Odoo AI work layer. Users describe outcomes in plain language; KAMI discovers apps, models, views, and permissions, then finds, creates, updates, and reviews real records under signed-in ACLs — with Assist, Copilot, Autopilot, approval gates, audit ledger, undo, workflows, and sub-agents.',
    points: [
      'Action Layer + Quick Chat on every backend screen',
      'Governed CRUD with dry-run diffs and mutation budgets',
      'Audit ledger + one-click undo',
      'Multi-provider routing (DeepSeek default + OpenAI, Anthropic, Gemini, …)',
    ],
    stack: ['Odoo 17/18/19', 'Python', 'OWL', 'DeepSeek V4', 'Telegram'],
    link: { href: 'https://apps.odoo.com/apps/modules/19.0/kami_agent', label: 'Odoo Apps Store ↗' },
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
    tag: 'Odoo 19 · Python · Open source',
    badge: 'OPEN SOURCE',
    summary:
      'Community edition native to Odoo 19: chat with business data, controlled CRUD tools, policy engine, approval dry-runs, immutable audit ledger, and reversible write operations.',
    points: [
      'Visible tool traces in conversation',
      'Policy engine for models, operations, fields, domains',
      'Approval gate with dry-run diffs',
      'DeepSeek V4 flash → pro routing',
    ],
    stack: ['Odoo 19', 'Python', 'OWL', 'DeepSeek V4'],
    link: { href: 'https://github.com/daovinhkhang/kami-odoo-agent', label: 'GitHub ↗' },
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
    tag: 'Medusa 2 · Node.js / TypeScript',
    badge: 'PRODUCTION',
    summary:
      'DeepSeek-powered agent inside Medusa admin — 25+ commerce tools, streaming chat, structured artifacts, approval gates, cron autonomy, vector memory, and multi-channel gateways.',
    points: [
      '25+ Medusa API tools across the store',
      'Resumable SSE with reasoning + execution traces',
      'Cron jobs + embedding memory',
      'Discord / Slack / Telegram gateways',
    ],
    stack: ['Medusa 2.17', 'Node.js', 'TypeScript', 'PostgreSQL', 'Redis'],
    link: { href: 'https://github.com/daovinhkhang/kami-agents', label: 'GitHub ↗' },
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
    name: 'Tasker Platform Evolution',
    tag: 'bTaskee · LangGraph · RAG Runtime',
    badge: 'PRODUCTION',
    summary:
      'End-to-end roadmap Tasker V2 → V4: NodeRAG, ComposeRAG, Meta-Thinker, LangGraph-native runtime, attachment intelligence, and retrieval optimization with full observability.',
    points: [
      'Modular nodes: routing, memory, retrieval, execution, verification',
      '3-layer attachment intelligence + tracing',
      'Retrieval latency ~30s → under 5s (~6×)',
      'Country-level isolation, benchmarks, regression testing',
    ],
    stack: ['Python', 'FastAPI', 'LangGraph', 'MongoDB', 'Redis', 'Weaviate', 'Langfuse'],
    link: null,
    videos: [],
    images: [],
  },
  {
    id: 'stt',
    year: '2024–2025',
    name: 'Speech-to-Text · Vietnamese Accents',
    tag: 'EraX / Gtel · Whisper · ASR',
    badge: 'SHIPPED',
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

function videoType(src = '') {
  if (/\.mov($|\?)/i.test(src)) return 'video/quicktime';
  if (/\.webm($|\?)/i.test(src)) return 'video/webm';
  return 'video/mp4';
}

const EXPERIENCES = [
  {
    id: 'btaskee',
    company: 'bTaskee',
    role: 'AI / Backend Engineer — Tasker Platform',
    time: 'Oct 2025 – Present',
    bullets: [
      'Owned end-to-end roadmap for Tasker V2 to V4, from architecture design to production scaling.',
      'Built Tasker V3 with NodeRAG, ComposeRAG, Meta-Thinker, graph-based retrieval, and multi-turn reasoning.',
      'Re-architected Tasker V4 into a LangGraph-native runtime with modular nodes for routing, memory, retrieval, execution, and verification.',
      'Designed 3-layer attachment intelligence with observability tracing.',
      'Reduced retrieval latency from ~30s to under 5s (~6× faster).',
    ],
    stack: ['Python', 'FastAPI', 'LangChain', 'LangGraph', 'MongoDB', 'Redis', 'Weaviate', 'Docker', 'MCP', 'Langfuse'],
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
    items: ['LLMs · Transformers · LangChain · LangGraph · RAG', 'NodeRAG · ComposeRAG · Meta-Thinker', 'Multi-agent systems · tool calling · memory orchestration'],
  },
  {
    num: '02',
    title: 'Backend & Platform',
    items: ['Python · FastAPI · Flask · Express', 'MongoDB · PostgreSQL · Redis · Weaviate', 'Docker · MCP · Langfuse'],
  },
  {
    num: '03',
    title: 'ML / ASR / Applied',
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

function SectionHeader({ number, title, lead }) {
  return (
    <div className="section-header">
      <p className="section-number">{number}</p>
      <h2 className="section-title">{title}</h2>
      {lead ? <p className="section-lead">{lead}</p> : null}
    </div>
  );
}

function AccordionItem({ id, open, onToggle, title, meta, children }) {
  const isOpen = open === id;
  return (
    <div className={`acc-item ${isOpen ? 'is-open' : ''}`}>
      <button type="button" className="acc-trigger" onClick={() => onToggle(id)} aria-expanded={isOpen}>
        <span className="acc-title-block">
          <span className="acc-title">{title}</span>
          {meta ? <span className="acc-meta">{meta}</span> : null}
        </span>
        <span className="acc-icon" aria-hidden>
          {isOpen ? '−' : '+'}
        </span>
      </button>
      {isOpen ? <div className="acc-panel">{children}</div> : null}
    </div>
  );
}

function App() {
  const year = useMemo(() => new Date().getFullYear(), []);
  const [navOpen, setNavOpen] = useState(false);
  const [openSystem, setOpenSystem] = useState('kami-pro');
  const [openExp, setOpenExp] = useState('btaskee');

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleNav = () => setNavOpen((v) => !v);
  const closeNav = () => setNavOpen(false);

  const toggleSystem = (id) => setOpenSystem((prev) => (prev === id ? null : id));
  const toggleExp = (id) => setOpenExp((prev) => (prev === id ? null : id));

  return (
    <div className="site">
      <header className="site-header">
        <a className="logo" href="#top" onClick={closeNav}>
          <span className="logo-mark">K</span>
          <span className="logo-text">[ DAO VINH KHANG ]</span>
        </a>

        <nav className={`site-nav ${navOpen ? 'is-open' : ''}`} id="main-nav" aria-label="Primary">
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href} onClick={closeNav}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="nav-toggle"
          onClick={toggleNav}
          aria-expanded={navOpen}
          aria-controls="main-nav"
        >
          {navOpen ? 'CLOSE' : 'MENU'}
        </button>
      </header>

      <span id="top" />

      <main>
        {/* HERO */}
        <section className="hero container" aria-label="Introduction">
          <p className="hero-kicker">
            <span className="status-dot" aria-hidden />
            AI / Backend Engineer · Production systems
          </p>
          <h1 className="hero-title">
            DAO VINH
            <br />
            KHANG
          </h1>
          <p className="hero-subtitle">
            I design and ship <strong>production AI agents and backends</strong> — governed, observable systems that
            run inside real business platforms. From RAG runtimes to ERP/commerce agents. Not proof of concept.
          </p>
          <div className="hero-cta-row">
            <a className="btn-solid" href="#work">
              [ View Deployed Systems ]
            </a>
            <a className="btn-ghost" href="#contact">
              Contact <span aria-hidden>→</span>
            </a>
          </div>
          <div className="hero-meta-line">
            <span>Tan Binh, Ho Chi Minh City</span>
            <span className="sep" aria-hidden>
              /
            </span>
            <a href="mailto:daovinhkhang0834@gmail.com">daovinhkhang0834@gmail.com</a>
            <span className="sep" aria-hidden>
              /
            </span>
            <a href="https://www.linkedin.com/in/dao-vinh-khang-32748023a/" target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="container section-block">
          <SectionHeader number="01 / About" title="Profile" lead="What I optimize for in every system I ship." />
          <ul className="slash-list profile-list">
            {PROFILE.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        {/* WORK / DEPLOYED SYSTEMS */}
        <section id="work" className="container section-block">
          <SectionHeader
            number="02 / Deployed Systems"
            title="Shipped. Auditable. In production."
            lead="Flagship KAMI AI agents for commerce & ERP, plus production systems from professional work."
          />

          <div className="project-list" role="list">
            {SYSTEMS.map((system) => {
              const isOpen = openSystem === system.id;
              return (
                <div key={system.id} className={`project-row ${isOpen ? 'is-open' : ''}`} role="listitem">
                  <button
                    type="button"
                    className="project-row-trigger"
                    onClick={() => toggleSystem(system.id)}
                    aria-expanded={isOpen}
                  >
                    <span className="project-year">{system.year}</span>
                    <span className="project-name">{system.name}</span>
                    <span className="project-tag">{system.tag}</span>
                    <span className="project-badge">{system.badge}</span>
                    <span className="project-toggle" aria-hidden>
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  {isOpen ? (
                    <div className="project-panel">
                      {!!system.videos?.length && (
                        <div className="media-block">
                          <p className="media-label">Demo</p>
                          <div className="video-stack">
                            {system.videos.map((video) => (
                              <figure key={video.src} className="video-card">
                                <video
                                  className="project-video"
                                  controls
                                  playsInline
                                  preload="metadata"
                                  poster={video.poster || undefined}
                                >
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
                            {system.images.map((image) => (
                              <figure key={image.src} className="shot-card">
                                <img src={image.src} alt={image.alt} loading="lazy" />
                                <figcaption>{image.alt}</figcaption>
                              </figure>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="project-summary">{system.summary}</p>
                      <ul className="slash-list compact">
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
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <p className="work-footnote">
            KAMI product site ·{' '}
            <a href="https://github.com/daovinhkhang/Kami-AI-Lab" target="_blank" rel="noreferrer">
              github.com/daovinhkhang/Kami-AI-Lab
            </a>
          </p>
        </section>

        {/* EXPERIENCE */}
        <section id="experience" className="container section-block">
          <SectionHeader
            number="03 / Experience"
            title="Professional trace"
            lead="Roles where production delivery mattered more than slides."
          />
          <div className="acc-list">
            {EXPERIENCES.map((job) => (
              <AccordionItem
                key={job.id}
                id={job.id}
                open={openExp}
                onToggle={toggleExp}
                title={job.company}
                meta={`${job.role} · ${job.time}`}
              >
                <ul className="slash-list compact">
                  {job.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
                <div className="tags">
                  {job.stack.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </AccordionItem>
            ))}
          </div>
        </section>

        {/* CAPABILITIES */}
        <section id="capabilities" className="container section-block">
          <SectionHeader
            number="04 / Capabilities"
            title="The stack I build on."
            lead="Systems skills grouped for clarity — not a keyword dump."
          />
          <div className="cap-grid">
            {CAPABILITIES.map((cap) => (
              <article key={cap.num} className="cap-card">
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

          <div className="method-block">
            <p className="section-number">Implementation</p>
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
        </section>

        {/* EDUCATION */}
        <section id="education" className="container section-block">
          <SectionHeader number="05 / Education" title="Credentials" />
          <div className="edu-grid">
            <article className="edu-card">
              <p className="cap-num">DEGREE</p>
              <h3>Greenwich University</h3>
              <p className="edu-line">BSc (Hons) in Computing · 2020 – 2024</p>
              <p className="edu-line">First Class Honours · GPA 3.7 / 4.0</p>
              <ul className="slash-list compact">
                <li>Certificate of Merit (RVR)</li>
                <li>Best Final Project (Spring 2024)</li>
              </ul>
            </article>
            <article className="edu-card">
              <p className="cap-num">COMMITMENT</p>
              <h3>How I ship</h3>
              <ul className="slash-list compact">
                <li>Production systems over demos</li>
                <li>Governed agents with auditability</li>
                <li>Latency, retrieval, and observability at scale</li>
                <li>Architecture → deploy → optimize → scale</li>
              </ul>
            </article>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="container section-block contact-block">
          <SectionHeader
            number="06 / Contact"
            title="Let's build."
            lead="Open to production AI / backend collaborations and serious product work."
          />
          <div className="contact-grid">
            <a className="contact-item" href="mailto:daovinhkhang0834@gmail.com">
              <span className="contact-label">Email</span>
              <span className="contact-value">daovinhkhang0834@gmail.com</span>
            </a>
            <a className="contact-item" href="tel:+84834684568">
              <span className="contact-label">Phone</span>
              <span className="contact-value">+84 834 684 568</span>
            </a>
            <a
              className="contact-item"
              href="https://www.linkedin.com/in/dao-vinh-khang-32748023a/"
              target="_blank"
              rel="noreferrer"
            >
              <span className="contact-label">LinkedIn</span>
              <span className="contact-value">Dao Vinh Khang ↗</span>
            </a>
            <a
              className="contact-item"
              href="https://apps.odoo.com/apps/modules/19.0/kami_agent"
              target="_blank"
              rel="noreferrer"
            >
              <span className="contact-label">KAMI Pro</span>
              <span className="contact-value">Odoo Apps Store ↗</span>
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer container">
        <div className="footer-cta">Automate the complex. Ship production AI.</div>
        <div className="footer-bottom">
          <span>
            © {year} Dao Vinh Khang · KAMI AI · k-lab
          </span>
          <span>Architecting Production AI.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
