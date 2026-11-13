/**
 * Client for the on-site assistant: an agent loop that runs in the browser.
 *
 *   model ──tool_calls──▶ page acts (director) ──results──▶ model ──▶ … ──▶ answer
 *
 * The tools act on the visitor's own page, so the loop has to live here; the
 * proxy only adds the key. The model decides how many steps a turn needs (up
 * to MAX_STEPS) and sees the truthful outcome of each one before choosing the
 * next, which is what lets it read, then show, then explain.
 *
 * If the proxy is missing or unconfigured the widget falls back to the curated
 * knowledge base, and every request is single-flight: a new question cancels
 * the walk that is still running.
 */

import { resolveReply } from './knowledge';
import { runTool } from './director';
import { validateCall } from './tools';

const ENDPOINT = '/api/chat';
// Six turns is enough for pronouns and follow-ups while keeping the prompt
// small; a long transcript made the model slower and more likely to drift.
const HISTORY_LIMIT = 8;
const MAX_STEPS = 6;

let inflight = null;

/** Compact facts the model is allowed to rely on. Kept terse to stay cheap. */
const CONTEXT = `
NAME: Dao Vinh Khang. AI / Backend Engineer. Ho Chi Minh City, Vietnam.
CURRENT: AI / Backend Engineer at bTaskee (BeeTa), Oct 2025 - present, Tasker platform.
ROLES: EraX -> Gtel (AI Engineer, Sep 2024 - Jul 2025): LangChain agent integrated with Odoo, plus Vietnamese speech-to-text. FPT IS (Intern AI Engineer, Jun-Sep 2023): Flask chatbot with DialoGPT and spaCy intent analysis. FPT Greenwich (Teaching Assistant - AI, Feb 2023 - Nov 2024): ML/DL workshops, supported 50+ students.
FLAGSHIP - KAMI Pro: native Odoo 17-19 AI work layer. Plain-language goals; it discovers apps, models, views and permissions, then finds/creates/updates records under signed-in ACLs. Approval gates, dry-run diffs, audit ledger, one-click undo, workflows, sub-agents. Multi-provider routing with DeepSeek as default.
KAMI Community: open-source edition for Odoo 19.
KAMI Medusa: Medusa 2 build with 25+ commerce tools.
Tasker V2-V5 at bTaskee: NodeRAG, ComposeRAG, a Meta-Thinker layer, then a LangGraph-native runtime cutting retrieval from ~30s to under 5s (~6x faster). V5.0 split the turn loop into services: TaskerV5Runtime, PromptPack context, country-scoped wiki with evidence gates, ToolRegistry for side effects, post-turn memory gateway. AI Mart added personalisation with shadow mode, cohort rollout and a kill-switch.
Speech-to-text: Vietnamese accent-aware pipeline. Whisper finetuned on ~245k samples (~870 hours), served with Faster-Whisper + CTranslate2. CER 0.066 / WER 0.107 (~60% better than baseline), ~30% faster on an RTX 3090.
STACK: Python, FastAPI, LangChain, LangGraph, MongoDB, PostgreSQL, Redis, Weaviate, Docker, MCP, Langfuse, Whisper/Faster-Whisper/CTranslate2, TensorFlow, scikit-learn, TypeScript, React Native.
EDUCATION: Greenwich University, BSc (Hons) in Computing, 2020-2024. First Class Honours, GPA 3.7 / 4.0. Certificate of Merit (RVR), Best Final Project (Spring 2024). SSRN preprint on hybrid deep learning forecasting.
KAMI Pro is a commercial module on the Odoo Apps Store.
LANGUAGES: English B1 (VSTEP).
CONTACT: email daovinhkhang0834@gmail.com, phone +84 834 684 568, LinkedIn dao-vinh-khang, GitHub @daovinhkhang. Open to AI / Backend roles.
`;

/**
 * Build the upstream history.
 *
 * Messages are stored with role 'bot' locally, so they must be translated to
 * 'assistant' — filtering on 'assistant' here silently dropped every assistant
 * turn, which left two consecutive `user` entries. The model then echoed the
 * older answer or returned empty content. Consecutive same-role turns are also
 * merged, since the upstream dislikes them.
 */
