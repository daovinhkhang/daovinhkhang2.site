/* ------------------------------------------------------------------
   Knowledge base for the on-site assistant.
   Answers are grounded in the page content only — no invented facts.
   Each intent carries the anchor it should scroll to, so the widget
   can also act as navigation (same pattern as Vinamilk's quick replies).
------------------------------------------------------------------- */

export const QUICK_REPLIES = [
  { label: 'Take the tour', intent: 'tour' },
  { label: 'KAMI for Odoo', intent: 'kami' },
  { label: 'BeeTa & Kai V5', intent: 'tasker' },
  { label: 'Experience', intent: 'experience' },
  { label: 'Stack', intent: 'stack' },
  { label: 'Contact', intent: 'contact' },
];

export const GREETING = [
  "Hi — I'm Khang's assistant. Ask me about the systems he shipped, the stack, or how to reach him.",
  'I can also walk you to the right section.',
];

const KB = [
  {
    id: 'kami',
    anchor: '#work',
    keywords: ['kami', 'odoo', 'medusa', 'agent', 'erp', 'commerce', 'approval', 'audit', 'undo', 'copilot', 'autopilot'],
    answer:
      'KAMI is a family of production AI agents. KAMI Pro runs inside Odoo 17–19: users ask in plain language and it discovers apps, models, views and permissions, then reads or writes real records under the signed-in ACLs. Every write goes through approval gates, dry-run diffs, an audit ledger and one-click undo. There is also a Community edition for Odoo 19 (open source) and a Medusa 2 build with 25+ commerce tools.',
    chips: ['See it in Work', 'Open on Odoo Apps', 'Talk to Khang'],
  },
  {
    id: 'tasker',
    anchor: '#experience',
    keywords: ['tasker', 'beeta', 'kai', 'btaskee', 'v2', 'v3', 'v4', 'v5', 'ai mart', 'turn_facts', 'agent lab', 'compaction', 'langgraph', 'runtime', 'retrieval', 'latency', 'zalo', 'tiktok', 'line'],
    answer:
      'At bTaskee, Khang owns the dual agent fleet across 4 markets (VN, TH, ID, MY): BeeTa (Tasker onboarding & live operations) and Kai (omnichannel customer support on Mobile, TikTok DM, Zalo, LINE). V3–V4 introduced NodeRAG, ComposeRAG, and Meta-Thinker in LangGraph (~30s → under 5s, ~6×). V5.0 added TaskerV5Runtime, PromptPack, ToolRegistry, deterministic TURN_FACTS evidence gates, ClickHouse-to-MongoDB AI Mart personalization (6 context slots, 2,200-char prompt budget), context compaction, Socket.IO streaming, Agent Lab simulation, and golden-trace E2E gates.',
    chips: ['See experience', 'Read the metrics', 'Talk to Khang'],
  },
  {
    id: 'stack',
    anchor: '#capabilities',
    keywords: ['stack', 'tech', 'tools', 'python', 'fastapi', 'langchain', 'redis', 'mongo', 'clickhouse', 'weaviate', 'docker', 'typescript', 'pytorch', 'huggingface', 'skills', 'capabilities'],
    answer:
      'AI & LLM: LangChain, LangGraph, NodeRAG, ComposeRAG, GraphRAG, MCP, Evaluation Gates (Langfuse). Backend & Data: Python (FastAPI, Flask), Node.js (TypeScript, Express), REST, WebSockets, Socket.IO, Docker, CI/CD, PostgreSQL, MongoDB, ClickHouse, Redis, Weaviate. ML & ASR: PyTorch, TensorFlow, TFLite, Keras, Scikit-learn, Hugging Face, Whisper, Faster-Whisper, CTranslate2, Torchaudio, Librosa — plus Odoo ERP (17–19, OWL) and Medusa 2.0.',
    chips: ['See capabilities', 'Talk to Khang'],
  },
  {
    id: 'asr',
    anchor: '#work',
    keywords: ['asr', 'speech', 'whisper', 'stt', 'vietnamese', 'accent', 'cer', 'wer', 'audio'],
    answer:
      'Khang built a Vietnamese accent-aware speech-to-text pipeline: Whisper finetuning on roughly 245k samples (~870 hours), then Faster-Whisper and CTranslate2 for serving. The EraX-WoW-medium model reached CER 0.066 / WER 0.107 — about 60% better than the baselines — and ran roughly 30% faster with CTranslate2 on an RTX 3090.',
    chips: ['See it in Work', 'Talk to Khang'],
  },
  {
    id: 'experience',
    anchor: '#experience',
    keywords: ['experience', 'work', 'job', 'career', 'history', 'erax', 'gtel', 'fpt', 'greenwich', 'teaching', 'role', 'company'],
    answer:
      'Four roles so far: AI / Backend Engineer at bTaskee (Oct 2025 – Present, BeeTa & Kai Dual Agent Fleet across 4 markets), AI Engineer at EraX → Gtel (Sep 2024 – Jul 2025, LangChain + Odoo workflow automation, Redis/vector DB, Vietnamese Whisper ASR, 6 TFLite mobile models), AI Engineer Intern at FPT IS (Jun–Sep 2023, Flask + DialoGPT/spaCy chatbot), and Teaching Assistant — AI & ML at FPT Greenwich (Feb 2023 – Nov 2024, mentored 50+ students in Python/TensorFlow/PyTorch, +30% project scores).',
    chips: ['Jump to experience', 'Talk to Khang'],
  },
  {
    id: 'education',
    anchor: '#education',
    keywords: ['education', 'degree', 'university', 'greenwich', 'gpa', 'honours', 'honors', 'school', 'study', 'certificate', 'ssrn', 'paper', 'publication', 'forecasting', '5023739', 'lstm', 'transformer'],
    answer:
      'University of Greenwich (UK) / FPT Greenwich — BSc (Hons) in Computing (2020–2024), First Class Honours, GPA 3.7 / 4.0, Best Final Project Award (Spring 2024), and Certificate of Merit (RVR). Published 2024 SSRN Research Preprint (Paper No. 5023739): "Evaluating Hybrid Deep Learning Models for Stock Price Forecasting: A Comparison of LSTM-GRU and Transformer-GRU Architectures".',
    chips: ['See education', 'SSRN Paper #5023739', 'Talk to Khang'],
  },
  {
    id: 'contact',
    anchor: '#contact',
    keywords: ['contact', 'email', 'hire', 'available', 'reach', 'phone', 'linkedin', 'github', 'talk', 'call', 'freelance', 'job', 'liên hệ', 'form', 'nhắn', 'gửi'],
    answer:
      'You can use the guided inquiry form right in #contact (pick a topic like Hiring, AI Build, or Advisory and I can help draft your brief right beside you), or reach Dao Vinh Khang directly at daovinhkhang0834@gmail.com or +84 834 684 568.',
    chips: ['Jump to contact', 'Copy email'],
  },
  {
    id: 'profile',
    anchor: '#about',
    keywords: ['who', 'about', 'profile', 'yourself', 'khang', 'background', 'summary', 'bio', 'introduce'],
    answer:
      'Dao Vinh Khang is an AI / Backend Engineer based in Ho Chi Minh City. He builds production AI systems rather than demo prototypes — LLM agents, RAG runtimes, multi-agent orchestration and the backends underneath — and owns the full lifecycle from architecture through deployment, optimisation and scaling.',
    chips: ['Read profile', 'See work', 'Talk to Khang'],
  },
  {
    id: 'metrics',
    anchor: '.stats',
    keywords: ['metric', 'number', 'impact', 'result', 'stats', 'achievement', 'proof'],
    answer:
      'Four numbers that summarise the work: Tasker roadmap owned from V2 to V5.0; retrieval latency cut roughly 6× (30s → under 5s); CER 0.066 on Vietnamese ASR; and three KAMI agent surfaces shipped.',
    chips: ['See work', 'Talk to Khang'],
  },
  {
    id: 'this-site',
    anchor: '#top',
    keywords: ['site', 'website', 'built', 'design', 'portfolio', 'this page', 'stack of this', 'sandbox', 'tool', 'workflow'],
    answer:
      'This site is a React + Vite single-page build styled after the Vinamilk design system, with an embedded agent widget that drives the page, renders structured cards, runs isolated Web Worker code sandboxes, and synthesizes reusable session tools under approval gates.',
    chips: ['See the work', 'Talk to Khang'],
  },
];

