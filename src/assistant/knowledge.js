/* ------------------------------------------------------------------
   Knowledge base for the on-site assistant.
   Answers are grounded in the page content only — no invented facts.
   Each intent carries the anchor it should scroll to, so the widget
   can also act as navigation (same pattern as Vinamilk's quick replies).
------------------------------------------------------------------- */

export const QUICK_REPLIES = [
  { label: 'KAMI for Odoo', intent: 'kami' },
  { label: 'Tasker V2→V5', intent: 'tasker' },
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
    keywords: ['tasker', 'btaskee', 'v2', 'v3', 'v4', 'v5', 'ai mart', 'langgraph', 'runtime', 'retrieval', 'latency'],
    answer:
      'At bTaskee, Khang owned the Tasker roadmap from V2 through V5.0. V3–V4 introduced NodeRAG, ComposeRAG and a Meta-Thinker layer, then a LangGraph-native runtime — cutting retrieval from about 30s to under 5s (~6×). V5.0 re-architected the turn loop into explicit services: TaskerV5Runtime, PromptPack context, country-scoped wiki with evidence gates, ToolRegistry for side effects, and a post-turn memory gateway. AI Mart added personalisation with shadow mode, cohort rollout and a kill-switch.',
    chips: ['See experience', 'Read the metrics', 'Talk to Khang'],
  },
  {
    id: 'stack',
    anchor: '#capabilities',
    keywords: ['stack', 'tech', 'tools', 'python', 'fastapi', 'langchain', 'redis', 'mongo', 'weaviate', 'docker', 'typescript', 'skills', 'capabilities'],
    answer:
      'Core stack: Python, FastAPI, LangChain and LangGraph for agent runtimes; MongoDB, PostgreSQL, Redis and Weaviate for state and retrieval; Docker, MCP and Langfuse for delivery and observability. On the ML side: Whisper / Faster-Whisper / CTranslate2 for speech, TensorFlow and scikit-learn for modelling. Also TypeScript and React Native when the product needs a client.',
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
      'Four roles so far: AI / Backend Engineer at bTaskee (Oct 2025 – present, Tasker platform), AI Engineer at EraX → Gtel (Sep 2024 – Jul 2025, LangChain agent with Odoo, plus speech-to-text), AI Engineer Intern at FPT IS (2023), and Teaching Assistant at FPT Greenwich (2023–2024). The full bullets are in the Experience section.',
    chips: ['Jump to experience', 'Talk to Khang'],
  },
  {
    id: 'education',
    anchor: '#education',
    keywords: ['education', 'degree', 'university', 'greenwich', 'gpa', 'honours', 'honors', 'school', 'study', 'certificate'],
    answer:
      'BSc (Hons) in Computing at Greenwich University, 2020–2024, First Class Honours with a 3.7 / 4.0 GPA. He also received a Certificate of Merit (RVR) and Best Final Project in Spring 2024, and has an SSRN preprint on hybrid deep learning forecasting.',
    chips: ['See education', 'Talk to Khang'],
  },
  {
    id: 'contact',
    anchor: '#contact',
    keywords: ['contact', 'email', 'hire', 'available', 'reach', 'phone', 'linkedin', 'github', 'talk', 'call', 'freelance', 'job'],
    answer:
      'Easiest route is email: daovinhkhang0834@gmail.com. Phone is +84 834 684 568. He is also on LinkedIn (dao-vinh-khang) and GitHub (@daovinhkhang). Open to production AI and backend work.',
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
    anchor: '#top',
    keywords: ['metric', 'number', 'impact', 'result', 'stats', 'achievement', 'proof'],
    answer:
      'Four numbers that summarise the work: Tasker roadmap owned from V2 to V5.0; retrieval latency cut roughly 6× (30s → under 5s); CER 0.066 on Vietnamese ASR; and three KAMI agent surfaces shipped.',
    chips: ['See work', 'Talk to Khang'],
  },
  {
    id: 'this-site',
    anchor: '#top',
    keywords: ['site', 'website', 'built', 'design', 'portfolio', 'this page', 'stack of this'],
    answer:
      'This site is a React + Vite single-page build, styled after the Vinamilk design system — cream #FFFFF1 canvas, blue #0213B0 ink, Archivo for display, Newsreader for body, IBM Plex Mono for technical labels. No CSS framework, no router: plain CSS custom properties and a small IntersectionObserver for reveal animations.',
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
  'See the metrics': { anchor: '#top' },
  'See experience': { anchor: '#experience' },
  'Jump to experience': { anchor: '#experience' },
  'See capabilities': { anchor: '#capabilities' },
  'See education': { anchor: '#education' },
  'Read profile': { anchor: '#about' },
  'Jump to contact': { anchor: '#contact' },
  Contact: { intent: 'contact' },
  'Send an email': { href: 'mailto:daovinhkhang0834@gmail.com' },
  'Open on Odoo Apps': { href: 'https://apps.odoo.com/apps/modules/19.0/kami_agent' },
  'Talk to Khang': { href: 'mailto:daovinhkhang0834@gmail.com' },
  'Copy email': { copy: 'daovinhkhang0834@gmail.com' },
  'KAMI for Odoo': { intent: 'kami' },
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
