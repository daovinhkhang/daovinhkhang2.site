/**
 * Client for the on-site assistant: an agent loop that runs in the browser.
 *
 *   model ──tool_calls──▶ page / sandbox / registry ──results──▶ model ──▶ answer
 *
 * The tools act on the visitor's own page or inside an isolated Web Worker
 * sandbox, so the loop lives in the browser while the proxy only attaches the
 * API key and enforces tool schemas.
 */

import { searchPortfolio } from './corpus';
import { getPageState, runTool, runWorkflowSteps } from './director';
import { resolveReply } from './knowledge';
import { getCustomTool, recordCustomToolRun, registerTool, registryPrompt } from './registry';
import { runInSandbox } from './sandbox';
import { normalizeArtifact, validateCall } from './tools';

const ENDPOINT = '/api/chat';
const HISTORY_LIMIT = 8;
const MAX_STEPS = 8;

let inflight = null;

/** Compact facts the model is allowed to rely on. Kept terse to stay cheap. */
const CONTEXT = `
NAME: Dao Vinh Khang. AI & Backend Engineer. Ho Chi Minh City, Vietnam.
CURRENT: AI / Backend Engineer at bTaskee (Core AI & Tasker Platform), Oct 2025 - present. Directed dual agent fleet across 4 markets (VN, TH, ID, MY): BeeTa (Tasker onboarding & live operations) and Kai (omnichannel customer support across Mobile, TikTok DM, Zalo, LINE).
BTASKEE ARCHITECTURE: V3-V4 built NodeRAG, ComposeRAG, and a Meta-Thinker reasoning layer inside a LangGraph-native stateful runtime, cutting retrieval latency ~6x (~30s -> <5s). V5.0 decoupled services (TaskerV5Runtime, PromptPack, ToolRegistry) with deterministic TURN_FACTS evidence gates for account states (ACTIVE/LOCKED) and action receipts eliminating hallucinations. AI Mart ClickHouse-to-MongoDB sync streams behavioral propensity signals into 6 context slots (identity, risk, capacity, behavior, growth, history) via 2,200-char budget-capped prompts with hash-stable cohorts and kill-switches. Long-term in-process memory & context compaction compress multi-turn dialogue while preserving entity IDs and temporal constraints. Built mobile Socket.IO streaming, Agent Lab isolated simulator, and automated golden-trace E2E benchmark gates.
ROLES: EraX -> Gtel (AI Engineer, Sep 2024 - Jul 2025): LangChain autonomous agent integrated with Odoo ERP & universal workflow orchestration, Redis caching + vector retrieval, Vietnamese ASR (Whisper Medium on ~245k audio samples / ~870h via Vast.ai GPUs achieving CER 0.066 / WER 0.107, ~60% error reduction; Faster-Whisper + CTranslate2 on RTX 3090 cutting latency ~30%), and 6 TensorFlow Lite on-device models (noise reduction, emotion classification, NER). FPT Information System (AI Engineer Intern, Jun-Sep 2023): Flask chatbot routing, DialoGPT + spaCy intent/entity/multi-turn dialogue, model inference tuning under peak loads. FPT Greenwich (TA - AI & ML, Feb 2023 - Nov 2024): mentored 50+ undergrads in Python, TensorFlow, PyTorch (~30% cohort score lift).
FLAGSHIP - KAMI Pro: commercial Odoo 17-19 AI layer on Odoo Apps Store (GitHub Kami-Agent-Odoo-v2). Interprets plain-language intents under signed-in user ACLs; Assist/Copilot/Autopilot, mutation budgets, dry-run diffs, immutable audit ledgers, one-click rollback, Telegram API, multi-provider routing (DeepSeek V4 default, OpenAI, Anthropic, Gemini).
KAMI Community: open-source Odoo 19 agent (github.com/daovinhkhang/kami-odoo-agent) with visible tool traces, per-model policies, approval gates, reversible writes.
KAMI Medusa: Medusa 2.17 headless commerce agent (github.com/daovinhkhang/kami-agents) with 25+ store tools, cron autonomy, semantic vector memory, resumable SSE, Discord/Slack/Telegram gateways.
STACK: LangChain, LangGraph, NodeRAG, ComposeRAG, GraphRAG, MCP, Langfuse, Python (FastAPI, Flask), Node.js (TypeScript, Express), REST, WebSockets, Socket.IO, Docker, Linux, CI/CD, Git, PostgreSQL, MongoDB, ClickHouse, Redis, Weaviate, PyTorch, TensorFlow, Keras, Scikit-learn, Whisper, Faster-Whisper, CTranslate2, Torchaudio, Librosa, Hugging Face, Odoo (17/18/19, OWL), Medusa 2.0.
EDUCATION & PUBLICATION: University of Greenwich (UK) / FPT Greenwich, BSc (Hons) in Computing (2020-2024), First Class Honours, GPA 3.7/4.0, Best Final Project Award (Spring 2024), Certificate of Merit (RVR). Published 2024 SSRN Research Preprint (Paper No. 5023739): "Evaluating Hybrid Deep Learning Models for Stock Price Forecasting: A Comparison of LSTM-GRU and Transformer-GRU Architectures".
LANGUAGES & CONTACT: Vietnamese (Native), English (B1 VSTEP). Email daovinhkhang0834@gmail.com, phone +84 834 684 568, LinkedIn dao-vinh-khang, GitHub @daovinhkhang, web daovinhkhang.site. Includes an interactive guided contact form (#contact-form) with topic selection (hiring, project, consulting, other) and AI concierge assistance. Open to AI & Backend roles.
`;

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
    const data = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, status: res.status, error: data?.error || `http_${res.status}` };
    return { ok: true, status: res.status, data };
  } catch {
    return { ok: false, status: 0, error: 'network_error' };
  }
}

