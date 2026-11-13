/**
 * Page content, in one place.
 *
 * The page renders it and the assistant reads it: read_page answers from the
 * same objects the visitor sees, so the guide can never quote a stale copy.
 */

export const NAV = [
  { href: '#work', label: 'Work' },
  { href: '#experience', label: 'Experience' },
  { href: '#capabilities', label: 'Capabilities' },
  { href: '#education', label: 'Education' },
  { href: '#contact', label: 'Contact' },
];

export const PROFILE = [
  'Engineer reliable, governed production AI systems over prototype demos across enterprise platforms and consumer apps.',
  'Specialize in LLM agent runtimes, RAG latency reduction, multi-agent orchestration, deterministic workflow enforcement, and model fine-tuning.',
  'Own the full lifecycle end-to-end: architecture → deployment → optimization → scaling.',
  'Deliver across Odoo 17–19, Medusa 2.0, and bTaskee multi-country AI platforms (VN, TH, ID, MY).',
];

export const STATS = [
  { value: 'V2 → V5.0', label: 'BeeTa & Kai fleet · 4 markets (VN/TH/ID/MY)' },
  { value: '~6×', label: 'Retrieval latency cut (~30s → <5s)' },
  { value: 'CER 0.066', label: 'Vietnamese ASR · ~870h (~60% lower error)' },
  { value: '3', label: 'KAMI agent surfaces shipped (Odoo & Medusa)' },
];

export const SYSTEMS = [
  {
    id: 'kami-pro',
    year: '2026',
    name: 'KAMI AI Agent Pro for Odoo',
    short: 'KAMI Pro',
    tag: 'Odoo 17–19 · Commercial Enterprise Product',
    badge: 'Flagship',
    tone: 'lime',
    hero: '/kami/pro/screenshot_dashboard.png',
    summary:
      'Native enterprise AI work layer for Odoo 17–19 that interprets plain-language business intents, auto-discovers apps, models, views, and permissions, and performs governed operations strictly adhering to signed-in user ACLs.',
    points: [
      'Action Layer + Quick Chat with Assist, Copilot & Autopilot modes',
      'Mutation budgets, dry-run diffs, and immutable audit ledgers',
      'Approval gates & one-click rollback across business records',
      'Multi-provider routing (DeepSeek V4 default, OpenAI, Anthropic, Gemini)',
    ],
    stack: ['Python', 'Odoo 17–19', 'OWL Framework', 'DeepSeek V4', 'Telegram API'],
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
    tag: 'Odoo 19 · Open-Source Autonomous Agent',
    badge: 'Open source',
    tone: 'mint',
    hero: '/kami/community/kami-odoo-hero.png',
    summary:
      'Open-source autonomous Odoo 19 agent featuring real-time visible tool execution traces, per-model policy enforcement, approval dry-run gates, immutable audit ledger, and reversible write operations.',
    points: [
      'Real-time visible tool execution traces in conversation',
      'Per-model policy enforcement for models, fields & domains',
      'Approval gates with dry-run diffs',
      'Reversible write operations + DeepSeek V4 routing',
    ],
    stack: ['Python', 'Odoo 19', 'OWL', 'DeepSeek V4'],
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
    name: 'BeeTa & Kai Dual Agent Platform (V2 → V5.0)',
    short: 'BeeTa & Kai V5',
    tag: 'bTaskee · 4 Markets (VN/TH/ID/MY) · AI Mart',
    badge: 'Production',
    tone: 'beige',
    hero: null,
    summary:
      'Full-lifecycle production AI fleet across 4 markets powering BeeTa (Tasker onboarding & live operations) and Kai (omnichannel customer support across Mobile, TikTok DM, Zalo, LINE) — evolving from NodeRAG/ComposeRAG LangGraph (V3–V4) to TaskerV5Runtime with deterministic TURN_FACTS evidence gates and ClickHouse-to-MongoDB AI Mart personalization.',
    points: [
      'NodeRAG, ComposeRAG & Meta-Thinker in LangGraph cutting retrieval ~6× (~30s → <5s)',
      'Tasker V5.0 decoupled services (TaskerV5Runtime, PromptPack, ToolRegistry) + TURN_FACTS gates',
      'AI Mart ClickHouse-to-MongoDB sync into 6 context slots (2,200-char prompt budget, cohort rollout & kill-switch)',
      'Long-term context compaction + Socket.IO streaming + Agent Lab simulator & golden-trace E2E gates',
    ],
    stack: ['Python', 'FastAPI', 'LangGraph', 'Socket.IO', 'ClickHouse', 'MongoDB', 'Redis', 'Weaviate', 'Langfuse', 'MCP'],
    link: null,
    videos: [],
    images: [],
  },
  {
    id: 'stt',
    year: '2024–2025',
    name: 'Vietnamese Accent-Aware Speech-to-Text (EraX-WoW-medium)',
    short: 'Vietnamese ASR',
    tag: 'EraX / Gtel · Whisper · CTranslate2 · Vast.ai',
    badge: 'Shipped',
    tone: 'mint',
    hero: null,
    summary:
      'Accent-aware Vietnamese Speech-to-Text pipeline: fine-tuned Whisper Medium on ~245,000 multi-regional audio samples (~870 hours) via Vast.ai cloud GPUs and accelerated production serving with Faster-Whisper and CTranslate2 on NVIDIA RTX 3090.',
    points: [
      'Whisper Medium fine-tune on ~245,000 samples (~870 hours) via Vast.ai GPUs',
      'EraX-WoW-medium achieved CER 0.066 / WER 0.107 (~60% relative error reduction vs baselines)',
      'Faster-Whisper & CTranslate2 serving on RTX 3090 cut transcription latency by ~30%',
      'Complemented by 6 TensorFlow Lite on-device models (noise reduction, emotion, NER)',
    ],
    stack: ['Whisper', 'Faster-Whisper', 'CTranslate2', 'Torchaudio', 'Librosa', 'Vast.ai', 'TFLite'],
    link: null,
    videos: [],
    images: [],
  },
];

