import OpenAI from 'openai';

const SECTION_IDS = ['home', 'profile', 'experience', 'whisper-flow', 'projects', 'tech-radar', 'skills', 'education', 'summary', 'contact'];

const ANCHOR_GUIDE = [
  {
    id: 'home',
    section: 'home',
    title: 'Hero identity',
    summary:
      'Dao Vinh Khang. AI / Backend Engineer, System Builder, RAG Architect, Multi-Agent Runtime Engineer. Based in Tan Binh, Ho Chi Minh City, Vietnam.',
    keywords: ['dao vinh khang', 'identity', 'introduce', 'who are you', 'hero', 'architect identity', 'system boot'],
  },
  {
    id: 'profile',
    section: 'profile',
    title: 'Profile overview',
    summary:
      'Passionate about unlocking AI potential. Focus on LLM systems, multi-agent runtimes, workflow orchestration, backend architecture, speech systems, and production AI delivery.',
    keywords: ['profile', 'about', 'overview', 'gioi thieu', 'about you', 'production ai systems', 'growth mindset'],
  },
  {
    id: 'exp-btaskee',
    section: 'experience',
    title: 'bTaskee experience',
    summary:
      'AI / Backend Engineer at bTaskee from October 2025 to present. Owned Tasker V2 to V4 roadmap, LangGraph-native runtime, attachment intelligence, observability tracing, and retrieval latency reduction from about 30s to under 5s.',
    keywords: [
      'btaskee',
      'tasker',
      'tasker v2',
      'tasker v3',
      'tasker v4',
      'langgraph native runtime',
      'nodereg',
      'node rag',
      'composerag',
      'meta-thinker',
      'retrieval latency',
      '6x',
      'mongodb hydration',
      'langfuse',
      'observability tracing',
    ],
  },
  {
    id: 'exp-erax',
    section: 'experience',
    title: 'EraX and Gtel experience',
    summary:
      'AI Engineer at EraX to Gtel Global Mobile Telecommunications JSC from September 2024 to July 2025. Built LangChain Agent chatbot with Odoo, workflow engine, Redis memory, vector retrieval, 6 TensorFlow Lite models, and Vietnamese speech-to-text system.',
    keywords: [
      'erax',
      'gtel',
      'odoo',
      'workflow engine',
      'speech to text',
      'stt',
      'asr',
      'whisper baseline',
      'vast.ai',
      'tensorflow lite',
      'mobile ai',
      'ctranslate2',
      'cer',
      'wer',
      'rtx 3090',
    ],
  },
  {
    id: 'exp-fptis',
    section: 'experience',
    title: 'FPT IS experience',
    summary:
      'Intern AI Engineer at FPT IS from June 2023 to September 2023. Built chatbot architecture using Flask, integrated DialoGPT and spaCy, and improved response accuracy and performance.',
    keywords: ['fpt is', 'intern', 'flask chatbot', 'dialogpt', 'spacy', 'intent analysis'],
  },
  {
    id: 'exp-fptgreenwich',
    section: 'experience',
    title: 'FPT Greenwich experience',
    summary:
      'Teaching Assistant for AI at FPT Greenwich from February 2023 to November 2024. Guided ML, DL, and AI workshops and supported more than 50 students.',
    keywords: ['fpt greenwich', 'teaching assistant', 'workshops', 'students', '50+', 'teaching', 'mentoring'],
  },
  {
    id: 'whisper-flow-3d',
    section: 'whisper-flow',
    title: 'Whisper training flow',
    summary:
      '3D spectrogram tunnel showing dataset load, audio pipeline, realtime augmentation, train loop, and eval plus export for EraX Whisper finetuning.',
    keywords: [
      'whisper flow',
      '3d spectrogram tunnel',
      'dataset load',
      'audio pipeline',
      'realtime augment',
      'train loop',
      'eval export',
      'jsonl dataset',
      'augmentation',
      'torchrun',
    ],
  },
  {
    id: 'whisper-metrics',
    section: 'whisper-flow',
    title: 'Whisper metrics and setup',
    summary:
      'Base model Whisper Medium, 245000 samples, about 870 hours, online augmentation with noise, speed, and pitch, Vietnamese multi-region speech data, and evaluation on 2000 Vietnamese samples.',
    keywords: [
      'whisper medium',
      '245000',
      '870 hours',
      'noise speed pitch',
      'multi-region speech',
      'training setup',
      'evaluation highlights',
      '2000 vietnamese samples',
      'common voice',
    ],
  },
  {
    id: 'whisper-benchmark',
    section: 'whisper-flow',
    title: 'Whisper benchmark table',
    summary:
      'Benchmark table comparing Whisper-medium, Whisper-large-v3-turbo, Whisper-large-v3, and EraX-WoW-medium-V1.0 with CER and WER. EraX-WoW-medium-V1.0 reaches CER 0.066 and WER 0.107.',
    keywords: [
      'benchmark',
      'benchmark table',
      'cer',
      'wer',
      '0.066',
      '0.107',
      'whisper medium',
      'whisper large v3 turbo',
      'whisper large v3',
      'erax wow medium',
    ],
  },
  {
    id: 'proj-tasker',
    section: 'projects',
    title: 'Tasker platform evolution project',
    summary:
      'Tasker Platform Evolution from V2 to V4 covering NodeRAG, ComposeRAG, Meta-Thinker, LangGraph runtime, attachment intelligence, retrieval optimization, and observability.',
    keywords: ['tasker platform evolution', 'tasker project', 'nodereg', 'node rag', 'composerag', 'meta-thinker', 'langgraph runtime'],
  },
  {
    id: 'proj-stt',
    section: 'projects',
    title: 'Speech-to-Text project',
    summary:
      'Speech-to-Text for Vietnamese accents using Whisper, Faster-Whisper, and CTranslate2 with accent-aware ASR pipeline, finetuning, benchmarking, and real-world gains.',
    keywords: ['speech-to-text', 'vietnamese accents', 'faster-whisper', 'ctranslate2', 'accent-aware', 'asr pipeline'],
  },
  {
    id: 'proj-odoo',
    section: 'projects',
    title: 'Odoo AI chatbot project',
    summary:
      'Odoo AI Chatbot and Workflow Engine using LangChain Agent, tool-calling, business process automation, and Redis plus vector retrieval.',
    keywords: ['odoo ai chatbot', 'workflow engine', 'langchain agent', 'tool calling', 'business automation'],
  },
  {
    id: 'proj-mobile',
    section: 'projects',
    title: 'Mobile AI model suite',
    summary:
      'TensorFlow Lite optimized mobile AI models for Android and iOS inference, lightweight under 100MB, production-ready deployment.',
    keywords: ['mobile ai', 'tensorflow lite', 'android', 'ios', 'under 100mb', 'production-ready deployment'],
  },
  {
    id: 'proj-stock',
    section: 'projects',
    title: 'Stock price prediction model',
    summary:
      'Ongoing stock price prediction model from May 2024 using Conv1D plus BiLSTM plus GRU, RSI, MACD, Bollinger Bands, VIX, KFold CV, and Keras Tuner with MAPE train 1.181 percent and test 1.248 percent on BRK-B.',
    keywords: [
      'stock price prediction',
      'conv1d',
      'bilstm',
      'gru',
      'rsi',
      'macd',
      'bollinger bands',
      'vix',
      'mape',
      'brk-b',
      'keras tuner',
    ],
  },
  {
    id: 'proj-sentiment',
    section: 'projects',
    title: 'Sentiment analysis news model',
    summary:
      'Ongoing sentiment analysis model from September 2023 using FinBERT and BERT with Yahoo Finance and NewsAPI. Metrics: accuracy 0.86, F1 0.85, precision 0.84.',
    keywords: ['sentiment analysis', 'finbert', 'bert', 'yahoo finance', 'newsapi', 'accuracy 0.86', 'f1 0.85', 'precision 0.84'],
  },
  {
    id: 'proj-publication',
    section: 'projects',
    title: 'Scientific publication',
    summary:
      'Scientific publication titled Evaluating Hybrid Deep Learning Models for Stock Price Forecasting by Dao Vinh Khang on SSRN, published as a preprint on November 17, 2024.',
    keywords: ['publication', 'scientific publication', 'ssrn', 'stock price forecasting', 'november 17 2024', 'preprint'],
  },
  {
    id: 'tech-radar',
    section: 'tech-radar',
    title: 'Tech Radar 3D skill network',
    summary:
      'Interactive orbital skill network with hover evidence and click-to-scroll behavior, mapping each skill to where it was used and what outcome it produced.',
    keywords: [
      'tech radar',
      'radar',
      'skill map',
      'skill network',
      'orbital network',
      '3d radar',
      'used in',
      'outcome',
      'hover node',
      'signal network',
    ],
  },
  {
    id: 'skill-ai',
    section: 'skills',
    title: 'AI systems and LLM skills',
    summary:
      'LLMs, Transformers, LangChain, LangGraph, RAG, NodeRAG, ComposeRAG, Meta-Thinker, multi-agent systems, tool calling, memory orchestration, and runtime architecture.',
    keywords: ['ai systems', 'llm', 'rag', 'langchain', 'langgraph', 'node rag', 'compose rag', 'meta-thinker', 'multi-agent'],
  },
  {
    id: 'skill-backend',
    section: 'skills',
    title: 'Backend and platform skills',
    summary:
      'Python, FastAPI, Flask, Express, MongoDB, PostgreSQL, Redis, Weaviate, Docker, MCP, and Langfuse.',
    keywords: ['backend', 'platform', 'fastapi', 'flask', 'express', 'mongodb', 'postgresql', 'redis', 'weaviate', 'docker', 'mcp', 'langfuse'],
  },
  {
    id: 'skill-ml',
    section: 'skills',
    title: 'ML and deep learning skills',
    summary:
      'TensorFlow, Keras, Scikit-learn, BERT, Whisper, Faster-Whisper, Torchaudio, and Librosa.',
    keywords: ['ml', 'deep learning', 'tensorflow', 'keras', 'scikit-learn', 'bert', 'whisper', 'faster-whisper', 'torchaudio', 'librosa'],
  },
  {
    id: 'skill-data',
    section: 'skills',
    title: 'Data and applied AI skills',
    summary:
      'Audio processing, ASR systems, retrieval systems, benchmarking, regression testing, and observability.',
    keywords: ['data', 'applied ai', 'audio processing', 'asr systems', 'retrieval systems', 'benchmarking', 'regression testing', 'observability'],
  },
  {
    id: 'skill-additional',
    section: 'skills',
    title: 'Additional skills',
    summary:
      'TypeScript, JavaScript, React Native, Firebase, Redux, Axios, scientific writing, and English B1 Vstep.',
    keywords: ['typescript', 'javascript', 'react native', 'firebase', 'redux', 'axios', 'scientific writing', 'english b1', 'vstep'],
  },
  {
    id: 'education',
    section: 'education',
    title: 'Education',
    summary:
      'Greenwich University, BSc Honours in Computing from 2020 to 2024, First Class Honours, GPA 3.7 out of 4.0, Certificate of Merit, and Best Final Project in Spring 2024.',
    keywords: [
      'education',
      'greenwich university',
      'bsc',
      'computing',
      '2020',
      '2024',
      'gpa 3.7',
      'first class honours',
      'certificate of merit',
      'best final project',
    ],
  },
  {
    id: 'summary',
    section: 'summary',
    title: 'Summary',
    summary:
      'Design production AI systems, not demo-only products. Strong in RAG architecture and multi-agent runtime design. Optimize retrieval, latency, and observability at scale. Own delivery from architecture to deployment to scaling.',
    keywords: ['summary', 'design production ai systems', 'rag architecture', 'multi-agent runtime', 'latency', 'observability', 'scaling'],
  },
  {
    id: 'contact',
    section: 'contact',
    title: 'Contact',
    summary:
      'Location Tan Binh, Ho Chi Minh City, Vietnam. Email daovinhkhang0834@gmail.com. Phone +84 834684568. LinkedIn Dao Vinh Khang.',
    keywords: ['contact', 'email', 'phone', 'linkedin', 'location', 'tan binh', 'ho chi minh city', 'daovinhkhang0834@gmail.com', '+84 834684568'],
  },
];

