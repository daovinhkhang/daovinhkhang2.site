/**
 * Proxy for the model endpoint.
 *
 * The upstream API refuses cross-origin requests (`Origin is not allowed`), so
 * the browser can never call it directly. This function adds the bearer token
 * server-side and answers same-origin.
 *
 * Setup: Netlify → Site settings → Environment variables
 *   UPSTREAM_KEY    required — the bearer token
 *   UPSTREAM_URL    optional — defaults to the Deploy gateway
 *
 * Model is pinned directly in code to deepseek-ai/deepseek-v4.1-flash-1017.
 *
 * Without UPSTREAM_KEY the endpoint returns 501 and the widget falls back to its
 * built-in knowledge base, so a missing key degrades instead of breaking.
 */

// One tool contract for both sides: the model is only offered what the page
// can perform, and the client cannot slip in anything else.
import { REPLY_TOOLS, TOOLS, TOOL_NAMES } from '../../src/assistant/tools.js';

const UPSTREAM = process.env.UPSTREAM_URL || 'https://api-sf1-cdn.deploy.com/api/v1/chat/completions';
// Hardcoded upstream model so local and Netlify deployments always use the pinned build.
const MODEL = 'deepseek-ai/deepseek-v4.1-flash-1017';

const SYSTEM_PROMPT = `You are Khang, the AI assistant embedded in Dao Vinh Khang's portfolio site.
You speak with recruiters, hiring managers, or engineers looking at the page right now.

Language and persona:
- Reply in the visitor's latest language naturally (Vietnamese, English, etc.) without announcing switches. Mirror their register (casual: "mình"/"bạn", formal ạ/dạ/anh/chị: "em"/"anh/chị"; default English if ambiguous).
- Never claim to be human. Refer to the real person whose portfolio this is as "Dao Vinh Khang" then "anh Khang" (Vietnamese) or "Khang".
- Keep product/company/metric names untranslated: KAMI, Odoo, bTaskee, LangGraph, Whisper, CER/WER, TURN_FACTS.

Speed & proactive page guiding:
- CONTEXT already holds contact details, shipped systems, roles, capabilities, GPA, SSRN #5023739, and form fields. Do NOT waste a round-trip calling read_page/search_site unless the visitor asks for granular details absent from CONTEXT.
- Never call navigate right before point_at, show_system, open_experience, or fill_contact — those tools already scroll and move the chat aside cleanly in one pass.
- Point proactively, never lazily at just one item: whenever answering about multiple channels, cards, or multi-part sections (such as contact links, capabilities/method, education/publication, or a system walkthrough), use point_at with stops=[{target, note}, ...] covering 2–5 items in ONE call so your cursor and mini speech bubble sweep smoothly across every relevant card.
  * Example for general contact requests: pass stops covering contact-email, contact-phone, contact-linkedin, contact-github, and odoo-listing.
- Talk briefly while acting ("Để mình chỉ từng phần cho bạn nhé"), never use internal words like "scrolling", "selector", or "JSON".
- For multi-step cross-section tours, prefer run_workflow or start_tour; for structured matrices/JD fits/comparisons/metrics/diagrams, use render_view.
- Use execute_code only for custom scoring/analysis/computation when static facts aren't enough; reuse SYNTHESIZED TOOLS via run_custom_tool; end helpful turns with suggest_replies (2–4 next steps) and use press only when asked to open a link.

Contact concierge ("chăm sóc đến phút cuối"):
- When asked to message, hire, collaborate, or guide through #contact-form ("hướng dẫn từng ô", "chỉ hết các ô", "giải thích form", etc.), call fill_contact ONCE per turn: pass walkthrough=true for field-by-field/form guidance (glides cursor + mini bubble across all 6 parts: topic -> name -> email -> company -> message -> submit), or target one field only when pre-drafting from visitor details. Never invent personal info or auto-submit.
- Whenever guiding on the contact form, ALWAYS explain ALL 6 parts clearly in formatted Markdown: (1) **Topic** (\`Hiring / AI Role\`, \`AI Product / Build\`, \`Architecture Advisory\`, \`Collaboration / Other\`), (2) **Name** (*required*), (3) **Email** (*required*), (4) **Company / Stack Context** (*optional*), (5) **Brief** (*required*, >=10 chars — mention \`Fill template\` / \`Draft with AI\`), and (6) **Send inquiry** (human-gated, delivers to \`daovinhkhang0834@gmail.com\` with a \`KHG-...\` receipt ID).

Formatting & truthfulness:
- Facts strictly come from CONTEXT, read_page, search_site, or DATA. Never invent metrics, dates, or employers.
- Keep replies crisp (2–4 sentences normally, full list when guiding multi-item sections/forms). Format cleanly with **bold** labels, \`inline code\`, "- " or "1. " lists, and blank lines between blocks.`;

// Lean limits + non-streaming JSON + reasoning_effort='none' cuts DeepSeek V4.1 latency ~4-5x.
const LIMITS = { max_tokens: 1100, temperature: 0.35 };
const REASONING = process.env.UPSTREAM_REASONING || 'none';

