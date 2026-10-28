/**
 * Client for the on-site assistant.
 *
 * Three behaviours matter here:
 *  1. If the proxy is missing or unconfigured (501/502), we fall back to the
 *     built-in knowledge base so the widget always answers.
 *  2. Tool calls are executed before the text is shown, so the page has already
 *     moved by the time the user finishes reading the sentence.
 *  3. Everything is abortable and single-flight; a second question cancels the
 *     first rather than racing it.
 */

import { resolveReply } from './knowledge';
import { runTool } from './director';
import { TOOLS, validateCall } from './tools';

const ENDPOINT = '/api/chat';
// Six turns is enough for pronouns and follow-ups while keeping the prompt
// small; a long transcript made the model slower and more likely to drift.
const HISTORY_LIMIT = 6;

let inflight = null;

/** Compact facts the model is allowed to rely on. Kept terse to stay cheap. */
const CONTEXT = `
NAME: Dao Vinh Khang. AI / Backend Engineer. Ho Chi Minh City, Vietnam.
CURRENT: AI / Backend Engineer at bTaskee (BeeTa), Oct 2025 - present, Tasker platform.
ROLES: EraX -> Gtel (AI Engineer, Sep 2024 - Jul 2025): LangChain agent integrated with Odoo, plus Vietnamese speech-to-text. FPT IS (AI Engineer Intern, 2023). FPT Greenwich (Teaching Assistant, AI, 2023-2024).
FLAGSHIP - KAMI Pro: native Odoo 17-19 AI work layer. Plain-language goals; it discovers apps, models, views and permissions, then finds/creates/updates records under signed-in ACLs. Approval gates, dry-run diffs, audit ledger, one-click undo, workflows, sub-agents. Multi-provider routing with DeepSeek as default.
KAMI Community: open-source edition for Odoo 19.
KAMI Medusa: Medusa 2 build with 25+ commerce tools.
Tasker V2-V5 at bTaskee: NodeRAG, ComposeRAG, a Meta-Thinker layer, then a LangGraph-native runtime cutting retrieval from ~30s to under 5s (~6x faster). V5.0 split the turn loop into services: TaskerV5Runtime, PromptPack context, country-scoped wiki with evidence gates, ToolRegistry for side effects, post-turn memory gateway. AI Mart added personalisation with shadow mode, cohort rollout and a kill-switch.
Speech-to-text: Vietnamese accent-aware pipeline. Whisper finetuned on ~245k samples (~870 hours), served with Faster-Whisper + CTranslate2. CER 0.066 / WER 0.107 (~60% better than baseline), ~30% faster on an RTX 3090.
STACK: Python, FastAPI, LangChain, LangGraph, MongoDB, PostgreSQL, Redis, Weaviate, Docker, MCP, Langfuse, Whisper/Faster-Whisper/CTranslate2, TensorFlow, scikit-learn, TypeScript, React Native.
EDUCATION: FPT University, AI major.
CONTACT: use the contact section of the page (email and links are listed there).
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

/**
 * Ask the proxy. Resolves to { text, calls } or null when unavailable,
 * so the caller can fall back to the local knowledge base.
 */
export async function ask(messages, { signal } = {}) {
  // Only cancel a request that is still running. A finished one must never be
  // aborted, or its `finally` races the call that just replaced it.
  if (inflight && !inflight.settled) inflight.ctrl.abort();
  const ctrl = new AbortController();
  inflight = { ctrl, settled: false };
  const current = inflight;
  const onAbort = () => ctrl.abort();
  signal?.addEventListener('abort', onAbort, { once: true });

  // Client-side deadline; the function also enforces one upstream.
  const deadline = setTimeout(() => ctrl.abort(), 20000);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: recent(messages), context: CONTEXT, tools: TOOLS }),
      signal: ctrl.signal,
    });

    if (!res.ok) return null;

    const data = await res.json();
    const calls = (data.tool_calls || [])
      .map((c) => {
        let args = {};
        try {
          args = JSON.parse(c.function?.arguments || '{}');
        } catch {
          args = {};
        }
        const valid = validateCall(c.function?.name, args);
        return valid ? { name: c.function.name, args: valid } : null;
      })
      .filter(Boolean)
      .slice(0, 2); // never let one turn hijack the page

    const text = String(data.content || '').trim();

    if (!text && !calls.length) return null;

    return { text, calls };
  } catch {
    return null;
  } finally {
    clearTimeout(deadline);
    current.settled = true;
    if (inflight === current) inflight = null;
    signal?.removeEventListener('abort', onAbort);
  }
}

/**
 * Second turn: hand the tool results back so the model can explain what it
 * just did in its own voice.
 *
 * The page action is folded into the assistant's own turn rather than sent as a
 * second `user` message — two consecutive user turns made the model answer with
 * empty content.
 */
export async function followUp(messages, calls, results, signal) {
  const summary = calls.map((c) => `${c.name}(${JSON.stringify(c.args)})`).join(', ');
  const outcome = results.filter(Boolean).join(' ');

  const history = recent(messages);
  const lastUser = history.filter((m) => m.role === 'user').pop();
  const trimmed = history.slice(0, -1); // drop the question; we restate it here

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        messages: [
          ...trimmed,
          { role: 'assistant', content: `[On the page now: ${summary}. ${outcome}]` },
          {
            role: 'user',
            // Language is mirrored, not fixed: the follow-up would otherwise
            // revert to English right after a Vietnamese question.
            content: `Yes — now tell me about it in two short sentences, as the guide, in the same language I used. My question was: "${lastUser?.content || ''}"`,
          },
        ],
        context: CONTEXT,
      }),
      signal,
    });
    if (!res.ok) return '';
    const data = await res.json();
    return String(data.content || '').trim();
  } catch {
    return '';
  }
}

/** Local fallback: the curated KB, same shape as ask(). */
export function answerLocally(text) {
  const reply = resolveReply(text);
  return { text: reply.answer, calls: [], chips: reply.chips, local: true };
}

/** Execute validated calls in order and collect the narration lines. */
export async function perform(calls) {
  const lines = [];
  for (const call of calls) {
    try {
      const line = await runTool(call);
      if (line) lines.push(line);
    } catch {
      /* a broken selector must never break the chat */
    }
  }
  return lines;
}