const ANCHOR_IDS = ANCHOR_GUIDE.map((item) => item.id);
const ANCHOR_TO_SECTION = Object.fromEntries(ANCHOR_GUIDE.map((item) => [item.id, item.section]));
const BROAD_ANCHORS = new Set(['home', 'profile', 'experience', 'whisper-flow', 'projects', 'tech-radar', 'skills', 'education', 'summary', 'contact']);
const ROBOT_EXPRESSIONS = ['idle', 'happy', 'sad', 'surprised'];
const RUNTIME_MODES = ['strict', 'creative'];
const PERSONA_STATES = ['coach', 'reviewer', 'architect', 'recruiter'];
const STYLE_STATES = ['story', 'compare', 'mini-interview', 'challenge', 'business-pitch', 'deep-dive', 'concise'];
const GAME_STATES = ['offer', 'running', 'reveal'];
const DEFAULT_TOUR_PLAN = {
  intro: 'Let me walk you through the portfolio in a simple way.',
  closing: 'That is the guided view. Ask me about any part and I can go deeper.',
  stops: [
  {
    anchorId: 'home',
    controls: { expression: 'happy', followCursor: true },
  },
  {
    anchorId: 'profile',
    controls: { expression: 'idle', followCursor: true },
  },
  {
    anchorId: 'exp-btaskee',
    controls: { expression: 'happy', followCursor: true },
  },
  {
    anchorId: 'exp-erax',
    controls: { expression: 'surprised', followCursor: true },
  },
  {
    anchorId: 'whisper-benchmark',
    controls: { expression: 'surprised', followCursor: true },
  },
  {
    anchorId: 'proj-stock',
    controls: { expression: 'idle', followCursor: true },
  },
  {
    anchorId: 'tech-radar',
    controls: { expression: 'surprised', followCursor: true },
  },
  {
    anchorId: 'skill-backend',
    controls: { expression: 'happy', followCursor: true },
  },
  ],
};

