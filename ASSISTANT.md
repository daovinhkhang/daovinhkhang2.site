# On-site assistant

The chat widget in the bottom-right corner. It looks like Vinamilk's drawer
(measured, not eyeballed) but it also **drives the page**: ask it to show you
something and it will open the right tab, scroll there, and point at it.

## How it works

```
browser ──POST /api/chat──▶ netlify/functions/chat.mjs ──▶ model provider
   │                              (adds the bearer key)
   │
   ├─ no tool call  → answer in the drawer
   └─ tool call     → drawer steps aside, page moves, then the answer arrives
```

The provider rejects cross-origin requests, so the browser can never call it
directly. `netlify/functions/chat.mjs` is a thin proxy that attaches the key
server-side and folds the SSE stream back into one JSON body.

## Setup

Set one environment variable in Netlify → Site settings → Environment variables:

| Variable | Required | Default |
| --- | --- | --- |
| `UPSTREAM_KEY` | yes | — |
| `UPSTREAM_URL` | no | `https://api-sf1-cdn.deploy.com/api/v1/chat/completions` |
| `UPSTREAM_MODEL` | no | `zai-org/glm-5.3-flash` |

Without `UPSTREAM_KEY` the function returns `501` and the widget **falls back to
the curated knowledge base** in `src/assistant/knowledge.js` — the site never
shows a dead chat box.

## Files

| File | Role |
| --- | --- |
| `AssistantWidget.jsx` | drawer, launcher, narration bar, message state |
| `client.js` | proxy calls, history shaping, local fallback |
| `director.js` | executes a tool call against real DOM / page state |
| `tools.js` | one tool schema shared by the function and the client |
| `knowledge.js` | curated answers used when the API is unavailable |
| `netlify/functions/chat.mjs` | server-side proxy |
| `src/App.jsx` | listens for `ai:show-system` and `ai:open-experience` |

Only two lines couple the widget to the app: the `CustomEvent` dispatch in
`director.js` and the matching listeners in `App.jsx`.

## Tools the model may call

| Tool | Effect |
| --- | --- |
| `show_system` | switches the Work tab, scrolls to it |
| `open_experience` | expands a role, scrolls to it |
| `go_to_section` | scrolls to a section |
| `highlight` | draws a spotlight ring around one element |

Every call is validated in `validateCall` before it runs — the model cannot
invent a system id, and a bad selector is swallowed rather than thrown.

## Why the drawer gets out of the way

The drawer is modal: it has a scrim and locks body scroll. Driving the page
underneath it would be invisible, and `window.scrollTo` is a no-op while the
body is locked. So when the model calls a tool the drawer slides out, the
scroll lock is released, the page moves, and a slim narration bar explains what
just happened. Tapping the bar returns to the conversation.

## Known limits

- Answers are grounded in the `CONTEXT` block in `client.js`. Keep it in sync
  with the page when facts change.
- The model occasionally answers a navigation request in words instead of
  calling a tool. It is a soft preference, not a guarantee.
- Latency is roughly 1.2–2.5s per turn. A tool turn costs two round trips
  because the follow-up turn asks the model to explain what it just did.
