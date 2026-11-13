/**
 * Unified read-only portfolio & CV knowledge corpus.
 *
 * Combines live objects from src/content.js with verified details from
 * Dao_Vinh_Khang_AI_Engineer_CV.pdf so both `search_site` and the isolated
 * sandbox worker see accurate, non-hallucinated facts.
 */

import {
  CAPABILITIES,
  CREDENTIALS,
  EDUCATION_INFO,
  EXPERIENCES,
  METHOD,
  PROFILE,
  PUBLICATION,
  STATS,
  SYSTEMS,
} from '../content.js';
import { LINKS } from './tools.js';

export { PUBLICATION, EDUCATION_INFO as EDUCATION };
const EDUCATION = EDUCATION_INFO;

export const EXTRA_FACTS = {
  fullName: 'Dao Vinh Khang',
  role: 'AI & Backend Engineer',
  location: 'Ho Chi Minh City, Vietnam',
  languages: ['English (B1 VSTEP, Professional Working Proficiency)', 'Vietnamese (Native)'],
  openTo: 'Production AI / Backend roles and serious product collaborations',
  kamiProGithub: 'https://github.com/daovinhkhang/Kami-Agent-Odoo-v2',
  eraxExtra: [
    'LangChain autonomous agent integrated with Odoo ERP and a universal workflow orchestration engine across multiple departments',
    'Fine-tuned Whisper Medium on ~245,000 multi-regional audio samples (~870h) via Vast.ai GPUs (CER 0.066 / WER 0.107, ~60% error reduction)',
    'Accelerated serving with Faster-Whisper & CTranslate2 on NVIDIA RTX 3090 (~30% latency reduction) + 6 TFLite on-device models (noise reduction, emotion, NER)',
  ],
  taskerExtra: [
    'Dual Agent Fleet across 4 markets (VN, TH, ID, MY): BeeTa (Tasker onboarding & live operations) and Kai (omnichannel customer support across Mobile, TikTok DM, Zalo, LINE)',
    'V5.0 deterministic TURN_FACTS evidence gates for account states (ACTIVE/LOCKED) and action receipts eliminating free-form LLM hallucinations',
    'AI Mart ClickHouse-to-MongoDB sync pipeline feeding 6 context slots (identity, risk, capacity, behavior, growth, history) via 2,200-char budget-capped prompts with hash-stable cohorts and kill-switches',
    'Long-term in-process memory & conversation compaction compressing dialogue into source-grounded checkpoints preserving entity IDs and temporal constraints',
    'Mobile Socket.IO token streaming, Agent Lab isolated simulator, and automated golden-trace E2E benchmark gates for canary rollouts',
  ],
};

/** Deep-frozen JSON snapshot safe to pass into Web Workers via structured clone. */
export const PORTFOLIO_DATA = {
  person: {
    name: EXTRA_FACTS.fullName,
    role: EXTRA_FACTS.role,
    location: EXTRA_FACTS.location,
    languages: EXTRA_FACTS.languages,
    openTo: EXTRA_FACTS.openTo,
    profile: [...PROFILE],
    education: EDUCATION,
    publication: PUBLICATION,
    links: {
      ...LINKS,
      kamiProGithub: EXTRA_FACTS.kamiProGithub,
      kamiCommunityGithub: 'https://github.com/daovinhkhang/kami-odoo-agent',
      kamiMedusaGithub: 'https://github.com/daovinhkhang/kami-agents',
    },
  },
  stats: STATS.map((s) => ({ ...s })),
  systems: SYSTEMS.map((s) => ({
    id: s.id,
    year: s.year,
    name: s.name,
    short: s.short,
    tag: s.tag,
    badge: s.badge,
    summary: s.summary,
    points: [...(s.points || [])],
    stack: [...(s.stack || [])],
    link: s.link ? { ...s.link } : null,
    github:
      s.id === 'kami-pro'
        ? EXTRA_FACTS.kamiProGithub
        : s.link?.href?.includes('github.com')
          ? s.link.href
          : null,
    videoCount: (s.videos || []).length,
    screenshotCount: (s.images || []).length,
  })),
  experiences: EXPERIENCES.map((e) => ({
    id: e.id,
    company: e.company,
    role: e.role,
    time: e.time,
    bullets: [...e.bullets],
    stack: [...e.stack],
  })),
  capabilities: CAPABILITIES.map((c) => ({
    num: c.num,
    title: c.title,
    items: [...c.items],
  })),
  method: METHOD.map((m) => ({ ...m })),
  credentials: CREDENTIALS.map((c) => ({ ...c })),
};

const stripAccents = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

function tokenize(query) {
  return stripAccents(query)
    .split(/[^a-z0-9.+_-]+/)
    .filter((t) => t.length >= 2);
}

