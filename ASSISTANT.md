# On-site assistant

The chat widget in the bottom-right corner. It looks like Vinamilk's drawer
(measured, not eyeballed) but it also **drives the page**: ask it to show you
something and it will open the right tab, scroll there, and point at it.

## How it works

```
browser ──POST /api/chat──▶ netlify/functions/chat.mjs ──▶ model provider
   ▲  │                          (adds the key, sanitises the loop)
   │  ▼
   │  tool_calls ──▶ director.js acts on the page ──▶ truthful result
   └──────────────── sent back as a `tool` message ◀──┘
```

The model runs as an **agent loop in the browser** (`converse` in
`client.js`): it may call tools, sees what actually happened, and decides the
next step — up to six steps per turn — before it answers. That is what lets it
read the page, open the right system, point at the detail, play the demo and
only then explain, all in one turn.

The provider rejects cross-origin requests, so the browser never calls it
directly. The proxy attaches the key, offers the model the tool list from
`tools.js` (the client cannot inject its own), and keeps only well-formed loop
messages: known tool names, bounded sizes, and tool results that answer a call
present in the transcript.

## Run it locally

```bash
cp .env.example .env.local     # then paste the key into UPSTREAM_KEY
npm run dev                    # http://localhost:5173
```

`vite.config.js` mounts `netlify/functions/chat.mjs` at `/api/chat`, so local
development exercises the **real** handler — not a mock. On boot it prints
either `live model enabled` or a warning that `UPSTREAM_KEY` is missing.

Note that `VITE_`-prefixed variables are the only ones Vite exposes to client
code, and `UPSTREAM_KEY` deliberately is not one of them: the plugin copies it
into `process.env` for the server-side handler only.

## Setup

Set one environment variable in Netlify → Site settings → Environment variables:

| Variable | Required | Default |
| --- | --- | --- |
| `UPSTREAM_KEY` | yes | — |
| `UPSTREAM_URL` | no | `https://api-sf1-cdn.deploy.com/api/v1/chat/completions` |
| `UPSTREAM_MODEL` | no | `zai-org/glm-5.3-flash` |
| `UPSTREAM_REASONING` | no | `low` |

Without `UPSTREAM_KEY` the function returns `501` and the widget **falls back to
the curated knowledge base** in `src/assistant/knowledge.js` — the site never
shows a dead chat box.

## Files

| File | Role |
| --- | --- |
| `AssistantWidget.jsx` | drawer, companion mode, launcher, thread state |
| `client.js` | the agent loop, history shaping, local fallback |
| `director.js` | executes a call on the page: pointer, spotlight, notes, scroll |
| `tools.js` | tool schemas, landmarks and links, shared by proxy and client |
| `src/content.js` | page content, rendered by App and read by `read_page` |
| `knowledge.js` | curated answers used when the API is unavailable |
| `memory.js` | localStorage profile, style inference, viewport context |
| `tour.js` | tour stops, fallback narration, default route |
| `TourBar.jsx` | the docent bar: meter, dots, narration, controls |
| `netlify/functions/chat.mjs` | server-side proxy |
| `src/App.jsx` | listens for `ai:show-system` and `ai:open-experience` |

Pronouns are a pair, not something to copy: echoing the visitor's "mình" made
the assistant call itself by the visitor's word. The prompt now maps casual to
mình/bạn and formal to em/anh-chị, and Khang is always "Khang" or "anh Khang".

Only two lines couple the widget to the app: the `CustomEvent` dispatch in
`director.js` and the matching listeners in `App.jsx`.

## Tools the model may call

The model chooses freely what to do and in what order; it cannot choose a
target that does not exist. Every target is an enum resolved by `validateCall`.

| Tool | Effect |
| --- | --- |
| `read_page` | returns live text of a section, landmark, system or role (silent) |
| `navigate` | scrolls to a section or landmark |
| `show_system` | pointer presses the tab, the system opens |
| `open_experience` | pointer presses the role, the accordion opens |
| `point_at` | pointer flies to a landmark, rings it, pins a note beside it |
| `play_demo` | opens a KAMI system and plays its demo, muted |
| `copy_contact` | copies email or phone; reports honestly if the browser blocks it |
| `suggest_replies` | 2–4 buttons in the visitor's language: a follow-up or a link |
| `start_tour` | hands over to the self-advancing tour with its own route |

Links (email, phone, LinkedIn, GitHub, Odoo listing) are never opened by the
model: it offers them as buttons and the visitor's own click opens them.

Facts stay pinned: the model may only state what is in `CONTEXT` or what
`read_page` returned. `read_page` reads `src/content.js`, the same objects the
page renders, so the guide cannot quote a stale copy.

## Companion mode and effects

The drawer no longer leaves when the guide acts. It morphs (0.42s, same curve
as the drawer) into a **companion**: a 380px card in the corner on desktop, a
bottom sheet with a grab handle on phones. The scrim and scroll lock go away,
so the page moves and stays usable, and the composer stays live — the visitor
can ask the next thing while the current walk plays. Expand returns to the full
drawer; the shrink button lets the visitor choose companion mode themselves.

What the visitor sees while the guide works:

- a **pointer** with a "K" tag that flies from the chat to each target and
  "presses" tabs and accordions with a ripple
- a **spotlight** ring plus a **pinned note** that flips above or below the
  target and clamps to a 16px gutter, so it never runs off a phone screen
- a **wait bubble that talks**: "Đợi mình chút nhé…" after 0.6s, then a line
  for whatever is happening ("Để mình mở phần bTaskee…", "Mình chỉ cho bạn chỗ
  này…"), and a fresh line after every 3.4s of silence. Lines live in
  `voice.js` for Vietnamese (mình/bạn or em/anh-chị) and English, and never use
  technical words
- **steps** in the thread ("Mở KAMI Pro cho bạn xem nhé") with a tick each,
  and typing dots while the model decides the next one
- answers that **arrive word by word** instead of popping in
- scrolls that are **awaited until the page settles** (`scrollend`, or 120ms of
  stillness), and that aim for the band between the header and the bottom
  sheet on phones

`prefers-reduced-motion` turns every flight, morph and word reveal into an
instant change.

## The guided tour

Ask for "the tour", "a walkthrough", or "show me around" and the assistant stops
chatting and becomes a docent: it picks its own route, closes the drawer, and
walks the page stop to stop.

The route is **composed per visitor**, not fixed. Asked for a RAG role it goes
work → metrics → stack; asked for a general overview it goes hero → about →
work → capabilities → experience → contact. `tour.js` holds the stops and their
fallback narration; the model supplies the order and may rewrite every line.

While touring:

- the bar advances on its own every 7s, so it leads rather than waits
- the meter at the top refills per stop and mirrors that timer exactly
- Pause freezes both the meter and the timer; Back and Next override the pace
- each stop scrolls, then rings its element with a labelled spotlight
- the spotlight is disposed between stops and on exit, so nothing is stranded
- Finish returns to the conversation with the transcript intact

The tour bar is its own surface rather than a mode of the drawer: a modal cannot
show the thing it is describing, and the drawer's scrim would cover it.

## Memory and voice

The assistant keeps a small profile on the visitor's own machine in
`localStorage` (`khang.assistant.v1`) — nothing is stored server-side and the
proxy is stateless.

What it remembers:

| Field | Use |
| --- | --- |
| `messages` | the last 10 turns, restored into the thread on return |
| `visits`, `firstSeen`, `lastSeen` | "visit 3, last seen 2 days ago" |
| `style` | language, register, pronouns, emoji, average message length |
| `shown` | sections and systems already opened, so it stops re-walking them |
| `topics` | what was already discussed |

`inferStyle` reads the visitor's own messages, not the assistant's: Vietnamese
register is mostly carried by pronouns and sentence-final particles
(`mình/bạn/nhé` versus `anh/chị/ạ`), so those drive the classification. The
result is compressed to three lines and sent as the `VISITOR` block:

```
- Returning visitor: visit 2, last seen just now.
- Writes in Vietnamese · register: casual · their own pronouns: "mình" · no emoji · messages average 9 words.
- Write the way they write: match that formality and use the counterpart of
  their pronouns (they say "mình" → you call them "bạn"), keep your sentences
  about as long as theirs, and never sound more formal than they do.
- Currently looking at: work.
- Already shown: tasker. Do not walk them back to something unless they ask.
```

Same question, two profiles, demonstrably different voice:

> **casual** — "KAMI là bộ công cụ AI của Khang, gồm mấy phần chính… Bạn muốn tìm hiểu phần nào hơn không?"
>
> **formal** — "KAMI là lớp AI làm việc chạy bên trong Odoo 17–19… Anh/chị muốn tìm hiểu phần nào thêm ạ?"

`currently looking at` comes from `currentSection()`, which reads the viewport
at the moment the message is sent, so the assistant knows which section is on
screen rather than guessing from the transcript.

The **profile is built synchronously from the transcript** before the request
goes out. Reading it from React state was one render stale, which meant the
first message of a visit carried no style at all.

A returning visitor sees "Continuing from your last visit" above the restored
thread with a **Start fresh** control that clears storage and resets the chat.

## Language

The assistant replies in whatever language the visitor writes in — Vietnamese,
English, Japanese, German, anything — and keeps product names untranslated. The
rule lives in `SYSTEM_PROMPT`; the follow-up turn after a page action repeats it
so the language does not snap back to English mid-flow. Tour narration is
written by the model, so it follows the same rule.

The **fallback** is the exception: when no API key is configured, answers come
from the curated English text in `knowledge.js` and the tour uses the English
narration in `tour.js`. That path cannot translate.

## Known limits

- Answers are grounded in the `CONTEXT` block in `client.js`. Keep it in sync
  with the page when facts change.
- Latency is roughly 1.2–1.5s per model step. A walk of three or four actions
  takes 8–15s end to end; the steps and pointer keep it from feeling idle.
- Clipboard writes outside a direct click are blocked by some browsers (Safari
  always). The tool reports that back and the model gives the address instead.
- `reasoning_effort: 'low'` is set explicitly. The default spends ~600 hidden
  reasoning tokens per answer; `'none'` is worse, because the model then leaks
  its deliberation into the visible reply ("The user is asking about...").