function recent(messages) {
  const turns = messages
    .filter((m) => (m.role === 'user' || m.role === 'bot' || m.role === 'assistant') && m.text)
    .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));

  const merged = [];
  for (const t of turns) {
    const prev = merged[merged.length - 1];
    if (prev && prev.role === t.role) prev.content += `\n\n${t.content}`;
    else merged.push({ ...t });
  }
  return merged.slice(-HISTORY_LIMIT);
}

async function post(body, signal) {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Run one visitor turn to completion.
 *
 * hooks.beforeAct() — awaited before the first visible action, so the drawer
 *                     can turn into the companion and release the scroll lock
 * hooks.onStep(text) — a visible step happened (shown in the thread)
 * hooks.onSay(text)  — the model spoke mid-walk, before its final answer
 * hooks.onTool(name, args) — a call is about to run (the wait bubble says so)
 * hooks.onThink(acted)     — waiting on the model again after acting
 *
 * Resolves to { text, replies, tour, acted } or null when the model is
 * unreachable on the very first step (the caller then answers locally).
 */
export async function converse(messages, { profile, hooks = {} } = {}) {
  if (inflight && !inflight.settled) inflight.ctrl.abort();
  const ctrl = new AbortController();
  inflight = { ctrl, settled: false };
  const current = inflight;
  const deadline = setTimeout(() => ctrl.abort(), 45000);

  const transcript = recent(messages);
  let said = '';
  let replies = null;
  let acted = false;

  try {
    for (let step = 0; step < MAX_STEPS; step += 1) {
      if (step > 0) hooks.onThink?.(acted);
      const data = await post({ messages: transcript, context: CONTEXT, tools: true, profile }, ctrl.signal);
      if (ctrl.signal.aborted) return { text: '', aborted: true };
      if (!data) return step === 0 ? null : { text: said, replies, acted };

      const content = String(data.content || '').trim();
      const raw = Array.isArray(data.tool_calls) ? data.tool_calls : [];
      if (!raw.length) return { text: content || said, replies, acted };

      if (content) {
        said = content;
        hooks.onSay?.(content);
      }

      const calls = raw.slice(0, 6).map((c, k) => ({
        id: c.id || `call_${step}_${k}`,
        name: c.function?.name || '',
        arguments: c.function?.arguments || '{}',
      }));
      transcript.push({
        role: 'assistant',
        content,
        tool_calls: calls.map((c) => ({ id: c.id, type: 'function', function: { name: c.name, arguments: c.arguments } })),
      });

      for (const c of calls) {
        let args = {};
        try {
          args = JSON.parse(c.arguments);
        } catch {
          args = {};
        }
        const valid = validateCall(c.name, args);
        let result;

        if (!valid) {
          result = 'Rejected: that target does not exist on this page.';
        } else if (c.name === 'suggest_replies') {
          replies = valid.replies;
          result = 'Shown under your answer.';
        } else if (c.name === 'start_tour') {
          // A tour is a whole mode; the widget takes it from here.
          return { text: valid.intro || said, tour: valid, replies, acted };
        } else {
          if (c.name !== 'read_page' && !acted) {
            acted = true;
            await hooks.beforeAct?.();
          }
          if (ctrl.signal.aborted) return { text: '', aborted: true };
          hooks.onTool?.(c.name, valid);
          const out = await runTool({ name: c.name, args: valid }).catch(() => ({ result: 'That did not work.' }));
          result = out.result;
          if (out.shown) hooks.onStep?.(out.step || '', c.name, valid);
        }
        transcript.push({ role: 'tool', tool_call_id: c.id, content: result });
      }

      // Suggestions alone do not need another round trip if it already spoke.
      if (said && calls.every((c) => c.name === 'suggest_replies')) return { text: said, replies, acted };
    }
    return { text: said, replies, acted };
  } finally {
    clearTimeout(deadline);
    current.settled = true;
    if (inflight === current) inflight = null;
  }
}

/** Stop the walk in progress, if any. */
export function cancel() {
  if (inflight && !inflight.settled) inflight.ctrl.abort();
}

/** Local fallback: the curated KB, same shape as converse(). */
export function answerLocally(text) {
  const reply = resolveReply(text);
  return { text: reply.answer, chips: reply.chips, local: true };
}
