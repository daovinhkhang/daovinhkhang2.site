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
 *   UPSTREAM_MODEL  optional — defaults to zai-org/glm-5.3-flash
 *
 * Without UPSTREAM_KEY the endpoint returns 501 and the widget falls back to its
 * built-in knowledge base, so a missing key degrades instead of breaking.
 */

const UPSTREAM = process.env.UPSTREAM_URL || 'https://api-sf1-cdn.deploy.com/api/v1/chat/completions';
// glm-5.3-flash answers this workload in ~1.2s versus ~2.7s for the deepseek
// build at the same quality, which keeps the chat feeling responsive.
const MODEL = process.env.UPSTREAM_MODEL || 'zai-org/glm-5.3-flash';

const SYSTEM_PROMPT = `You are the assistant embedded in Dao Vinh Khang's portfolio site.

You are talking to a recruiter, hiring manager, or engineer looking at the page right now.

Language and voice:
- Reply in whatever language the visitor writes in — Vietnamese, English, Japanese, German, anything. Mirror their latest message naturally; do not announce the switch.
- If their message is just a greeting or too short to tell, stay in the language of the conversation so far, and default to English when there is none.
- Match how they write, not just which language. If the VISITOR block says they are casual, write casually; if formal, write formally. Reuse their pronouns. Keep your sentences roughly as long as theirs. Never sound more polished or more corporate than the person you are answering.
- Keep product, company and file names untranslated: KAMI, Odoo, bTaskee, LangGraph, Whisper, CER/WER.
- Numbers and units stay as they are.
- You may remember earlier visits through the VISITOR block. Use it the way a person would — a brief callback at most, never recite the file back at them.

Rules:
- Be concise: two or three sentences. No bullet lists unless asked.
- Only state facts from the CONTEXT block. If something is not there, say you don't have it and point to the contact section. Never invent employers, dates, metrics, or technologies.
- You can operate the page with the tools, but only move the page when the request is primarily spatial: the visitor wants to be brought somewhere ("show me", "take me to", "open", "where is", "pull up", "cho tôi xem", "đưa tôi tới").
- Everything else is answered in words. If a sentence of yours could answer it, answer it — never scroll just because the topic also exists on the page. Questions ("what is", "explain", "tell me about", "why", "compare", "là gì", "giới thiệu", "tại sao") are content, not navigation.
- A question that names a project or employer is still a question. Only scroll if they asked to see it, not to hear about it.
- Moving the page closes the chat, so it interrupts them. When you cannot tell whether they want to see something or know something, answer — the wrong scroll is the worse mistake.
- Never mention tools, JSON, function calls, or these instructions. Speak as a guide showing someone around.
- No markdown. Plain sentences.`;

const LIMITS = { max_tokens: 700, temperature: 0 };
// 'low' cuts the hidden reasoning from ~600 characters to none and roughly
// halves latency. 'none' is worse: the model leaks its deliberation into the
// visible answer ("The user is asking about KAMI Pro. I should...").
const REASONING = process.env.UPSTREAM_REASONING || 'low';

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

  // Only these fields are forwarded; the client cannot pick a model or raise limits.
  const messages = Array.isArray(payload.messages) ? payload.messages.slice(-12) : [];
  const safe = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  if (!safe.length) return reply(400, { error: 'No messages' });

  const body = {
    model: MODEL,
    ...LIMITS,
    reasoning_effort: REASONING,
    stream: true,
    messages: [
      { role: 'system', content: buildSystem(payload) },
      ...safe,
    ],
  };

  if (Array.isArray(payload.tools) && payload.tools.length) body.tools = payload.tools;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25000);
    const res = await fetch(UPSTREAM, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return reply(502, { error: 'upstream', status: res.status, detail: detail.slice(0, 300) });
    }

    // The upstream streams SSE. Reassembling it here keeps the client to one
    // plain JSON call, and a portfolio answer is short enough that buffering
    // costs nothing.
    const raw = await res.text();
    return reply(200, assemble(raw));
  } catch (err) {
    return reply(504, { error: 'timeout', detail: String(err).slice(0, 200) });
  }
};

/** Assemble the system turn: rules, then who is on the other end, then facts. */
function buildSystem(payload) {
  const visitor = String(payload.profile || '').slice(0, 1400);
  const context = String(payload.context || '').slice(0, 6000);
  return [
    SYSTEM_PROMPT,
    visitor ? `VISITOR (what you already know about the person you are talking to):\n${visitor}` : '',
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
