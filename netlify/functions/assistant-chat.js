const SECTION_IDS = ['home', 'profile', 'experience', 'whisper-flow', 'projects', 'skills', 'education', 'summary', 'contact'];

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
const BROAD_ANCHORS = new Set(['home', 'profile', 'experience', 'whisper-flow', 'projects', 'skills', 'education', 'summary', 'contact']);
const ROBOT_EXPRESSIONS = ['idle', 'happy', 'sad', 'surprised'];
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
- Keep answers natural, concise, and easy to read.
- When the user asks about a specific company, project, metric, skill group, education item, summary item, or Whisper benchmark, choose the deepest relevant anchor instead of a broad section.
- Examples of precise anchors: exp-erax, exp-btaskee, proj-stock, whisper-benchmark, education, summary.
- Use broad anchors only for broad requests like "show profile", "show projects", or "show contact".

Portfolio site map:
${SITE_MAP_TEXT}

Rules:
- Output MUST be valid JSON only.
- JSON schema:
  {
    "answer": "concise natural text",
    "targetAnchor": "<anchor-id-or-null>",
    "targetSection": "<section-id-or-null>",
    "controls": {
      "expression": "idle|happy|sad|surprised",
      "followCursor": true|false
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
- If mode=proactive: give one short proactive explanation for the current anchor and set targetAnchor and targetSection to null.
- If mode=proactive: give one concise proactive explanation for the current anchor, usually one sentence, and set targetAnchor and targetSection to null.
- If mode=tour-plan:
  - You are the guide and can choose the flow yourself.
  - Give a soft opening line in "answer", usually one or two short sentences.
  - Give a soft closing line in "closing".
  - Return 4 to 8 tourStops.
  - Each stop must use a deep anchor when possible, not only broad sections.
  - Do not script the tour text inside tourStops. Only choose the route and controls for each stop.
  - Set targetAnchor and targetSection to null.
- If mode=tour-step:
  - currentAnchor is the stop being shown right now.
  - "answer" must be a natural guided line about that exact stop, usually one or two short sentences.
  - Set targetAnchor and targetSection to null.
  - Do not return action.
  - Do not return tourStops.
- Use action only when the user clearly wants to open LinkedIn or start an email.
- For LinkedIn, use the exact portfolio LinkedIn URL.
- For email or Gmail requests, use Gmail compose with the portfolio email prefilled.
- You are controlling a Rive catbot. Choose controls on every response.
- Use expression=happy for positive/helpful replies, surprised for discovery/attention, sad for warnings/errors, idle for neutral.
- followCursor should usually be true for friendly/engaged moments and false for more serious error states.
- If the user asks for contact info, use contact.
- If the user asks for education, GPA, honours, awards, or university, use education.
- If the user asks for summary or strengths, use summary unless another deeper anchor is more specific.
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
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
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

    if (!userMessage) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'message is required' }),
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://qwenapi.sbs/v1';
    const model = process.env.OPENAI_MODEL || 'qwen3.6-plus';

    if (!apiKey) {
      return {
        statusCode: 500,
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);

    let response;
    try {
      response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          temperature: 0.25,
          enable_thinking: false,
          messages: [
            {
              role: 'system',
              content: PROFILE_CONTEXT,
            },
            ...conversationHistory,
            {
              role: 'user',
              content: `mode=${mode}; currentSection=${section}; currentAnchor=${anchor}; userMessage=${userMessage}`,
            },
          ],
        }),
      });
    } catch (error) {
      if (error?.name === 'AbortError') {
        return {
          statusCode: 504,
          body: JSON.stringify({ error: 'Assistant upstream timeout' }),
        };
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Upstream API error', detail: errorText.slice(0, 600) }),
      };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    const parsed = parseAssistantPayload(content);

    const answer = `${parsed?.answer || 'Hello from Khang AI Assistant.'}`.trim();
    const aiAnchor = normalizeAnchor(parsed?.targetAnchor);
    const aiSection = normalizeSection(parsed?.targetSection);
    const controls = normalizeRobotControls(parsed?.controls);
    const aiAction = normalizeAction(parsed?.action);
    const tourPlan = mode === 'tour-plan' ? normalizeTourPlan(parsed) : null;
    const keywordAnchor = resolveAnchorFromText(userMessage, answer);
    const keywordAction = resolveActionFromText(userMessage, answer);

    let targetAnchor = aiAnchor;
    if (!targetAnchor || BROAD_ANCHORS.has(targetAnchor)) {
      targetAnchor = keywordAnchor || targetAnchor;
    }

    const targetSection = normalizeSection(aiSection || ANCHOR_TO_SECTION[targetAnchor] || null);
    const action = keywordAction || aiAction;

    return {
      statusCode: 200,
      headers: {
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
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', detail: `${error}` }),
    };
  }
};