const SITE_MAP_TEXT = ANCHOR_GUIDE.map(
  (item) =>
    `- ${item.id} | section=${item.section} | title=${item.title} | summary=${item.summary} | keywords=${item.keywords.join(', ')}`,
).join('\n');

const CONTACT_ACTIONS = {
  linkedin: {
    type: 'open-link',
    label: 'Open LinkedIn',
    url: 'https://www.linkedin.com/in/dao-vinh-khang-32748023a/',
  },
  gmail: {
    type: 'open-gmail',
    label: 'Open Gmail Compose',
    url: 'https://mail.google.com/mail/?view=cm&fs=1&to=daovinhkhang0834@gmail.com',
  },
};

const PROFILE_CONTEXT = `
You are Khang AI Assistant for Dao Vinh Khang portfolio.

Your job:
- Answer only from the portfolio site map below.
- Keep answers natural and useful.
- Choose deep anchors when possible instead of broad sections.
- Examples of deep anchors: exp-erax, exp-btaskee, proj-stock, whisper-benchmark, tech-radar, education, summary.
- Broad anchors are only for broad requests.

Portfolio site map:
${SITE_MAP_TEXT}

Rules:
- Output MUST be valid JSON only.
- JSON schema (backward-compatible):
  {
    "answer": "concise natural text",
    "targetAnchor": "<anchor-id-or-null>",
    "targetSection": "<section-id-or-null>",
    "controls": {
      "expression": "idle|happy|sad|surprised",
      "followCursor": true|false
    },
    "meta": {
      "mode": "strict|creative",
      "persona": "coach|reviewer|architect|recruiter",
      "style": "story|compare|mini-interview|challenge|business-pitch|deep-dive|concise",
      "missions": [
        {
          "id": "short-id",
          "title": "short title",
          "reason": "short why",
          "targetAnchor": "<anchor-id-or-null>",
          "ctaLabel": "Explore"
        }
      ],
      "game": {
        "type": "guess-strongest-stack",
        "state": "offer|running|reveal",
        "clues": ["...", "...", "..."],
        "expectedAnswer": "optional final answer",
        "revealAnchor": "<anchor-id-or-null>"
      },
      "actions": [
        {
          "type": "open-link|open-gmail",
          "label": "short action label",
          "url": "https://...",
          "autoOpen": false
        }
      ]
    },
    "closing": "optional short text",
    "action": {
      "type": "open-link|open-gmail|null",
      "label": "short action label",
      "url": "https://..."
    },
    "tourStops": [
      {
        "anchorId": "<anchor-id>",
        "controls": {
          "expression": "idle|happy|sad|surprised",
          "followCursor": true|false
        }
      }
    ]
  }
- Valid anchors: ${ANCHOR_IDS.join(', ')}
- Valid sections: ${SECTION_IDS.join(', ')}
- If mode=proactive: give one concise proactive explanation and set targetAnchor and targetSection to null.
- If mode=tour-plan:
  - You are the guide and can choose the flow yourself based on user intent.
  - Give a soft opening line in "answer".
  - Give a soft closing line in "closing".
  - Return 4 to 8 tourStops.
  - Each stop must use a deep anchor when possible, not only broad sections.
  - Do not script full tour narration in tourStops; only route + controls.
  - Set targetAnchor and targetSection to null.
- If mode=tour-step:
  - currentAnchor is the stop being shown right now.
  - "answer" must describe that exact stop.
  - Set targetAnchor and targetSection to null.
  - Do not return action.
  - Do not return tourStops.
- In creative mode:
  - You can vary response style and persona naturally.
  - You may propose up to 2 missions.
  - Mini game is optional and only if relevant.
- For actions:
  - Never auto-open external links.
  - Return actions as buttons via meta.actions with autoOpen=false.
- action is legacy compatibility. If used, keep it consistent with meta.actions.
- If user asks for contact info, use contact.
- If user asks for education, GPA, honours, awards, or university, use education.
- If user asks for summary or strengths, use summary unless another deeper anchor is more specific.
- If user asks about skill map/radar/network/evidence by node, use tech-radar.
`;

