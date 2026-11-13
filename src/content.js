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
  'Build production AI systems — not demo-only prototypes.',
  'Focus: LLM systems, multi-agent runtimes, RAG architecture, workflow orchestration, backend platforms.',
  'Own the full lifecycle: architecture → deployment → optimization → scaling.',
  'Strong research orientation with continuous system improvement.',
];

export const STATS = [
  { value: 'V2 → V5.0', label: 'Tasker roadmap owned at bTaskee' },
  { value: '~6×', label: 'Retrieval latency cut (30s → <5s)' },
  { value: 'CER 0.066', label: 'Vietnamese ASR — EraX-WoW-medium' },
  { value: '3', label: 'KAMI agent surfaces shipped' },
];

export const SYSTEMS = [
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

export const CAPABILITIES = [
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

export const METHOD = [
  { phase: 'Phase 01', name: 'Discover', detail: 'Map processes and pinpoint where AI agents deliver measurable value.' },
  { phase: 'Phase 02', name: 'Design', detail: 'Define agent workflow, controls, and approval gates matched to operations.' },
  { phase: 'Phase 03', name: 'Deploy', detail: 'Ship into production with monitoring, auditability, and zero-downtime rollout.' },
  { phase: 'Phase 04', name: 'Optimize', detail: 'Tune against real-world data for latency, quality, and scale.' },
];

export const TICKER = [
  'Production AI, not demos',
  'LLM agents · RAG · multi-agent runtimes',
  'Ho Chi Minh City · Vietnam',
  'Open to AI / Backend roles',
  'KAMI for Odoo & Medusa',
];

export const CREDENTIALS = [
  { k: 'Odoo Apps Store', v: 'Commercial module' },
  { k: 'First Class Honours', v: 'Greenwich University' },
  { k: 'Best Final Project', v: 'Spring 2024' },
  { k: 'SSRN preprint', v: 'Hybrid DL forecasting' },
  { k: 'Certificate of Merit', v: 'RVR' },
];
