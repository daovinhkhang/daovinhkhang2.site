import { useState } from 'react';
import { LINKS } from './tools';
import { openLinkWindow } from '../openLink';

/**
 * Interactive cards rendered inside the assistant thread for:
 * - Generative UI artifacts (`render_view` or sandbox `ctx.card/table/jdMatch/...`)
 * - Isolated Web Worker sandbox & tool creation traces
 * - KAMI-style Dry-Run Approval Gates
 * - Session Synthesized Tool Registry panel
 */

export function ArtifactCard({ artifact, onAction }) {
  if (!artifact) return null;

  const runAction = (act) => {
    if (act.link && LINKS[act.link]) {
      openLinkWindow(LINKS[act.link]);
      return;
    }
    onAction?.(act);
  };

  return (
    <div className={`as-artifact as-artifact-${artifact.kind}`}>
      <div className="as-artifact-head">
        <div>
          <p className="as-artifact-kicker">{artifact.badge || artifact.kind.replace('_', ' ')}</p>
          <h3 className="as-artifact-title">{artifact.title}</h3>
          {artifact.subtitle ? <p className="as-artifact-sub">{artifact.subtitle}</p> : null}
        </div>
        {artifact.score !== null && artifact.score !== undefined ? (
          <div className="as-score-pill" aria-label={`Match score ${artifact.score}%`}>
            <span className="as-score-val">{artifact.score}%</span>
            <span className="as-score-lbl">Match</span>
          </div>
        ) : null}
      </div>

      {artifact.summary ? <p className="as-artifact-summary">{artifact.summary}</p> : null}

      {artifact.kind === 'jd_match' && (artifact.matched?.length || artifact.gaps?.length) ? (
        <div className="as-match-cols">
          {artifact.matched?.length ? (
            <div className="as-match-box is-good">
              <p className="as-match-label">Matched evidence</p>
              <ul>
                {artifact.matched.map((m, i) => (
                  <li key={`${m}-${i}`}>{m}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {artifact.gaps?.length ? (
            <div className="as-match-box is-gap">
              <p className="as-match-label">Notes / Gaps</p>
              <ul>
                {artifact.gaps.map((g, i) => (
                  <li key={`${g}-${i}`}>{g}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {artifact.columns?.length && artifact.rows?.length ? (
        <div className="as-table-wrap">
          <table className="as-table">
            <thead>
              <tr>
                {artifact.columns.map((c, i) => (
                  <th key={`${c}-${i}`}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {artifact.rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {artifact.columns.map((_, cIdx) => (
                    <td key={cIdx}>{row[cIdx] ?? ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {artifact.kind === 'metrics' && artifact.items?.length ? (
        <div className="as-metrics-grid">
          {artifact.items.map((it, i) => (
            <div key={`${it.label}-${i}`} className="as-metric-cell">
              <span className="as-metric-val">{it.value || it.label}</span>
              {it.value ? <span className="as-metric-lbl">{it.label}</span> : null}
              {it.detail ? <span className="as-metric-det">{it.detail}</span> : null}
            </div>
          ))}
        </div>
      ) : null}

      {artifact.kind === 'timeline' && artifact.items?.length ? (
        <ol className="as-timeline">
          {artifact.items.map((it, i) => (
            <li key={`${it.label}-${i}`}>
              <span className="as-tl-time">{it.value || `#${i + 1}`}</span>
              <div>
                <strong>{it.label}</strong>
                {it.detail ? <p>{it.detail}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      ) : null}

      {artifact.kind === 'architecture' && artifact.nodes?.length ? (
        <div className="as-arch">
          <div className="as-arch-nodes">
            {artifact.nodes.map((n, i) => (
              <div key={n.id || i} className="as-arch-node">
                <span className="as-arch-id">{n.label}</span>
                {n.detail ? <span className="as-arch-det">{n.detail}</span> : null}
              </div>
            ))}
          </div>
          {artifact.edges?.length ? (
            <ul className="as-arch-edges">
              {artifact.edges.map((e, i) => (
                <li key={i}>
                  <span>{e.from}</span>
                  <span className="as-arch-arrow">→{e.label ? ` ${e.label} →` : ''}</span>
                  <span>{e.to}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {!['metrics', 'timeline'].includes(artifact.kind) && artifact.items?.length ? (
        <dl className="as-kv-list">
          {artifact.items.map((it, i) => (
            <div key={`${it.label}-${i}`} className="as-kv-row">
              <dt>{it.label}</dt>
              <dd>
                {it.value}
                {it.detail ? <span className="as-kv-det"> — {it.detail}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {artifact.tags?.length ? (
        <div className="as-artifact-tags">
          {artifact.tags.map((t, i) => (
            <span key={`${t}-${i}`}>{t}</span>
          ))}
        </div>
      ) : null}

      {artifact.actions?.length ? (
        <div className="as-artifact-actions">
          {artifact.actions.map((act, i) => (
            <button key={`${act.label}-${i}`} type="button" className="as-artifact-btn" onClick={() => runAction(act)}>
              {act.label}
              <span aria-hidden>{act.link ? '↗' : '→'}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function TraceCard({ trace }) {
  const [open, setOpen] = useState(false);
  if (!trace) return null;

  const badge =
    trace.kind === 'create_tool'
      ? trace.ok
        ? 'TOOL CREATED'
        : 'TOOL ERROR'
      : trace.kind === 'run_custom_tool'
        ? trace.ok
          ? 'CUSTOM TOOL'
          : 'TOOL ERROR'
        : trace.ok
          ? 'SANDBOX'
          : 'SANDBOX ERR';

  return (
    <div className={`as-trace${trace.ok ? '' : ' is-error'}`}>
      <button type="button" className="as-trace-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="as-trace-badge">{badge}</span>
        <span className="as-trace-title">{trace.title}</span>
        <span className="as-trace-meta">{trace.durationMs ?? 0}ms</span>
        <span className="as-trace-caret" aria-hidden>
          {open ? '−' : '+'}
        </span>
      </button>

      {open ? (
        <div className="as-trace-body">
          <p className="as-trace-policy">Isolated Web Worker · no DOM / no network / 1500ms cap</p>
          {trace.code ? (
            <div className="as-trace-block">
              <span className="as-trace-lbl">Code</span>
              <pre>{trace.code}</pre>
            </div>
          ) : null}
          {trace.steps?.length ? (
            <div className="as-trace-block">
              <span className="as-trace-lbl">Workflow steps</span>
              <pre>{JSON.stringify(trace.steps, null, 2)}</pre>
            </div>
          ) : null}
          {trace.logs?.length ? (
            <div className="as-trace-block">
              <span className="as-trace-lbl">Console logs</span>
              <pre>{trace.logs.join('\n')}</pre>
            </div>
          ) : null}
          {trace.error ? (
            <div className="as-trace-block is-err">
              <span className="as-trace-lbl">Error</span>
              <pre>{trace.error}</pre>
            </div>
          ) : null}
          {trace.result !== undefined && trace.result !== null ? (
            <div className="as-trace-block">
              <span className="as-trace-lbl">Output</span>
              <pre>{typeof trace.result === 'string' ? trace.result : JSON.stringify(trace.result, null, 2)}</pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function ApprovalCard({ item, onApprove, onReject }) {
  const { approval, status } = item;
  const [inspect, setInspect] = useState(false);

  return (
    <div className={`as-approval is-${status}`}>
      <div className="as-approval-head">
        <span className="as-approval-badge">
          {status === 'pending' ? 'Approval gate · Dry-run' : status === 'approved' ? 'Approved & Executed' : 'Rejected'}
        </span>
        <h4 className="as-approval-title">{approval.title}</h4>
        {approval.description ? <p className="as-approval-desc">{approval.description}</p> : null}
      </div>

      <button type="button" className="as-approval-inspect" onClick={() => setInspect((v) => !v)}>
        {inspect ? 'Hide dry-run payload' : 'Inspect dry-run payload'}
      </button>

      {inspect ? (
        <pre className="as-approval-pre">
          {JSON.stringify(
            {
              tool: approval.toolName || approval.kind,
              input: approval.input,
              steps: approval.steps,
              code: approval.code,
            },
            null,
            2,
          )}
        </pre>
      ) : null}

      {status === 'pending' ? (
        <div className="as-approval-actions">
          <button type="button" className="as-btn-approve" onClick={onApprove}>
            Approve &amp; Run
          </button>
          <button type="button" className="as-btn-reject" onClick={onReject}>
            Reject
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ToolsPanel({ tools, onRun, onDelete, onClose }) {
  return (
    <div className="as-tools-panel" role="region" aria-label="Session synthesized tools">
      <div className="as-tools-head">
        <div>
          <p className="as-tools-title">Session Tool Registry ({tools.length})</p>
          <p className="as-tools-sub">Tools synthesized by the agent in this browser session</p>
        </div>
        <button type="button" className="as-tools-close" onClick={onClose} aria-label="Close tools list">
          Done
        </button>
      </div>

      {!tools.length ? (
        <p className="as-tools-empty">
          No custom tools synthesized yet. Ask the assistant to build a custom analyzer, calculator, or page workflow.
        </p>
      ) : (
        <ul className="as-tools-list">
          {tools.map((t) => (
            <li key={t.name} className="as-tool-item">
              <div className="as-tool-top">
                <code className="as-tool-name">{t.name}</code>
                <span className="as-tool-kind">{t.kind}</span>
                {t.requiresApproval ? <span className="as-tool-gate">gated</span> : null}
                <span className="as-tool-runs">{t.runs || 0} runs</span>
              </div>
              <p className="as-tool-desc">{t.description}</p>
              <div className="as-tool-actions">
                <button type="button" className="as-tool-btn" onClick={() => onRun(t)}>
                  Run
                </button>
                <button type="button" className="as-tool-del" onClick={() => onDelete(t.name)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