function normalizeText(value = '') {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+.%\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeRuntimeMode(value) {
  return RUNTIME_MODES.includes(value) ? value : null;
}

function normalizePersona(value) {
  return PERSONA_STATES.includes(value) ? value : null;
}

function normalizeStyle(value) {
  return STYLE_STATES.includes(value) ? value : null;
}

function normalizeContextHints(hints) {
  if (!hints || typeof hints !== 'object') {
    return null;
  }

  return {
    mode: normalizeRuntimeMode(hints.mode),
    persona: normalizePersona(hints.persona),
    style: normalizeStyle(hints.style),
    activeMissionIds: Array.isArray(hints.activeMissionIds)
      ? hints.activeMissionIds.map((item) => `${item || ''}`.trim()).filter(Boolean).slice(0, 4)
      : [],
    dismissedMissionIds: Array.isArray(hints.dismissedMissionIds)
      ? hints.dismissedMissionIds.map((item) => `${item || ''}`.trim()).filter(Boolean).slice(0, 8)
      : [],
    game:
      hints.game && typeof hints.game === 'object'
        ? {
            type: `${hints.game.type || ''}`.trim(),
            state: `${hints.game.state || ''}`.trim(),
          }
        : null,
  };
}

function detectLanguageMode(message) {
  const raw = `${message || ''}`;
  const normalized = normalizeText(raw);
  const hasVietnameseDiacritics = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệóòỏõọốồổỗộớờởỡợúùủũụứừửữựíìỉĩịýỳỷỹỵ]/i.test(raw);
  const vnHints = /(toi|ban|minh|khong|duoc|nhe|giup|tham|quan|so sanh|ke chuyen|chi tiet|ky nang|du an)/.test(normalized);
  const enHints = /(the|and|with|show|explain|compare|interview|challenge|review|guide)/.test(normalized);

  if ((hasVietnameseDiacritics || vnHints) && enHints) {
    return 'mixed';
  }

  if (hasVietnameseDiacritics || vnHints) {
    return 'vi';
  }

  return 'en';
}
function pickRuntimeMode(message, mode, contextHints) {
  if (mode === 'tour-plan' || mode === 'tour-step') {
    return 'creative';
  }

  if (mode === 'proactive') {
    return 'strict';
  }

  const haystack = normalizeText(message);
  const creativeSignals = [
    'compare',
    'vs',
    'interview',
    'challenge',
    'story',
    'deep dive',
    'business pitch',
    'roleplay',
    'mini game',
    'guess',
    'tour',
    'guide',
    'kể chuyện',
    'so sánh',
    'phỏng vấn',
    'thử thách',
    'đào sâu',
    'chi tiết',
    'persona',
  ];
  const strictSignals = ['email', 'gmail', 'phone', 'contact', 'linkedin', 'gpa', 'award', 'location', 'when'];

  let creativeScore = 0;
  let strictScore = 0;
  creativeSignals.forEach((token) => {
    if (haystack.includes(normalizeText(token))) {
      creativeScore += 2;
    }
  });
  strictSignals.forEach((token) => {
    if (haystack.includes(token)) {
      strictScore += 1.5;
    }
  });

  if (haystack.length > 120) {
    creativeScore += 1;
  }

  if (normalizeRuntimeMode(contextHints?.mode) === 'creative') {
    creativeScore += 0.6;
  }

  return creativeScore > strictScore ? 'creative' : 'strict';
}

