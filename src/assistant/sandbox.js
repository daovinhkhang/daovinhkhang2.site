/**
 * Isolated Web Worker sandbox for agent-authored JavaScript tools and one-off code.
 *
 * Security model:
 * - Never executes on the main thread (no `window`, `document`, `localStorage`, cookies).
 * - Inside the worker, network & host APIs (`fetch`, `XMLHttpRequest`, `WebSocket`,
 *   `EventSource`, `importScripts`, `indexedDB`, `caches`, `BroadcastChannel`,
 *   `Worker`, `SharedWorker`, `navigator`) are shadowed before running user code.
 * - Enforces a hard execution timeout (`worker.terminate()`), preventing infinite loops.
 * - Page interaction happens strictly via declarative queued intents (`ctx.queueAction`)
 *   which the host validates through `validateCall()` in tools.js.
 */

import { PORTFOLIO_DATA } from './corpus.js';

const DEFAULT_TIMEOUT_MS = 1500;
const MAX_LOGS = 30;
const MAX_ACTIONS = 6;

const WORKER_BOOTSTRAP = `'use strict';

// Lock down network, storage, and worker-spawning APIs before running code.
const BLOCKED_APIS = [
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'importScripts',
  'indexedDB',
  'caches',
  'BroadcastChannel',
  'SharedWorker',
  'Worker',
  'open',
  'close',
  'navigator',
];

for (const api of BLOCKED_APIS) {
  try {
    Object.defineProperty(self, api, {
      configurable: false,
      enumerable: false,
      get() {
        throw new Error('Blocked by KAMI Sandbox Policy: "' + api + '" is disabled inside the sandbox.');
      },
    });
  } catch {
    try {
      self[api] = undefined;
    } catch {
      /* ignore non-configurable host properties */
    }
  }
}

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

function deepFreeze(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    deepFreeze(obj[key]);
  }
  return obj;
}

function stripAccents(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .toLowerCase();
}

function safeJson(value, depth = 0) {
  if (depth > 8) return '[max-depth]';
  if (value === null || value === undefined) return value;
  const t = typeof value;
  if (t === 'string') return value.length > 4000 ? value.slice(0, 4000) + '…' : value;
  if (t === 'number') return Number.isFinite(value) ? value : String(value);
  if (t === 'boolean') return value;
  if (t === 'function') return '[Function]';
  if (Array.isArray(value)) return value.slice(0, 60).map((item) => safeJson(item, depth + 1));
  if (t === 'object') {
    const out = {};
    for (const k of Object.keys(value).slice(0, 40)) {
      out[k] = safeJson(value[k], depth + 1);
    }
    return out;
  }
  return String(value);
}

self.onmessage = async (event) => {
  const { id, code, input, data, pageState } = event.data || {};
  const started = performance.now();
  const logs = [];
  const queuedActions = [];
  let lastArtifact = null;

  const pushLog = (...args) => {
    if (logs.length >= ${MAX_LOGS}) return;
    const text = args
      .map((a) => (typeof a === 'string' ? a : JSON.stringify(safeJson(a))))
      .join(' ')
      .slice(0, 400);
    logs.push(text);
  };

  const sandboxConsole = {
    log: pushLog,
    info: pushLog,
    warn: pushLog,
    error: pushLog,
  };

  const DATA = deepFreeze({
    ...data,
    pageState: pageState || {},
  });

  const search = (query) => {
    const tokens = stripAccents(query)
      .split(/[^a-z0-9.+_-]+/)
      .filter((t) => t.length >= 2);
    if (!tokens.length) return [];
    const pool = [
      ...DATA.systems.map((s) => ({ kind: 'system', id: s.id, title: s.name, raw: JSON.stringify(s), item: s })),
      ...DATA.experiences.map((e) => ({ kind: 'experience', id: e.id, title: e.company + ' - ' + e.role, raw: JSON.stringify(e), item: e })),
      ...DATA.capabilities.map((c) => ({ kind: 'capability', id: c.num, title: c.title, raw: JSON.stringify(c), item: c })),
      { kind: 'publication', id: DATA.person.publication.id, title: DATA.person.publication.title, raw: JSON.stringify(DATA.person.publication), item: DATA.person.publication },
      { kind: 'education', id: 'education', title: DATA.person.education.school, raw: JSON.stringify(DATA.person.education), item: DATA.person.education },
    ];
    return pool
      .map((entry) => {
        const hay = stripAccents(entry.raw);
        let score = 0;
        for (const t of tokens) {
          if (hay.includes(t)) score += t.length >= 4 ? 2 : 1;
        }
        return { kind: entry.kind, id: entry.id, title: entry.title, score, item: entry.item };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
  };

  const emitArtifact = (art) => {
    lastArtifact = safeJson(art);
    return lastArtifact;
  };

  const queueAction = (tool, args = {}) => {
    if (queuedActions.length >= ${MAX_ACTIONS}) return false;
    queuedActions.push({ tool: String(tool || ''), args: safeJson(args) });
    return true;
  };

  const matchJD = (jdText) => {
    const raw = stripAccents(jdText || '');
    const groups = [
      { label: 'LLM Agents & Orchestration', terms: ['agent', 'llm', 'langgraph', 'langchain', 'multi-agent', 'tool calling', 'mcp', 'turn_facts', 'compaction'], evidence: 'KAMI Pro/Community/Medusa; BeeTa & Kai Dual Fleet (LangGraph + TaskerV5Runtime + TURN_FACTS)' },
      { label: 'RAG & Retrieval', terms: ['rag', 'retrieval', 'vector', 'weaviate', 'embedding', 'knowledge', 'graphrag', 'noderag', 'composerag'], evidence: 'NodeRAG, ComposeRAG, GraphRAG, Meta-Thinker (~30s -> <5s, ~6x); Weaviate & Redis' },
      { label: 'Python & Backend', terms: ['python', 'fastapi', 'flask', 'backend', 'api', 'async', 'docker', 'ci/cd', 'linux', 'websocket', 'socket'], evidence: 'Python (FastAPI, Flask), Node.js, WebSockets, Socket.IO, Docker, CI/CD at bTaskee & EraX' },
      { label: 'Odoo / ERP & Commerce', terms: ['odoo', 'erp', 'owl', 'medusa', 'ecommerce', 'commerce'], evidence: 'KAMI AI Agent Pro (Odoo 17-19 Apps Store), Community (Odoo 19), Medusa 2.0 (25+ tools)' },
      { label: 'Data & Observability', terms: ['clickhouse', 'mongodb', 'postgres', 'postgresql', 'redis', 'langfuse', 'eval', 'telemetry', 'agent lab'], evidence: 'ClickHouse-to-MongoDB sync, PostgreSQL, Redis, Langfuse, Agent Lab & golden-trace E2E gates' },
      { label: 'Speech / ML / Deep Learning', terms: ['whisper', 'asr', 'stt', 'speech', 'tensorflow', 'tflite', 'pytorch', 'huggingface', 'quantization', 'lstm', 'transformer', 'forecasting'], evidence: 'Vietnamese Whisper ASR (CER 0.066 / WER 0.107, CTranslate2), 6 TFLite models, SSRN Paper #5023739 (LSTM-GRU vs Transformer-GRU)' },
      { label: 'TypeScript / Omnichannel', terms: ['typescript', 'javascript', 'node', 'nodejs', 'express', 'telegram', 'zalo', 'tiktok', 'line', 'discord', 'slack'], evidence: 'TypeScript, Node.js/Express (Medusa + Discord/Slack/Telegram gateways), Kai (Mobile/TikTok/Zalo/LINE)' },
    ];
    const matched = [];
    const gaps = [];
    const rows = [];
    let hits = 0;
    let totalTerms = 0;
    for (const g of groups) {
      const found = g.terms.filter((t) => raw.includes(t));
      if (found.length) {
        hits += 1;
        totalTerms += found.length;
        matched.push(g.label + ': ' + found.join(', '));
        rows.push([g.label, found.join(', '), g.evidence]);
      } else if (raw.length > 12) {
        gaps.push(g.label + ' (not emphasized in JD)');
      }
    }
    const score = !raw.trim() ? 0 : Math.min(98, Math.max(40, Math.round(55 + hits * 7 + Math.min(18, totalTerms * 2))));
    return {
      score,
      matched,
      gaps,
      columns: ['Area', 'JD Signals', 'Khang Evidence'],
      rows,
    };
  };

  const helpers = {
    search,
    matchJD,
    sum: (arr) => (Array.isArray(arr) ? arr.reduce((a, b) => a + (Number(b) || 0), 0) : 0),
    avg: (arr) => (Array.isArray(arr) && arr.length ? arr.reduce((a, b) => a + (Number(b) || 0), 0) / arr.length : 0),
    uniq: (arr) => (Array.isArray(arr) ? [...new Set(arr)] : []),
    card: (spec) => emitArtifact({ kind: 'card', ...spec }),
    table: (spec) => emitArtifact({ kind: 'table', ...spec }),
    comparison: (spec) => emitArtifact({ kind: 'comparison', ...spec }),
    jdMatch: (spec) => emitArtifact({ kind: 'jd_match', ...spec }),
    metrics: (spec) => emitArtifact({ kind: 'metrics', ...spec }),
    timeline: (spec) => emitArtifact({ kind: 'timeline', ...spec }),
    architecture: (spec) => emitArtifact({ kind: 'architecture', ...spec }),
    artifact: (spec) => emitArtifact(spec),
    queueAction,
    showSystem: (system, say) => queueAction('show_system', { system, say }),
    openExperience: (company, say) => queueAction('open_experience', { company, say }),
    navigate: (to, say) => queueAction('navigate', { to, say }),
    pointAt: (target, note) => queueAction('point_at', { target, note }),
    playDemo: (system, say) => queueAction('play_demo', { system, say }),
    fillContact: (spec) => queueAction('fill_contact', spec),
    log: pushLog,
  };

  const ctx = { DATA, ...helpers };

  try {
    const trimmed = String(code || '').trim();
    const wrapped = trimmed + '\\n;if (typeof run === "function") return await run(input, DATA, ctx);';
    const fn = new AsyncFunction('input', 'DATA', 'ctx', 'helpers', 'console', wrapped);
    let result = await fn(safeJson(input || {}), DATA, ctx, helpers, sandboxConsole);
    if (typeof result === 'function') {
      result = await result(safeJson(input || {}), DATA, ctx);
    }

    // Allow code to return { result, artifact } or a direct artifact object.
    let artifact = lastArtifact;
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      if (result.artifact && typeof result.artifact === 'object') {
        artifact = safeJson(result.artifact);
      } else if (!artifact && typeof result.kind === 'string' && typeof result.title === 'string') {
        artifact = safeJson(result);
      }
    }

    const durationMs = Math.max(1, Math.round(performance.now() - started));
    self.postMessage({
      id,
      ok: true,
      result: safeJson(result),
      artifact,
      logs,
      queuedActions,
      durationMs,
    });
  } catch (err) {
    const durationMs = Math.max(1, Math.round(performance.now() - started));
    self.postMessage({
      id,
      ok: false,
      error: String(err && err.message ? err.message : err).slice(0, 400),
      logs,
      queuedActions: [],
      durationMs,
    });
  }
};
`;

