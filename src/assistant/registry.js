/**
 * Dynamic Tool Registry for agent-synthesized tools.
 *
 * Mirrors Tasker V5's ToolRegistry + KAMI Pro's Policy/Approval model:
 * - Tools created at runtime by the agent (`kind: 'code'` or `kind: 'workflow'`)
 *   are compiled/validated first (dry-run in the Web Worker sandbox for code),
 *   then persisted in localStorage (`khang.assistant.tools.v1`).
 * - `registryPrompt()` summarizes active custom tools on every turn so the
 *   model remembers and reuses what it built via `run_custom_tool`.
 */

import { runInSandbox } from './sandbox.js';

const KEY = 'khang.assistant.tools.v1';
const MAX_TOOLS = 12;

export function loadRegistry() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t) => t && typeof t.name === 'string' && (t.kind === 'code' || t.kind === 'workflow'));
  } catch {
    return [];
  }
}

export function saveRegistry(tools) {
  try {
    localStorage.setItem(KEY, JSON.stringify(tools.slice(0, MAX_TOOLS)));
  } catch {
    /* ignore private mode / quota errors */
  }
}

export function clearRegistry() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function getCustomTool(name) {
  return loadRegistry().find((t) => t.name === name) || null;
}

export function deleteCustomTool(name) {
  const next = loadRegistry().filter((t) => t.name !== name);
  saveRegistry(next);
  return next;
}

export function recordCustomToolRun(name, durationMs) {
  const list = loadRegistry();
  const next = list.map((t) =>
    t.name === name
      ? {
          ...t,
          runs: (t.runs || 0) + 1,
          lastRunAt: new Date().toISOString(),
          lastDurationMs: durationMs ?? t.lastDurationMs ?? 0,
        }
      : t,
  );
  saveRegistry(next);
  return next;
}

/**
 * Compile / dry-run verify a synthesized tool and register it.
 * If code fails syntax or explicit testInput fails runtime, returns `{ ok: false, error }`
 * without polluting the registry, letting the agent self-correct on the next step.
 */
export async function registerTool(spec, pageState = {}) {
  let dryRun = null;

  if (spec.kind === 'code') {
    const sample = spec.testInput ?? {};
    dryRun = await runInSandbox({
      code: spec.code,
      input: sample,
      pageState,
      timeoutMs: 1200,
    });

    if (!dryRun.ok) {
      // Syntax errors or explicit testInput failures must reject registration so the model fixes them.
      const isSyntax = /syntax|unexpected token|unterminated|invalid/i.test(dryRun.error || '');
      if (spec.testInput !== null || isSyntax) {
        return {
          ok: false,
          error: dryRun.error || 'Dry-run failed',
          dryRun,
        };
      }
      // If no testInput was given and runtime failed only on missing input fields, still verify syntax via empty probe:
      // Actually if a function threw on {}, let's warn the model so it writes defensive input handling.
      return {
        ok: false,
        error: `Dry-run with empty {} failed: ${dryRun.error}. Handle missing input fields safely (e.g. input?.field || '') or pass test_input.`,
        dryRun,
      };
    }
  }

  const entry = {
    name: spec.name,
    description: spec.description,
    kind: spec.kind,
    parameters: spec.parameters || '{}',
    code: spec.kind === 'code' ? spec.code : undefined,
    steps: spec.kind === 'workflow' ? spec.steps : undefined,
    requiresApproval: Boolean(spec.requiresApproval),
    createdAt: new Date().toISOString(),
    runs: 0,
    lastDurationMs: dryRun?.durationMs ?? 0,
  };

  const existing = loadRegistry().filter((t) => t.name !== entry.name);
  const next = [entry, ...existing].slice(0, MAX_TOOLS);
  saveRegistry(next);

  return {
    ok: true,
    tool: entry,
    dryRun,
    registry: next,
  };
}

/** Concise system prompt summary of all tools currently synthesized in this browser session. */
export function registryPrompt() {
  const list = loadRegistry();
  if (!list.length) return '';
  return list
    .map((t) => {
      const gate = t.requiresApproval ? ' · approval-gated' : '';
      return `- ${t.name} [${t.kind}${gate}] (${t.parameters || '{}'}): ${t.description}`;
    })
    .join('\n');
}