/* Small-talk fallbacks so the assistant never dead-ends. */
const SMALL_TALK = [
  {
    match: /^(hi|hello|hey|chào|xin chào|alo)\b/i,
    answer: "Hello. Ask me about KAMI, the Tasker platform, the stack, or how to get in touch — or tap one of the suggestions.",
    chips: ['KAMI for Odoo', 'Tasker V2→V5', 'Contact'],
  },
  {
    match: /(thank|thanks|cảm ơn|cam on)/i,
    answer: 'Any time. If you want the long version, the Work and Experience sections have the detail.',
    chips: ['See work', 'Talk to Khang'],
  },
  {
    match: /(bye|goodbye|tạm biệt)/i,
    answer: 'Thanks for stopping by. Email is the fastest way to reach Khang.',
    chips: ['Contact'],
  },
  {
    match: /(ai|robot|bot|automated)\s*(are you|\?)/i,
    answer:
      "I'm a small on-page assistant, not a language model. I match your question against a fixed knowledge base built from this page, so everything I say is grounded in what Khang actually published here.",
    chips: ['What can you do?', 'Contact'],
  },
  {
    match: /(what can you do|help|capabilities of)/i,
    answer:
      'I can explain KAMI, the Tasker platform, the speech-to-text work, the stack, the role history and the credentials — and jump you to the matching section. I answer from a fixed knowledge base, so I will say when something is not on the page.',
    chips: ['KAMI for Odoo', 'Experience', 'Contact'],
  },
];