const SENSITIVE_ACTIONS = new Set(['press', 'copy_contact']);

/** Execute validated queued page actions emitted by a sandbox run or workflow. */
async function handleBridgeActions(rawActions, { ctrl, hooks, requireApprovalForSensitive = true }) {
  const safeSteps = [];
  const sensitiveSteps = [];

  for (const act of rawActions || []) {
    if (!act || typeof act !== 'object') continue;
    const action = act.tool || act.action;
    const validArgs = validateCall(action, act.args || {});
    if (!validArgs) continue;
    const step = { action, args: validArgs };
    if (SENSITIVE_ACTIONS.has(action)) sensitiveSteps.push(step);
    else safeSteps.push(step);
  }

  let executed = [];
  if (safeSteps.length) {
    await hooks.beforeAct?.();
    if (!ctrl?.signal?.aborted) {
      executed = await runWorkflowSteps(safeSteps, (stepText, action, args) => {
        hooks.onStep?.(stepText, action, args);
      });
    }
  }

  let pendingApproval = false;
  if (sensitiveSteps.length && requireApprovalForSensitive) {
    pendingApproval = true;
    hooks.onApproval?.({
      kind: 'actions',
      title: 'Sandbox requested contact action',
      description: 'Review and approve before clicking contact links or writing to your clipboard.',
      steps: sensitiveSteps,
    });
  } else if (sensitiveSteps.length) {
    await hooks.beforeAct?.();
    const extra = await runWorkflowSteps(sensitiveSteps, (stepText, action, args) => {
      hooks.onStep?.(stepText, action, args);
    });
    executed = [...executed, ...extra];
  }

  return { executed, pendingApproval };
}