function pickPersona(message, runtimeMode, contextHints) {
  const hintedPersona = normalizePersona(contextHints?.persona);
  const haystack = normalizeText(message);
  if (/(recruit|hire|mock interview|job fit|hiring|tuyen dung|phong van)/.test(haystack)) {
    return 'recruiter';
  }
  if (/(review|feedback|audit|critique|nhan xet|danh gia)/.test(haystack)) {
    return 'reviewer';
  }
  if (/(architecture|system design|tradeoff|runtime|kien truc|he thong)/.test(haystack)) {
    return 'architect';
  }
  if (runtimeMode === 'strict') {
    return hintedPersona || 'coach';
  }
  return 'coach';
}

function pickStyle(message, runtimeMode, contextHints) {
  const hintedStyle = normalizeStyle(contextHints?.style);
  const haystack = normalizeText(message);
  if (/(compare|vs|so sanh)/.test(haystack)) return 'compare';
  if (/(interview|phong van)/.test(haystack)) return 'mini-interview';
  if (/(challenge|thu thach|game|quiz|guess)/.test(haystack)) return 'challenge';
  if (/(pitch|business|stakeholder|cto)/.test(haystack)) return 'business-pitch';
  if (/(deep dive|dao sau|chi tiet|in depth)/.test(haystack)) return 'deep-dive';
  if (/(story|ke chuyen|journey)/.test(haystack)) return 'story';
  if (runtimeMode === 'strict') return 'concise';
  return hintedStyle || 'concise';
}

function buildOrchestration({ message, mode, contextHints }) {
  const runtimeMode = pickRuntimeMode(message, mode, contextHints);
  const persona = pickPersona(message, runtimeMode, contextHints);
  const style = pickStyle(message, runtimeMode, contextHints);
  const language = detectLanguageMode(message);

  return {
    runtimeMode,
    persona,
    style,
    language,
  };
}

function normalizePromptCacheRetention(value) {
  return `${value || ''}`.trim() === '24h' ? '24h' : 'in_memory';
}

function normalizeReasoningEffort(value) {
  const normalized = `${value || ''}`.trim().toLowerCase();
  if (normalized === 'minimal') {
    return 'low';
  }
  const allowed = new Set(['none', 'low', 'medium', 'high', 'xhigh']);
  return allowed.has(normalized) ? normalized : 'low';
}

function parseAssistantPayload(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function scoreAnchorMatch(anchor, haystack) {
  if (!haystack) {
    return 0;
  }

  let score = 0;
  const normalizedTitle = normalizeText(anchor.title);
  const normalizedSummary = normalizeText(anchor.summary);

  if (normalizedTitle && haystack.includes(normalizedTitle)) {
    score += 10;
  }

  if (normalizedSummary && haystack.includes(normalizedSummary)) {
    score += 12;
  }

  anchor.keywords.forEach((keyword) => {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) {
      return;
    }

    if (haystack.includes(normalizedKeyword)) {
      score += normalizedKeyword.includes(' ') ? 6 : 4;
    }
  });

  return score;
}