const CHIP_ACTIONS = {
  'See it in Work': { anchor: '#work' },
  'See work': { anchor: '#work' },
  'See the work': { anchor: '#work' },
  'See the metrics': { anchor: '.stats' },
  'Read the metrics': { anchor: '.stats' },
  'See experience': { anchor: '#experience' },
  'Jump to experience': { anchor: '#experience' },
  'See capabilities': { anchor: '#capabilities' },
  'See education': { anchor: '#education' },
  'Read profile': { anchor: '#about' },
  'Jump to contact': { anchor: '#contact' },
  Contact: { intent: 'contact' },
  'Send an email': { href: 'mailto:daovinhkhang0834@gmail.com' },
  'Open on Odoo Apps': { href: 'https://apps.odoo.com/apps/modules/19.0/kami_agent' },
  'SSRN Paper #5023739': { href: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5023739' },
  'Talk to Khang': { href: 'mailto:daovinhkhang0834@gmail.com' },
  'Copy email': { copy: 'daovinhkhang0834@gmail.com' },
  'KAMI for Odoo': { intent: 'kami' },
  'BeeTa & Kai V5': { intent: 'tasker' },
  'Tasker V2→V5': { intent: 'tasker' },
  Experience: { intent: 'experience' },
  Stack: { intent: 'stack' },
  'What can you do?': { intent: 'help' },
};

function scoreEntry(entry, text) {
  const lower = text.toLowerCase();
  let score = 0;
  for (const kw of entry.keywords) {
    if (lower.includes(kw)) score += kw.length > 4 ? 2 : 1;
  }
  return score;
}

export function resolveReply(rawText) {
  const text = (rawText || '').trim();
  if (!text) {
    return {
      answer: 'Type a question and I will point you to the right part of the page.',
      chips: ['KAMI for Odoo', 'Experience', 'Contact'],
      anchor: null,
    };
  }

  if (/^(help|what can you do)/i.test(text)) {
    const help = SMALL_TALK.find((s) => s.match.test('what can you do'));
    return { ...help, anchor: null };
  }

  for (const small of SMALL_TALK) {
    if (small.match.test(text)) {
      return { answer: small.answer, chips: small.chips, anchor: null };
    }
  }

  const ranked = KB.map((entry) => ({ entry, score: scoreEntry(entry, text) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  if (ranked.length) {
    const best = ranked[0].entry;
    return { answer: best.answer, chips: best.chips, anchor: best.anchor, id: best.id };
  }

  return {
    answer:
      "I don't have that on the page yet. I can cover KAMI, the Tasker platform, the speech-to-text work, the stack, the role history and how to get in touch — or you can email Khang directly.",
    chips: ['KAMI for Odoo', 'Stack', 'Contact'],
    anchor: null,
  };
}

export function resolveChip(label) {
  return CHIP_ACTIONS[label] || null;
}