/** Run an approved dry-run card triggered by the visitor's own click. */
export async function executeApprovedRequest(approval, hooks = {}) {
  if (!approval) return null;

  if (approval.kind === 'actions') {
    await hooks.beforeAct?.();
    const results = await runWorkflowSteps(approval.steps || [], (stepText, action, args) => {
      hooks.onStep?.(stepText, action, args);
    });
    return { ok: true, results };
  }

  if (approval.kind === 'custom_tool') {
    const tool = getCustomTool(approval.toolName);
    if (!tool) return { ok: false, error: 'Custom tool no longer exists.' };

    if (tool.kind === 'workflow') {
      await hooks.beforeAct?.();
      const started = performance.now();
      const results = await runWorkflowSteps(tool.steps || [], (stepText, action, args) => {
        hooks.onStep?.(stepText, action, args);
      });
      const durationMs = Math.max(1, Math.round(performance.now() - started));
      recordCustomToolRun(tool.name, durationMs);
      hooks.onRegistryChange?.();
      hooks.onTrace?.({
        kind: 'run_custom_tool',
        title: tool.name,
        ok: true,
        durationMs,
        steps: tool.steps,
        result: results,
      });
      return { ok: true, results };
    }

    const out = await runInSandbox({
      code: tool.code,
      input: approval.input || {},
      pageState: getPageState(),
    });
    recordCustomToolRun(tool.name, out.durationMs);
    hooks.onRegistryChange?.();
    hooks.onTrace?.({
      kind: 'run_custom_tool',
      title: tool.name,
      code: tool.code,
      input: approval.input || {},
      ...out,
    });
    const artifact = out.artifact ? normalizeArtifact(out.artifact) : null;
    if (artifact) hooks.onArtifact?.(artifact);
    if (out.ok && out.queuedActions?.length) {
      await handleBridgeActions(out.queuedActions, { hooks, requireApprovalForSensitive: false });
    }
    return out;
  }

  return null;
}

const WALKTHROUGH_ASK_RE =
  /từng\s*ô|tất\s*cả\s*(các\s*)?ô|hết\s*(các\s*)?ô|đầy\s*đủ|từng\s*bước|giải\s*thích\s*(form|tất|hết|từng)|walk\s*through|walkthrough|each\s+field|every\s+field|all\s+fields|all\s+6|step\s+by\s+step|guide\s+me/i;

const CONTACT_INFO_ASK_RE =
  /liên\s*hệ|kết\s*nối|contact(\s+info|\s+details|\s+channels|\s+links)?|reach\s+(out|him|khang)/i;
const SINGLE_CONTACT_ONLY_RE = /chỉ\s*(cần\s*|xin\s*)?(email|mail|sđt|số)|copy\s+(email|phone)|only\s+(email|phone)/i;
const MULTI_TOPIC_RE =
  /kami|btaskee|erax|fpt|jd|so\s*sánh|compare|paper|ssrn|architecture|review|tạo\s*tool|code|nháp|draft|pre-?fill|điền\s*(tên|email|giúp)/i;

const DEFAULT_CONTACT_STOPS = (isVi) =>
  isVi
    ? [
        { target: 'contact-email', note: 'Email: daovinhkhang0834@gmail.com' },
        { target: 'contact-phone', note: 'Điện thoại / Zalo: +84 834 684 568' },
        { target: 'contact-linkedin', note: 'LinkedIn: dao-vinh-khang' },
        { target: 'contact-github', note: 'GitHub: @daovinhkhang' },
        { target: 'odoo-listing', note: 'Odoo Apps Store: KAMI Pro' },
      ]
    : [
        { target: 'contact-email', note: 'Email: daovinhkhang0834@gmail.com' },
        { target: 'contact-phone', note: 'Direct Phone: +84 834 684 568' },
        { target: 'contact-linkedin', note: 'LinkedIn: dao-vinh-khang' },
        { target: 'contact-github', note: 'GitHub: @daovinhkhang' },
        { target: 'odoo-listing', note: 'Odoo Apps Store: KAMI Pro' },
      ];