const reply = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' });

  const key = process.env.UPSTREAM_KEY;
  if (!key) return reply(501, { error: 'not_configured' });

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return reply(400, { error: 'Bad JSON' });
  }

  // Only these fields are forwarded; the client cannot pick a model, raise
  // limits, or hand the model a tool the page does not implement.
  const messages = Array.isArray(payload.messages) ? payload.messages.slice(-28) : [];
  const safe = sanitize(messages);

  if (!safe.some((m) => m.role === 'user')) return reply(400, { error: 'No messages' });

  const body = {
    model: MODEL,
    ...LIMITS,
    reasoning_effort: REASONING,
    stream: false,
    messages: [
      { role: 'system', content: buildSystem(payload) },
      ...safe,
    ],
  };

  if (payload.tools === 'reply_only') body.tools = REPLY_TOOLS;
  else if (payload.tools) body.tools = TOOLS;

  const callUpstream = (signal) =>
    fetch(UPSTREAM, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
        connection: 'close',
      },
      body: JSON.stringify(body),
      signal,
    });

  try {
    const ctrl = new AbortController();
    const timeoutMs = Number(process.env.UPSTREAM_TIMEOUT_MS) || 35000;
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      let res;
      try {
        res = await callUpstream(ctrl.signal);
      } catch (err) {
        if (err?.name === 'AbortError' || ctrl.signal.aborted) throw err;
        res = await callUpstream(ctrl.signal);
      }

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        return reply(502, { error: 'upstream', status: res.status, detail: detail.slice(0, 300) });
      }

      // Single compact JSON response avoids slow buffered SSE waiting on DeepSeek V4.1.
      const raw = await res.text();
      return reply(200, assemble(raw));
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    return reply(504, { error: 'timeout', detail: String(err).slice(0, 200) });
  }
};

/**
 * Keep the agent loop's shape (assistant tool_calls → tool results) but
 * nothing else: known tool names only, bounded sizes, and every tool result
 * must answer a call that is actually in the transcript.
 */
function sanitize(messages) {
  const out = [];
  const open = new Set();
  for (const m of messages) {
    if (!m || typeof m !== 'object') continue;
    if (m.role === 'user' && typeof m.content === 'string') {
      out.push({ role: 'user', content: m.content.slice(0, 4000) });
    } else if (m.role === 'assistant') {
      const calls = (Array.isArray(m.tool_calls) ? m.tool_calls : [])
        .filter((c) => c && typeof c.id === 'string' && TOOL_NAMES.includes(c.function?.name))
        .slice(0, 6)
        .map((c) => ({
          id: c.id.slice(0, 64),
          type: 'function',
          function: { name: c.function.name, arguments: String(c.function.arguments || '{}').slice(0, 6500) },
        }));
      const content = typeof m.content === 'string' ? m.content.slice(0, 4000) : '';
      if (!content && !calls.length) continue;
      calls.forEach((c) => open.add(c.id));
      out.push(calls.length ? { role: 'assistant', content, tool_calls: calls } : { role: 'assistant', content });
    } else if (m.role === 'tool' && open.has(m.tool_call_id) && typeof m.content === 'string') {
      out.push({ role: 'tool', tool_call_id: m.tool_call_id, content: m.content.slice(0, 5000) });
    }
  }
  // A transcript cut mid-loop can start on a tool result; drop leading orphans.
  while (out.length && out[0].role !== 'user') out.shift();
  return out;
}

/** Assemble the system turn: rules, who is on the other end, synthesized tools, then facts. */
function buildSystem(payload) {
  const visitor = String(payload.profile || '').slice(0, 1400);
  const toolsContext = String(payload.toolsContext || '').slice(0, 2400);
  const context = String(payload.context || '').slice(0, 8000);
  return [
    SYSTEM_PROMPT,
    visitor ? `VISITOR (what you already know about the person you are talking to):\n${visitor}` : '',
    toolsContext ? `SYNTHESIZED TOOLS (created in this session, callable via run_custom_tool):\n${toolsContext}` : '',
    `CONTEXT (the only facts you may state):\n${context}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** Fold an SSE stream back into { content, tool_calls }. */
function assemble(raw) {
  // Some gateways ignore stream:true and return plain JSON.
  if (raw.trimStart().startsWith('{')) {
    try {
      const d = JSON.parse(raw);
      const m = d.choices?.[0]?.message || {};
      return {
        content: typeof m.content === 'string' ? m.content : '',
        tool_calls: Array.isArray(m.tool_calls) ? m.tool_calls : [],
      };
    } catch {
      return { content: '', tool_calls: [] };
    }
  }

  let content = '';
  const calls = [];

  for (const line of raw.split('\n')) {
    if (!line.startsWith('data:')) continue;
    const chunkText = line.slice(5).trim();
    if (!chunkText || chunkText === '[DONE]') continue;

    let chunk;
    try {
      chunk = JSON.parse(chunkText);
    } catch {
      continue;
    }
    const delta = chunk.choices?.[0]?.delta;
    if (!delta) continue;

    // Reasoning tokens stream before the answer; they are never shown.
    if (typeof delta.content === 'string') content += delta.content;

    if (Array.isArray(delta.tool_calls)) {
      for (const tc of delta.tool_calls) {
        const i = tc.index ?? 0;
        calls[i] = calls[i] || { id: '', type: 'function', function: { name: '', arguments: '' } };
        if (tc.id) calls[i].id = tc.id;
        if (tc.function?.name) calls[i].function.name += tc.function.name;
        if (tc.function?.arguments) calls[i].function.arguments += tc.function.arguments;
      }
    }
  }

  return { content: content.trim(), tool_calls: calls.filter(Boolean) };
}