/* flat gallery rail pulled from every system that has screenshots */
export const GALLERY = SYSTEMS.flatMap((s) =>
  (s.images || []).map((img) => ({ ...img, system: s.short, tone: s.tone })),
);

export function videoType(src = '') {
  if (/\.mov($|\?)/i.test(src)) return 'video/quicktime';
  if (/\.webm($|\?)/i.test(src)) return 'video/webm';
  return 'video/mp4';
}

export const EXPERIENCES = [
  {
    id: 'btaskee',
    company: 'bTaskee (BeeTa & Kai Platform)',
    role: 'AI / Backend Engineer — Core AI & Tasker Platform',
    time: 'Oct 2025 – Present',
    bullets: [
      'Dual Agent Fleet Ownership: Directed full engineering lifecycle across 4 markets (VN, TH, ID, MY), powering BeeTa (Tasker onboarding & live operations) and Kai (omnichannel customer support across Mobile, TikTok DM, Zalo, LINE).',
      'RAG & Runtime Optimization (V3–V4): Architected NodeRAG, ComposeRAG, and a Meta-Thinker reasoning layer inside a LangGraph stateful runtime (routing, episodic memory, vector retrieval, verification), slashing retrieval latency ~6× (~30s → <5s).',
      'Governed Service Runtime (V5.0): Engineered Tasker V5 decoupled services (TaskerV5Runtime, PromptPack, ToolRegistry) and enforced deterministic TURN_FACTS evidence gates for account states (ACTIVE/LOCKED) and action receipts — eliminating free-form LLM hallucinations.',
      'Personalization Engine (AI Mart): Built ClickHouse-to-MongoDB sync pipeline streaming behavioral propensity signals into 6 context slots (identity, risk, capacity, behavior, growth, history) via 2,200-char budget-capped prompts with hash-stable cohort rollouts and kill-switches.',
      'Long-Term Memory & Context Compaction: Architected unified in-process memory service and conversation compaction compressing multi-turn dialogue into source-grounded checkpoints while preserving entity IDs, temporal constraints, and cutting token costs.',
      'Production Streaming & E2E Evaluation: Delivered mobile Socket.IO token streaming, built Agent Lab for isolated mobile simulation, and established automated golden-trace E2E benchmark gates for canary rollouts.',
    ],
    stack: ['Python', 'FastAPI', 'LangGraph', 'Socket.IO', 'ClickHouse', 'MongoDB', 'Redis', 'Weaviate', 'Docker', 'MCP', 'Langfuse'],
  },
  {
    id: 'erax',
    company: 'EraX → Gtel Global Mobile Telecommunications JSC',
    role: 'AI Engineer',
    time: 'Sep 2024 – Jul 2025',
    bullets: [
      'Enterprise Agent & Workflow: Engineered a LangChain autonomous agent integrated with Odoo ERP and a universal workflow orchestration engine for multi-department automation.',
      'Memory & Semantic Retrieval: Implemented persistent Redis caching and vector databases for low-latency semantic context retrieval across high-concurrency enterprise queries.',
      'Vietnamese ASR Pipeline: Fine-tuned Whisper Medium on ~245,000 multi-regional audio samples (~870 hours) via Vast.ai cloud GPUs, achieving CER 0.066 / WER 0.107 (~60% relative error reduction over baselines).',
      'Serving Acceleration: Transitioned inference to Faster-Whisper and CTranslate2 on NVIDIA RTX 3090, reducing transcription latency by ~30%.',
      'Mobile Edge AI: Developed and deployed 6 TensorFlow Lite on-device models for noise reduction, emotion classification, and named entity recognition (NER).',
    ],
    stack: ['LangChain', 'Odoo', 'Whisper', 'Faster-Whisper', 'CTranslate2', 'TensorFlow Lite', 'PyTorch', 'Redis', 'Vast.ai'],
  },
  {
    id: 'fptis',
    company: 'FPT Information System (FPT IS)',
    role: 'AI Engineer Intern',
    time: 'Jun 2023 – Sep 2023',
    bullets: [
      'Chatbot Architecture: Built backend chatbot service architecture using Flask, powering enterprise conversational query routing.',
      'NLP Intent Analysis: Integrated DialoGPT models and spaCy NLP pipelines for entity extraction, intent classification, and multi-turn dialogue management.',
      'Performance Tuning: Benchmarked and tuned deep learning models for inference speed, minimizing response latency under peak loads.',
    ],
    stack: ['Flask', 'DialoGPT', 'spaCy', 'Python'],
  },
  {
    id: 'greenwich',
    company: 'FPT Greenwich',
    role: 'Teaching Assistant — Artificial Intelligence & Machine Learning',
    time: 'Feb 2023 – Nov 2024',
    bullets: [
      'Course Instruction: Mentored 50+ undergraduate students across Machine Learning, Deep Learning, and Applied AI laboratory sessions.',
      'Technical Workshops: Guided hands-on implementations in Python, TensorFlow, and PyTorch; improved cohort average project scores by ~30%.',
    ],
    stack: ['Python', 'TensorFlow', 'PyTorch', 'Teaching'],
  },
];