/** Run one visitor turn to completion. */
export async function converse(messages, { profile, hooks = {} } = {}) {
  if (inflight && !inflight.settled) inflight.ctrl.abort();
  const ctrl = new AbortController();
  inflight = { ctrl, settled: false };
  const current = inflight;
  const deadline = setTimeout(() => ctrl.abort(), 65000);

  const transcript = recent(messages);
  const lastUserTurn = [...transcript].reverse().find((m) => m.role === 'user')?.content || '';
  const cleanUserTurn = lastUserTurn.replace(/\s*\(Context:[\s\S]*\)$/, '').trim();
  const clickedGuideBtn = /\(Context:\s*visitor\s+clicked\s+"guide"/i.test(lastUserTurn);
  const clickedDraftBtn = /\(Context:\s*visitor\s+clicked\s+"draft"/i.test(lastUserTurn);
  const isMultiTopic = clickedDraftBtn || MULTI_TOPIC_RE.test(cleanUserTurn);

  const wantsWalkthrough = clickedGuideBtn || (!clickedDraftBtn && WALKTHROUGH_ASK_RE.test(cleanUserTurn));
  const wantsContactSweep =
    !wantsWalkthrough &&
    CONTACT_INFO_ASK_RE.test(cleanUserTurn) &&
    !SINGLE_CONTACT_ONLY_RE.test(cleanUserTurn);
  const isViUser =
    /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]|\b(cho|xin|coi|liên|xem|giúp|với|của)\b/i.test(
      cleanUserTurn,
    );
  let said = '';
  let replies = null;
  let acted = false;
  let contactGuided = false;
  let liveProfile = profile || '';
  const artifacts = [];

  const ensureActed = async () => {
    if (!acted) {
      acted = true;
      await hooks.beforeAct?.();
    }
  };

  try {
    // Fast-path: for unmistakable contact-channel or 6-field walkthrough asks, begin gliding
    // the pointer immediately (<100ms) in parallel with a single lean reply turn (~3s).
    const instantWalkthrough = clickedGuideBtn || (wantsWalkthrough && cleanUserTurn.length <= 90 && !isMultiTopic);
    const instantContact = !instantWalkthrough && wantsContactSweep && cleanUserTurn.length <= 90 && !isMultiTopic;

    if (instantWalkthrough) {
      await ensureActed();
      if (ctrl.signal.aborted) return { text: '', aborted: true };
      const fastArgs = {
        focus: 'topic',
        walkthrough: true,
        say: isViUser ? 'Để mình chỉ từng ô cho bạn nhé' : 'Let me walk you through each field',
      };
      hooks.onTool?.('fill_contact', fastArgs);
      const out = await runTool({ name: 'fill_contact', args: fastArgs }).catch(() => null);
      if (out?.shown) hooks.onStep?.(out.step || '', 'fill_contact', fastArgs);
      contactGuided = true;
      liveProfile = `${liveProfile}\n- Live screen state: chat already moved aside cleanly and cursor is walking through all 6 #contact-form fields (topic -> name -> email -> company -> message -> submit). Write the complete 6-part Markdown guide directly without calling tools except suggest_replies.`;
    } else if (instantContact) {
      await ensureActed();
      if (ctrl.signal.aborted) return { text: '', aborted: true };
      const stops = DEFAULT_CONTACT_STOPS(isViUser);
      const fastArgs = { target: stops[0].target, note: stops[0].note, stops, say: stops[0].note };
      hooks.onTool?.('point_at', fastArgs);
      const out = await runTool({ name: 'point_at', args: fastArgs }).catch(() => null);
      if (out?.shown) hooks.onStep?.(out.step || '', 'point_at', fastArgs);
      contactGuided = true;
      liveProfile = `${liveProfile}\n- Live screen state: cursor is already sweeping proactively across Email, Phone, LinkedIn, GitHub, and KAMI Pro (Odoo). Reply directly with all contact links formatted nicely in Markdown without calling more visual tools except suggest_replies.`;
    }

    for (let step = 0; step < MAX_STEPS; step += 1) {
      if (step > 0) hooks.onThink?.(acted);
      const res = await post(
        {
          messages: transcript,
          context: CONTEXT,
          tools: contactGuided ? 'reply_only' : true,
          profile: liveProfile,
          toolsContext: contactGuided ? '' : registryPrompt(),
        },
        ctrl.signal,
      );
      if (ctrl.signal.aborted) return { text: '', aborted: true };
      if (!res.ok) {
        if (step === 0 && (res.status === 501 || res.status === 0)) return null;
        return step === 0 ? { text: '', errorStatus: res.status } : { text: said, replies, acted, artifacts };
      }
      const data = res.data;
      if (!data) return step === 0 ? null : { text: said, replies, acted, artifacts };

      const content = String(data.content || '').trim();
      const raw = Array.isArray(data.tool_calls) ? data.tool_calls : [];
      if (!raw.length) return { text: content || said, replies, acted, artifacts };

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
          result = 'Rejected: invalid tool name or arguments.';
        } else if (c.name === 'suggest_replies') {
          replies = valid.replies;
          result = 'Shown under your answer.';
        } else if (c.name === 'start_tour') {
          return { text: valid.intro || said, tour: valid, replies, acted, artifacts };
        } else if (c.name === 'search_site') {
          hooks.onTool?.(c.name, valid);
          const hits = searchPortfolio(valid.query, 5);
          result = hits.length
            ? JSON.stringify(hits)
            : 'No direct matches found in the portfolio/CV corpus.';
        } else if (c.name === 'render_view') {
          hooks.onTool?.(c.name, valid);
          artifacts.push(valid);
          hooks.onArtifact?.(valid);
          hooks.onStep?.(valid.title, c.name, valid);
          result = `Rendered ${valid.kind} card "${valid.title}" in the chat.`;
        } else if (c.name === 'run_workflow') {
          await ensureActed();
          if (ctrl.signal.aborted) return { text: '', aborted: true };
          hooks.onTool?.(c.name, valid);
          const results = await runWorkflowSteps(valid.steps, (stepText, action, stepArgs) => {
            hooks.onStep?.(stepText, action, stepArgs);
          });
          result = `Workflow executed (${results.length} step(s)): ${results.join(' | ')}`;
        } else if (c.name === 'execute_code') {
          hooks.onTool?.(c.name, valid);
          const out = await runInSandbox({
            code: valid.code,
            input: valid.input,
            pageState: getPageState(),
          });
          if (ctrl.signal.aborted) return { text: '', aborted: true };
          hooks.onTrace?.({
            kind: 'execute_code',
            title: valid.purpose,
            code: valid.code,
            input: valid.input,
            ...out,
          });

          const artifact = out.artifact ? normalizeArtifact(out.artifact) : null;
          if (artifact) {
            artifacts.push(artifact);
            hooks.onArtifact?.(artifact);
          }

          let bridge = { executed: [], pendingApproval: false };
          if (out.ok && out.queuedActions?.length) {
            bridge = await handleBridgeActions(out.queuedActions, {
              ctrl,
              hooks: { ...hooks, beforeAct: ensureActed },
            });
          }
          hooks.onStep?.(valid.say || valid.purpose, c.name, valid);
          result = JSON.stringify({
            ok: out.ok,
            durationMs: out.durationMs,
            result: out.result,
            error: out.error,
            logs: out.logs,
            artifactRendered: Boolean(artifact),
            actionsExecuted: bridge.executed,
            actionsPendingApproval: bridge.pendingApproval,
          });
        } else if (c.name === 'create_tool') {
          hooks.onTool?.(c.name, valid);
          const reg = await registerTool(valid, getPageState());
          if (ctrl.signal.aborted) return { text: '', aborted: true };
          hooks.onTrace?.({
            kind: 'create_tool',
            title: valid.name,
            code: valid.code,
            steps: valid.steps,
            ok: reg.ok,
            error: reg.error,
            durationMs: reg.dryRun?.durationMs ?? 0,
            logs: reg.dryRun?.logs || [],
            result: reg.ok ? { registered: valid.name, kind: valid.kind, requiresApproval: valid.requiresApproval } : null,
          });
          if (reg.ok) {
            let runOutput = reg.dryRun?.result ?? null;
            let artifactRendered = false;
            let actionsExecuted = [];
            let actionsPendingApproval = false;

            if (valid.runNow && !reg.tool.requiresApproval) {
              if (valid.kind === 'code' && reg.dryRun) {
                recordCustomToolRun(valid.name, reg.dryRun.durationMs);
                const artifact = reg.dryRun.artifact ? normalizeArtifact(reg.dryRun.artifact) : null;
                if (artifact) {
                  artifactRendered = true;
                  artifacts.push(artifact);
                  hooks.onArtifact?.(artifact);
                }
                if (reg.dryRun.queuedActions?.length) {
                  const bridge = await handleBridgeActions(reg.dryRun.queuedActions, {
                    ctrl,
                    hooks: { ...hooks, beforeAct: ensureActed },
                  });
                  actionsExecuted = bridge.executed;
                  actionsPendingApproval = bridge.pendingApproval;
                }
              } else if (valid.kind === 'workflow') {
                await ensureActed();
                if (ctrl.signal.aborted) return { text: '', aborted: true };
                const wfResults = await runWorkflowSteps(valid.steps || [], (stepText, action, stepArgs) => {
                  hooks.onStep?.(stepText, action, stepArgs);
                });
                recordCustomToolRun(valid.name, 0);
                runOutput = wfResults;
              }
            } else if (valid.runNow && reg.tool.requiresApproval) {
              hooks.onApproval?.({
                kind: 'custom_tool',
                toolName: reg.tool.name,
                toolKind: reg.tool.kind,
                title: `Approve tool: ${reg.tool.name}`,
                description: reg.tool.description,
                input: valid.testInput || {},
                code: reg.tool.code,
                steps: reg.tool.steps,
              });
            }

            hooks.onRegistryChange?.();
            hooks.onStep?.(valid.say || '', c.name, valid);
            result = JSON.stringify({
              ok: true,
              registered: valid.name,
              kind: valid.kind,
              requiresApproval: reg.tool.requiresApproval,
              executedNow: Boolean(valid.runNow && !reg.tool.requiresApproval),
              dryRunMs: reg.dryRun?.durationMs ?? 0,
              dryRunOutput: runOutput,
              artifactRendered,
              actionsExecuted,
              actionsPendingApproval,
            });
          } else {
            result = JSON.stringify({ ok: false, error: reg.error });
          }
        } else if (c.name === 'run_custom_tool') {
          hooks.onTool?.(c.name, valid);
          const tool = getCustomTool(valid.name);
          if (!tool) {
            result = `Not found: custom tool "${valid.name}" is not in the registry. Create it first with create_tool.`;
          } else if (tool.requiresApproval) {
            hooks.onApproval?.({
              kind: 'custom_tool',
              toolName: tool.name,
              toolKind: tool.kind,
              title: `Approve tool: ${tool.name}`,
              description: tool.description,
              input: valid.input,
              code: tool.code,
              steps: tool.steps,
            });
            hooks.onStep?.(valid.say || '', c.name, valid);
            result = JSON.stringify({
              ok: true,
              status: 'awaiting_approval',
              message: 'Dry-run approval card shown to visitor. Wait for them to click Approve & Run.',
            });
          } else if (tool.kind === 'workflow') {
            await ensureActed();
            if (ctrl.signal.aborted) return { text: '', aborted: true };
            const started = performance.now();
            const results = await runWorkflowSteps(tool.steps || [], (stepText, action, stepArgs) => {
              hooks.onStep?.(stepText, action, stepArgs);
            });
            const durationMs = Math.max(1, Math.round(performance.now() - started));
            recordCustomToolRun(tool.name, durationMs);
            hooks.onRegistryChange?.();
            hooks.onTrace?.({
              kind: 'run_custom_tool',
              title: tool.name,
              ok: true,
              durationMs,
              steps: tool.steps,
              result: results,
            });
            result = JSON.stringify({ ok: true, durationMs, results });
          } else {
            const out = await runInSandbox({
              code: tool.code,
              input: valid.input,
              pageState: getPageState(),
            });
            if (ctrl.signal.aborted) return { text: '', aborted: true };
            recordCustomToolRun(tool.name, out.durationMs);
            hooks.onRegistryChange?.();
            hooks.onTrace?.({
              kind: 'run_custom_tool',
              title: tool.name,
              code: tool.code,
              input: valid.input,
              ...out,
            });
            const artifact = out.artifact ? normalizeArtifact(out.artifact) : null;
            if (artifact) {
              artifacts.push(artifact);
              hooks.onArtifact?.(artifact);
            }
            let bridge = { executed: [], pendingApproval: false };
            if (out.ok && out.queuedActions?.length) {
              bridge = await handleBridgeActions(out.queuedActions, {
                ctrl,
                hooks: { ...hooks, beforeAct: ensureActed },
              });
            }
            hooks.onStep?.(valid.say || '', c.name, valid);
            result = JSON.stringify({
              ok: out.ok,
              durationMs: out.durationMs,
              result: out.result,
              error: out.error,
              logs: out.logs,
              artifactRendered: Boolean(artifact),
              actionsExecuted: bridge.executed,
              actionsPendingApproval: bridge.pendingApproval,
            });
          }
        } else {
          const isRedundantContact =
            contactGuided &&
            (c.name === 'fill_contact' ||
              (c.name === 'point_at' && String(valid.target || '').startsWith('contact')) ||
              (c.name === 'navigate' && valid.to === 'contact'));
          if (isRedundantContact) {
            if (c.name === 'fill_contact' && typeof window !== 'undefined') {
              const extraFields = {};
              for (const k of ['name', 'email', 'topic', 'company', 'message']) {
                if (typeof valid[k] === 'string' && valid[k]) extraFields[k] = valid[k];
              }
              if (Object.keys(extraFields).length) {
                window.dispatchEvent(new CustomEvent('ai:contact-fill', { detail: { fields: extraFields } }));
              }
            }
            result =
              'Already positioned at #contact-form with the chat box aside — reply directly to the visitor now without calling more contact actions.';
          } else {
            const batchHasRichVisual = calls.some((x) =>
              ['point_at', 'fill_contact', 'show_system', 'open_experience'].includes(x.name),
            );
            if (c.name === 'navigate' && batchHasRichVisual) {
              result = 'Skipped redundant navigate; paired visual action already scrolls and dodges.';
            } else {
              if (c.name !== 'read_page') await ensureActed();
              if (ctrl.signal.aborted) return { text: '', aborted: true };
              let execName = c.name;
              let execArgs = valid;

              if (c.name === 'fill_contact' && wantsWalkthrough && !valid.message) {
                execArgs = { ...valid, walkthrough: true };
              } else if (
                wantsContactSweep &&
                ((c.name === 'point_at' &&
                  (valid.stops?.length || 0) <= 1 &&
                  String(valid.target || '').startsWith('contact')) ||
                  (c.name === 'navigate' && valid.to === 'contact' && !batchHasRichVisual))
              ) {
                execName = 'point_at';
                const stops = DEFAULT_CONTACT_STOPS(isViUser);
                execArgs = {
                  target: stops[0].target,
                  note: stops[0].note,
                  stops,
                  say: valid.say || stops[0].note,
                };
              }

              hooks.onTool?.(execName, execArgs);
              const out = await runTool({ name: execName, args: execArgs }).catch(() => ({ result: 'That did not work.' }));
              if (execName === 'fill_contact' || (execName === 'point_at' && execArgs.stops?.length > 1 && String(execArgs.target || '').startsWith('contact'))) {
                contactGuided = true;
              }
              result = out.result;
              if (out.shown) hooks.onStep?.(out.step || '', execName, execArgs);
            }
          }
        }

        transcript.push({ role: 'tool', tool_call_id: c.id, content: result });
      }

      if (said && calls.every((c) => c.name === 'suggest_replies')) return { text: said, replies, acted, artifacts };
    }
    return { text: said, replies, acted, artifacts };
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
