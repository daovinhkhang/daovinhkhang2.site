import { openLinkWindow } from '../openLink';

const SAFE_URL_RE = /^(https?:\/\/|mailto:|tel:)/i;
const INLINE_PATTERN =
  '(`[^`\\n]+`|\\*\\*[^*\\n]+\\*\\*|__[^_\\n]+__|\\[[^\\]\\n]+\\]\\([^)\\s]+\\)|\\*[^*\\n]+\\*|https?:\\/\\/[^\\s<>()]+[^\\s<>().,;!?])';

function renderInline(text, keyPrefix = 'in', depth = 0) {
  if (!text) return null;
  if (depth > 3) return text;
  const re = new RegExp(INLINE_PATTERN, 'g');
  const out = [];
  let last = 0;
  let match;
  let idx = 0;

  while ((match = re.exec(text)) !== null) {
    if (match[0].length === 0) {
      re.lastIndex += 1;
      continue;
    }
    if (match.index > last) out.push(text.slice(last, match.index));
    const tok = match[0];
    const k = `${keyPrefix}-${idx++}`;

    if (tok.startsWith('`') && tok.endsWith('`')) {
      out.push(
        <code key={k} className="as-md-code">
          {tok.slice(1, -1)}
        </code>,
      );
    } else if ((tok.startsWith('**') && tok.endsWith('**')) || (tok.startsWith('__') && tok.endsWith('__'))) {
      out.push(<strong key={k}>{renderInline(tok.slice(2, -2), k, depth + 1)}</strong>);
    } else if (tok.startsWith('*') && tok.endsWith('*')) {
      out.push(<em key={k}>{tok.slice(1, -1)}</em>);
    } else if (tok.startsWith('[')) {
      const sep = tok.indexOf('](');
      const label = tok.slice(1, sep);
      const href = tok.slice(sep + 2, -1);
      if (SAFE_URL_RE.test(href)) {
        out.push(
          <a
            key={k}
            href={href}
            className="as-md-link"
            onClick={(e) => {
              e.preventDefault();
              openLinkWindow(href);
            }}
          >
            {label} ↗
          </a>,
        );
      } else {
        out.push(label);
      }
    } else if (SAFE_URL_RE.test(tok)) {
      out.push(
        <a
          key={k}
          href={tok}
          className="as-md-link"
          onClick={(e) => {
            e.preventDefault();
            openLinkWindow(tok);
          }}
        >
          {tok.replace(/^https?:\/\//, '')} ↗
        </a>,
      );
    } else {
      out.push(tok);
    }

    last = re.lastIndex;
  }

  if (last < text.length) out.push(text.slice(last));
  return out;
}

const isBulletLine = (l) => /^\s*(?:[-*•])\s+/.test(l);
const stripBullet = (l) => l.replace(/^\s*(?:[-*•])\s+/, '');
const isOrderedLine = (l) => /^\s*\d+[.)]\s+/.test(l);
const stripOrdered = (l) => l.replace(/^\s*\d+[.)]\s+/, '');
const isHeadingLine = (l) => /^\s{0,3}#{1,3}\s+/.test(l);
const isQuoteLine = (l) => /^\s*>\s?/.test(l);
const isTableLine = (l) => /^\s*\|.+\|\s*$/.test(l);
const isTableDivider = (l) => /^\s*\|?(\s*:?-{2,}:?\s*\|)+\s*$/.test(l);

function parseTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

/** Parse assistant text into structured blocks (headings, lists, code, quotes, tables, paragraphs). */
function parseBlocks(text) {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    // Fenced code block
    if (/^\s*```/.test(line)) {
      const lang = line.trim().slice(3).trim();
      i += 1;
      const buf = [];
      while (i < lines.length && !/^\s*```/.test(lines[i])) {
        buf.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      blocks.push({ type: 'code', lang, content: buf.join('\n') });
      continue;
    }

    // Heading
    if (isHeadingLine(line)) {
      const clean = line.trim().replace(/^#{1,3}\s+/, '');
      blocks.push({ type: 'heading', content: clean });
      i += 1;
      continue;
    }

    // Table
    if (isTableLine(line) && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
      const headers = parseTableRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && isTableLine(lines[i])) {
        rows.push(parseTableRow(lines[i]));
        i += 1;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    // Unordered list
    if (isBulletLine(line)) {
      const items = [];
      while (i < lines.length && isBulletLine(lines[i])) {
        items.push(stripBullet(lines[i]));
        i += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Ordered list
    if (isOrderedLine(line)) {
      const items = [];
      while (i < lines.length && isOrderedLine(lines[i])) {
        items.push(stripOrdered(lines[i]));
        i += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Blockquote
    if (isQuoteLine(line)) {
      const buf = [];
      while (i < lines.length && isQuoteLine(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''));
        i += 1;
      }
      blocks.push({ type: 'quote', content: buf.join(' ') });
      continue;
    }

    // Paragraph (preserve soft line breaks inside a contiguous block)
    const buf = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*```/.test(lines[i]) &&
      !isHeadingLine(lines[i]) &&
      !isBulletLine(lines[i]) &&
      !isOrderedLine(lines[i]) &&
      !isQuoteLine(lines[i]) &&
      !(isTableLine(lines[i]) && i + 1 < lines.length && isTableDivider(lines[i + 1]))
    ) {
      buf.push(lines[i].trim());
      i += 1;
    }
    if (!buf.length) {
      buf.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: 'p', lines: buf });
  }

  return blocks;
}

export default function FormatReply({ text, fresh }) {
  const blocks = parseBlocks(text);
  if (!blocks.length) return null;

  return (
    <div className={`as-md${fresh ? ' is-fresh' : ''}`}>
      {blocks.map((block, idx) => {
        const style = fresh ? { animationDelay: `${Math.min(260, idx * 45)}ms` } : undefined;
        const cls = fresh ? 'as-md-block is-fresh' : 'as-md-block';

        if (block.type === 'heading') {
          return (
            <h4 key={idx} className={`as-md-h ${cls}`} style={style}>
              {renderInline(block.content, `h-${idx}`)}
            </h4>
          );
        }

        if (block.type === 'code') {
          return (
            <pre key={idx} className={`as-md-pre ${cls}`} style={style}>
              {block.lang ? <span className="as-md-lang">{block.lang}</span> : null}
              <code>{block.content}</code>
            </pre>
          );
        }

        if (block.type === 'ul') {
          return (
            <ul key={idx} className={`as-md-list ${cls}`} style={style}>
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item, `ul-${idx}-${j}`)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ol') {
          return (
            <ol key={idx} className={`as-md-olist ${cls}`} style={style}>
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item, `ol-${idx}-${j}`)}</li>
              ))}
            </ol>
          );
        }

        if (block.type === 'quote') {
          return (
            <blockquote key={idx} className={`as-md-quote ${cls}`} style={style}>
              {renderInline(block.content, `q-${idx}`)}
            </blockquote>
          );
        }

        if (block.type === 'table') {
          return (
            <div key={idx} className={`as-md-table-wrap ${cls}`} style={style}>
              <table className="as-md-table">
                <thead>
                  <tr>
                    {block.headers.map((h, j) => (
                      <th key={j}>{renderInline(h, `th-${idx}-${j}`)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td key={c}>{renderInline(cell, `td-${idx}-${r}-${c}`)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return (
          <p key={idx} className={`as-md-p ${cls}`} style={style}>
            {block.lines.map((l, j) => (
              <span key={j}>
                {j > 0 ? <br /> : null}
                {renderInline(l, `p-${idx}-${j}`)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