function resolveAnchorFromText(...texts) {
  const haystack = normalizeText(texts.filter(Boolean).join(' '));
  if (!haystack) {
    return null;
  }

  let bestAnchor = null;
  let bestScore = 0;

  ANCHOR_GUIDE.forEach((anchor) => {
    const score = scoreAnchorMatch(anchor, haystack);
    if (score > bestScore) {
      bestScore = score;
      bestAnchor = anchor.id;
    }
  });

  return bestScore > 0 ? bestAnchor : null;
}

function resolveAnchorFromIntent(message) {
  const haystack = normalizeText(message);
  if (!haystack) {
    return null;
  }

  if (/(kinh nghiem|experience|career|work history|professional)/.test(haystack)) return 'exp-btaskee';
  if (/(erax|gtel|odoo|speech to text|stt|asr)/.test(haystack)) return 'exp-erax';
  if (/(whisper|benchmark|cer|wer|ctranslate2)/.test(haystack)) return 'whisper-benchmark';
  if (/(du an|project|tasker|stock|sentiment|publication)/.test(haystack)) return 'proj-tasker';
  if (/(ky nang|skill|stack|tech radar|radar)/.test(haystack)) return 'skill-ai';
  if (/(hoc van|education|gpa|honours|award|university|greenwich)/.test(haystack)) return 'education';
  if (/(lien he|contact|email|gmail|linkedin|phone|sdt|so dien thoai)/.test(haystack)) return 'contact';
  if (/(tom tat|summary|strength)/.test(haystack)) return 'summary';
  return null;
}

function getSectionOverview(section, language) {
  if (section === 'experience') {
    return language === 'en'
      ? 'Khang has experience at bTaskee, EraX to Gtel, FPT IS, and FPT Greenwich, with strong production AI and backend delivery.'
      : 'Khang có kinh nghiệm tại bTaskee, EraX đến Gtel, FPT IS và FPT Greenwich, tập trung mạnh vào AI production và backend.';
  }
  if (section === 'projects') {
    return language === 'en'
      ? 'Key projects include Tasker evolution, Vietnamese ASR, Odoo workflow chatbot, mobile AI models, stock prediction, and sentiment analysis.'
      : 'Các dự án chính gồm Tasker evolution, ASR tiếng Việt, chatbot workflow Odoo, mobile AI models, stock prediction và sentiment analysis.';
  }
  if (section === 'contact') {
    return language === 'en'
      ? 'You can contact Khang via LinkedIn or Gmail in the contact section.'
      : 'Bạn có thể liên hệ Khang qua LinkedIn hoặc Gmail ở mục contact.';
  }
  return language === 'en'
    ? 'I can explain this section in detail. Ask me a specific part and I will guide you there.'
    : 'Mình có thể giải thích chi tiết phần này. Bạn hỏi cụ thể mục nào, mình sẽ dẫn tới đúng chỗ.';
}

function normalizeSection(value) {
  return SECTION_IDS.includes(value) ? value : null;
}

function normalizeAnchor(value) {
  return ANCHOR_IDS.includes(value) ? value : null;
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
    .map((item) => ({
      role: item.role,
      content: item.content.trim(),
    }))
    .filter((item) => item.content)
    .slice(-10);
}

function normalizeRobotControls(controls) {
  const expression = ROBOT_EXPRESSIONS.includes(controls?.expression) ? controls.expression : 'idle';
  return {
    expression,
    followCursor: controls?.followCursor ?? Boolean(controls?.accessory),
  };
}

function normalizeAction(action) {
  if (!action || typeof action !== 'object') {
    return null;
  }

  const type = action.type === 'open-link' || action.type === 'open-gmail' ? action.type : null;
  const url = typeof action.url === 'string' ? action.url.trim() : '';
  if (!type || !url) {
    return null;
  }

  return {
    type,
    label: `${action.label || ''}`.trim() || (type === 'open-gmail' ? 'Open Gmail Compose' : 'Open Link'),
    url,
  };
}

function normalizeMission(mission) {
  if (!mission || typeof mission !== 'object') {
    return null;
  }

  const id = `${mission.id || ''}`.trim();
  const title = `${mission.title || ''}`.trim();
  const reason = `${mission.reason || ''}`.trim();
  const targetAnchor = normalizeAnchor(mission.targetAnchor);
  const ctaLabel = `${mission.ctaLabel || ''}`.trim() || 'Explore';
  if (!id || !title) {
    return null;
  }

  return {
    id,
    title,
    reason: reason || '',
    targetAnchor: targetAnchor || null,
    ctaLabel,
  };
}