function buildSearchRecords() {
  const docs = [];

  for (const s of PORTFOLIO_DATA.systems) {
    docs.push({
      kind: 'system',
      id: s.id,
      ref: { tool: 'show_system', args: { system: s.id } },
      title: `${s.name} (${s.year})`,
      text: [s.name, s.short, s.tag, s.badge, s.summary, ...s.points, ...s.stack, s.link?.href || '', s.github || ''].join(' '),
      snippet: `${s.summary} Stack: ${s.stack.join(', ')}.`,
    });
  }

  for (const e of PORTFOLIO_DATA.experiences) {
    docs.push({
      kind: 'experience',
      id: e.id,
      ref: { tool: 'open_experience', args: { company: e.id } },
      title: `${e.company} — ${e.role} (${e.time})`,
      text: [e.company, e.role, e.time, ...e.bullets, ...e.stack].join(' '),
      snippet: e.bullets.join(' '),
    });
  }

  for (const c of PORTFOLIO_DATA.capabilities) {
    docs.push({
      kind: 'capability',
      id: c.num,
      ref: { tool: 'navigate', args: { to: 'capabilities' } },
      title: `Capabilities ${c.num}: ${c.title}`,
      text: [c.title, ...c.items].join(' '),
      snippet: c.items.join(' · '),
    });
  }

  docs.push({
    kind: 'publication',
    id: PUBLICATION.id,
    ref: { tool: 'navigate', args: { to: 'publication' } },
    title: `${PUBLICATION.venue}: ${PUBLICATION.title}`,
    text: [PUBLICATION.title, PUBLICATION.venue, PUBLICATION.year, PUBLICATION.paperNo, PUBLICATION.authors, PUBLICATION.href, PUBLICATION.summary].join(' '),
    snippet: `Paper No. ${PUBLICATION.paperNo} (${PUBLICATION.year}): ${PUBLICATION.title}. ${PUBLICATION.summary}`,
  });

  docs.push({
    kind: 'education',
    id: 'greenwich-degree',
    ref: { tool: 'navigate', args: { to: 'education' } },
    title: `${EDUCATION.school} — ${EDUCATION.degree}`,
    text: [EDUCATION.school, EDUCATION.location, EDUCATION.degree, EDUCATION.period, EDUCATION.honours, EDUCATION.gpa, ...EDUCATION.awards, ...EXTRA_FACTS.languages].join(' '),
    snippet: `${EDUCATION.degree} (${EDUCATION.period}), GPA ${EDUCATION.gpa}. Awards: ${EDUCATION.awards.join(', ')}. Languages: ${EXTRA_FACTS.languages.join(', ')}.`,
  });

  docs.push({
    kind: 'role-details',
    id: 'cv-highlights',
    ref: { tool: 'open_experience', args: { company: 'btaskee' } },
    title: 'Dual Agent Fleet (BeeTa & Kai), TURN_FACTS, AI Mart & Agent Lab',
    text: [...EXTRA_FACTS.taskerExtra, ...EXTRA_FACTS.eraxExtra].join(' '),
    snippet: [...EXTRA_FACTS.taskerExtra.slice(0, 3), EXTRA_FACTS.eraxExtra[1]].join(' · '),
  });

  docs.push({
    kind: 'stats',
    id: 'headline-stats',
    ref: { tool: 'navigate', args: { to: 'stats' } },
    title: 'Headline Metrics',
    text: PORTFOLIO_DATA.stats.map((s) => `${s.value} ${s.label}`).join(' '),
    snippet: PORTFOLIO_DATA.stats.map((s) => `${s.value}: ${s.label}`).join(' · '),
  });

  docs.push({
    kind: 'contact',
    id: 'contact-info',
    ref: { tool: 'navigate', args: { to: 'contact' } },
    title: 'Contact & Links',
    text: `${EXTRA_FACTS.fullName} ${EXTRA_FACTS.location} email phone linkedin github odoo ${Object.values(PORTFOLIO_DATA.person.links).join(' ')}`,
    snippet: `Email: ${LINKS.email.slice(7)} · Phone: +84 834 684 568 · Location: ${EXTRA_FACTS.location}`,
  });

  return docs;
}

const RECORDS = buildSearchRecords();

/** Free-text search over systems, experiences, CV facts, publication and links. */
export function searchPortfolio(query, limit = 5) {
  const raw = stripAccents(query);
  const tokens = tokenize(query);
  if (!tokens.length) return [];

  const scored = RECORDS.map((doc) => {
    const hay = stripAccents(doc.text);
    const titleHay = stripAccents(doc.title);
    let score = 0;
    if (hay.includes(raw) && raw.length >= 3) score += 5;
    for (const t of tokens) {
      if (titleHay.includes(t)) score += 3;
      if (hay.includes(t)) score += t.length >= 4 ? 2 : 1;
    }
    return { ...doc, score };
  })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ kind, id, title, snippet, score, ref }) => ({
    kind,
    id,
    title,
    snippet: snippet.slice(0, 480),
    score,
    ref,
  }));
}