export const CAPABILITIES = [
  {
    num: '01',
    title: 'AI & LLM Systems',
    tone: 'lime',
    items: [
      'LangChain · LangGraph · Multi-Agent Orchestration',
      'NodeRAG · ComposeRAG · GraphRAG · Vector Search',
      'Tool Calling · Prompt Engineering · Evaluation Gates (Langfuse) · MCP',
    ],
  },
  {
    num: '02',
    title: 'Backend, Data & Infra',
    tone: 'mint',
    items: [
      'Python (FastAPI, Flask) · Node.js (TypeScript, Express)',
      'PostgreSQL · MongoDB · ClickHouse · Redis · Weaviate',
      'RESTful APIs · WebSockets · Socket.IO · Docker · Linux · CI/CD · Git',
    ],
  },
  {
    num: '03',
    title: 'Machine Learning & ASR',
    tone: 'beige',
    items: [
      'PyTorch · TensorFlow · TFLite · Keras · Scikit-learn · Hugging Face',
      'Whisper · Faster-Whisper · CTranslate2 · Torchaudio · Librosa',
      'Model Fine-tuning & Quantization · RTX 3090 Serving Acceleration',
    ],
  },
  {
    num: '04',
    title: 'Platforms & Languages',
    items: [
      'Odoo ERP (v17/18/19, OWL framework) · Medusa 2.0 Headless Commerce',
      'English (B1 VSTEP, Professional Working) · Vietnamese (Native)',
      'Best Final Project (Spring 2024) · Certificate of Merit (RVR)',
    ],
  },
];

export const EDUCATION_INFO = {
  school: 'University of Greenwich (UK) / FPT Greenwich',
  location: 'Ho Chi Minh City, Vietnam',
  degree: 'BSc (Hons) in Computing — First Class Honours',
  period: '2020 – 2024',
  honours: 'First Class Honours',
  gpa: '3.7 / 4.0',
  awards: ['Best Final Project Award (Spring 2024)', 'Certificate of Merit (RVR)'],
};

export const PUBLICATION = {
  id: 'ssrn-5023739',
  venue: 'SSRN Research Preprint (Social Science Research Network)',
  year: 'Published 2024',
  paperNo: '5023739',
  href: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5023739',
  authors: 'Dao, Vinh Khang',
  title:
    'Evaluating Hybrid Deep Learning Models for Stock Price Forecasting: A Comparison of LSTM-GRU and Transformer-GRU Architectures',
  summary:
    'Investigated hybrid deep learning architectures (LSTM-GRU vs. Transformer-GRU) for multi-horizon financial time-series forecasting, benchmarked against classical recurrent networks.',
};

export const METHOD = [
  { phase: 'Phase 01', name: 'Discover', detail: 'Map processes and pinpoint where AI agents deliver measurable value.' },
  { phase: 'Phase 02', name: 'Design', detail: 'Define agent workflow, controls, and approval gates matched to operations.' },
  { phase: 'Phase 03', name: 'Deploy', detail: 'Ship into production with monitoring, auditability, and zero-downtime rollout.' },
  { phase: 'Phase 04', name: 'Optimize', detail: 'Tune against real-world data for latency, quality, and scale.' },
];

export const TICKER = [
  'Production AI, not demos',
  'Dual Agent Fleet · BeeTa & Kai (4 Markets)',
  'Ho Chi Minh City · Vietnam',
  'Open to AI / Backend roles',
  'KAMI for Odoo & Medusa',
];

export const CREDENTIALS = [
  { k: 'Odoo Apps Store', v: 'KAMI Pro commercial module' },
  { k: 'First Class Honours', v: 'Greenwich · GPA 3.7 / 4.0' },
  { k: 'Best Final Project', v: 'Spring 2024 · RVR Merit' },
  {
    k: 'SSRN Paper No. 5023739',
    v: 'LSTM-GRU vs. Transformer-GRU ↗',
    href: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5023739',
  },
  { k: 'Dual Agent Fleet', v: 'bTaskee BeeTa & Kai · 4 Markets' },
];