function normalizeGame(game) {
  if (!game || typeof game !== 'object') {
    return null;
  }

  const type = `${game.type || ''}`.trim();
  if (type !== 'guess-strongest-stack') {
    return null;
  }

  const state = GAME_STATES.includes(game.state) ? game.state : 'offer';
  const clues = Array.isArray(game.clues) ? game.clues.map((item) => `${item || ''}`.trim()).filter(Boolean).slice(0, 3) : [];
  const expectedAnswer = `${game.expectedAnswer || ''}`.trim();
  const revealAnchor = normalizeAnchor(game.revealAnchor);

  return {
    type,
    state,
    clues,
    expectedAnswer: expectedAnswer || null,
    revealAnchor: revealAnchor || null,
  };
}

function normalizeMetaActions(actions) {
  if (!Array.isArray(actions)) {
    return [];
  }

  const seen = new Set();
  return actions
    .map((action) => normalizeAction(action))
    .filter((action) => {
      if (!action) {
        return false;
      }

      const key = `${action.type}::${action.url}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .map((action) => ({
      ...action,
      autoOpen: false,
    }))
    .slice(0, 3);
}

function normalizeMeta(meta, orchestration) {
  const mode = normalizeRuntimeMode(meta?.mode) || orchestration.runtimeMode;
  const persona = normalizePersona(meta?.persona) || orchestration.persona;
  const style = normalizeStyle(meta?.style) || orchestration.style;
  const missions = Array.isArray(meta?.missions) ? meta.missions.map((mission) => normalizeMission(mission)).filter(Boolean).slice(0, 2) : [];
  const game = normalizeGame(meta?.game);
  const actions = normalizeMetaActions(meta?.actions);

  return {
    mode,
    persona,
    style,
    missions,
    game,
    actions,
  };
}

function shouldAllowGame({ runtimeMode, message, contextHints, game, mode, style }) {
  if (!game) {
    return false;
  }

  const normalizedMessage = normalizeText(message);
  const gameIntent = /(game|guess|quiz|challenge|play|mini game|thu thach|doan|tro choi)/.test(normalizedMessage);
  const wasRunning = `${contextHints?.game?.state || ''}`.trim() === 'running';
  const wasOffered = `${contextHints?.game?.state || ''}`.trim() === 'offer';

  if (wasRunning) {
    return true;
  }

  if (mode !== 'chat') {
    return false;
  }

  if (runtimeMode !== 'creative') {
    return false;
  }

  if (gameIntent) {
    return true;
  }

  if (style === 'challenge' && game.state === 'offer' && !wasOffered) {
    return true;
  }

  return false;
}

function shouldAllowMissions({ runtimeMode, mode }) {
  return runtimeMode === 'creative' && mode === 'chat';
}

function resolveActionFromText(...texts) {
  const haystack = normalizeText(texts.filter(Boolean).join(' '));
  if (!haystack) {
    return null;
  }

  if (
    /(linkedin|linkedln|linked in|lien he linkedin|contact linkedin|open linkedin|mo linkedin)/.test(haystack)
  ) {
    return CONTACT_ACTIONS.linkedin;
  }

  if (
    /(gmail|email|e mail|mail|send mail|send email|contact email|lien he gmail|lien he email|mo gmail)/.test(haystack)
  ) {
    return CONTACT_ACTIONS.gmail;
  }

  return null;
}

function mergeActionList(...actionLists) {
  const seen = new Set();
  const merged = [];
  actionLists.flat().forEach((action) => {
    const normalized = normalizeAction(action);
    if (!normalized) {
      return;
    }

    const key = `${normalized.type}::${normalized.url}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    merged.push({
      ...normalized,
      autoOpen: false,
    });
  });

  return merged.slice(0, 3);
}

function normalizeTourPlan(payload) {
  const normalizedStops = Array.isArray(payload?.tourStops)
    ? payload.tourStops
        .map((stop) => {
          const anchorId = normalizeAnchor(stop?.anchorId);
          if (!anchorId) {
            return null;
          }

          return {
            anchorId,
            controls: normalizeRobotControls(stop?.controls),
          };
        })
        .filter(Boolean)
        .slice(0, 8)
    : [];

  if (normalizedStops.length < 3) {
    return DEFAULT_TOUR_PLAN;
  }

  return {
    intro: `${payload?.answer || ''}`.trim() || DEFAULT_TOUR_PLAN.intro,
    closing: `${payload?.closing || ''}`.trim() || DEFAULT_TOUR_PLAN.closing,
    stops: normalizedStops,
  };
}