/**
 * Compile and execute untrusted/agent-written JS inside a throwaway Web Worker.
 * Guaranteed not to touch window, DOM, cookies, localStorage, or network.
 */
export function runInSandbox({ code, input = {}, pageState = {}, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  if (typeof Worker === 'undefined' || typeof Blob === 'undefined') {
    return Promise.resolve({
      ok: false,
      error: 'Web Worker sandbox is unavailable in this environment.',
      logs: [],
      queuedActions: [],
      durationMs: 0,
    });
  }

  const cleanCode = String(code || '').trim();
  if (!cleanCode) {
    return Promise.resolve({
      ok: false,
      error: 'Empty code.',
      logs: [],
      queuedActions: [],
      durationMs: 0,
    });
  }

  return new Promise((resolve) => {
    const blob = new Blob([WORKER_BOOTSTRAP], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    let worker;
    let settled = false;

    const finish = (payload) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        worker?.terminate();
      } catch {
        /* ignore */
      }
      URL.revokeObjectURL(url);
      resolve(payload);
    };

    const timer = setTimeout(() => {
      finish({
        ok: false,
        error: `Sandbox timeout: execution exceeded ${timeoutMs}ms and was terminated.`,
        logs: [],
        queuedActions: [],
        durationMs: timeoutMs,
      });
    }, timeoutMs);

    try {
      worker = new Worker(url);
      worker.onmessage = (e) => finish(e.data);
      worker.onerror = (e) => {
        finish({
          ok: false,
          error: String(e?.message || 'Sandbox syntax or runtime error').slice(0, 400),
          logs: [],
          queuedActions: [],
          durationMs: 0,
        });
      };
      worker.postMessage({
        id: 1,
        code: cleanCode,
        input,
        data: PORTFOLIO_DATA,
        pageState,
      });
    } catch (err) {
      finish({
        ok: false,
        error: String(err?.message || err).slice(0, 400),
        logs: [],
        queuedActions: [],
        durationMs: 0,
      });
    }
  });
}