export const handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const userMessage = `${body.message || ''}`.trim();
    const section = `${body.section || 'home'}`.trim();
    const anchor = `${body.anchor || section || 'home'}`.trim();
    const mode = `${body.mode || 'chat'}`.trim();
    const history = normalizeHistory(body.history);
    const contextHints = normalizeContextHints(body.contextHints);

    if (!userMessage) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'message is required' }),
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL || 'http://159.65.130.71/v1';
    const model = process.env.OPENAI_MODEL || 'ag/gemini-3.1-pro-low';
    const maxTokens = Math.max(120, Number(process.env.OPENAI_MAX_TOKENS || process.env.OPENAI_MAX_COMPLETION_TOKENS || 5000));

    if (!apiKey) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing OPENAI_API_KEY' }),
      };
    }

    const conversationHistory =
      mode === 'chat'
        ? history.map((item) => ({
            role: item.role,
            content: item.content,
          }))
        : [];

    const orchestration = buildOrchestration({
      message: userMessage,
      mode,
      contextHints,
    });
    const orchestrationBrief = [
      `runtimeMode=${orchestration.runtimeMode}`,
      `persona=${orchestration.persona}`,
      `style=${orchestration.style}`,
      `language=${orchestration.language}`,
    ].join('; ');
    const requestTimeoutMs = Math.max(10000, Math.min(26000, Number(process.env.OPENAI_TIMEOUT_MS || 22000)));
    const client = new OpenAI({
      apiKey,
      baseURL: baseUrl,
      timeout: requestTimeoutMs,
    });

    let data;
    try {
      data = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: PROFILE_CONTEXT,
          },
          ...conversationHistory,
          {
            role: 'user',
            content: [
              `mode=${mode}; currentSection=${section}; currentAnchor=${anchor}; userMessage=${userMessage}`,
              `orchestration=${orchestrationBrief}`,
              `contextHints=${JSON.stringify(contextHints || {})}`,
              'Language policy: if language=vi answer mostly Vietnamese; if language=en answer mostly English; if language=mixed use natural mix.',
            ].join('\n'),
          },
        ],
        max_tokens: maxTokens,
      });
    } catch (error) {
      if (error?.status) {
        return {
          statusCode: error.status,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Upstream API error',
            detail: `${error.message || error}`.slice(0, 600),
          }),
        };
      }

      if (error?.name === 'AbortError' || /timeout/i.test(`${error?.message || ''}`)) {
        return {
          statusCode: 504,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Assistant upstream timeout' }),
        };
      }

      throw error;
    }

    const content = data?.choices?.[0]?.message?.content || '';
    const parsed = parseAssistantPayload(content);
    const usage = data?.usage || {};
    const promptTokenDetails = usage?.prompt_tokens_details || {};
    const cachedTokens = Number(promptTokenDetails?.cached_tokens || 0);
    const promptTokens = Number(usage?.prompt_tokens || 0);
    const completionTokens = Number(usage?.completion_tokens || 0);
    const totalTokens = Number(usage?.total_tokens || 0);

    const aiAnchor = normalizeAnchor(parsed?.targetAnchor);
    const aiSection = normalizeSection(parsed?.targetSection);
    const controls = normalizeRobotControls(parsed?.controls);
    const aiAction = normalizeAction(parsed?.action);
    const meta = normalizeMeta(parsed?.meta, orchestration);
    const tourPlan = mode === 'tour-plan' ? normalizeTourPlan(parsed) : null;
    const keywordAnchor = resolveAnchorFromText(userMessage, parsed?.answer);
    const intentAnchor = resolveAnchorFromIntent(userMessage);

    let targetAnchor = aiAnchor;
    if (!targetAnchor || BROAD_ANCHORS.has(targetAnchor)) {
      targetAnchor = keywordAnchor || intentAnchor || targetAnchor;
    }
    if (!targetAnchor) {
      targetAnchor = normalizeAnchor(anchor) || ANCHOR_GUIDE.find((item) => item.section === section)?.id || 'home';
    }

    const targetSection = normalizeSection(aiSection || ANCHOR_TO_SECTION[targetAnchor] || null);
    const anchorSummary = ANCHOR_GUIDE.find((item) => item.id === targetAnchor)?.summary || '';
    const answer =
      `${parsed?.answer || ''}`.trim() ||
      `${anchorSummary}`.trim() ||
      getSectionOverview(targetSection || section, orchestration.language);
    const keywordAction = resolveActionFromText(userMessage, answer);
    const actionList = mergeActionList(meta.actions, [keywordAction, aiAction]);
    const action = actionList.length ? { type: actionList[0].type, label: actionList[0].label, url: actionList[0].url } : null;
    const missions = shouldAllowMissions({ runtimeMode: orchestration.runtimeMode, mode }) ? meta.missions : [];
    const game = shouldAllowGame({
      runtimeMode: orchestration.runtimeMode,
      message: userMessage,
      contextHints,
      game: meta.game,
      mode,
      style: orchestration.style,
    })
      ? meta.game
      : null;
    const responseMeta = {
      ...meta,
      missions,
      game,
      actions: actionList,
      cache: {
        baseUrl,
        model,
        maxTokens,
        cachedTokens,
        promptTokens,
        completionTokens,
        totalTokens,
        cacheHitRate: promptTokens > 0 ? Number((cachedTokens / promptTokens).toFixed(4)) : 0,
      },
    };

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answer,
        targetAnchor: normalizeAnchor(targetAnchor),
        targetSection,
        controls,
        closing: tourPlan?.closing || null,
        action,
        tourStops: tourPlan?.stops || [],
        meta: responseMeta,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error', detail: `${error}` }),
    };
  }
};

