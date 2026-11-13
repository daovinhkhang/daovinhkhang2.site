/**
 * Tool contract shared by the proxy (schema sent to the model) and the widget
 * (which executes the calls against the real page).
 *
 * The model has full freedom to search, compose multi-step workflows, render
 * structured UI cards, run sandboxed JS in a Web Worker, and synthesize new
 * reusable tools in a governed registry — while every page interaction stays
 * validated through typed schemas and approval gates.
 */

import { TOUR_IDS } from './tour.js';

export const SYSTEMS = ['kami-pro', 'kami-community', 'kami-medusa', 'tasker', 'stt'];
export const EXPERIENCES = ['btaskee', 'erax', 'fptis', 'greenwich'];
export const SECTIONS = ['top', 'about', 'work', 'experience', 'capabilities', 'education', 'contact'];

/**
 * Named places the guide can point at. Resolved at run time, so a landmark
 * that depends on state (the open system's demo) always means the current one.
 */
export const LANDMARKS = {
  hero: { sel: '.hero-title', label: 'Opening' },
  stats: { sel: '.stats-grid', label: 'Headline numbers' },
  profile: { sel: '#about .split-copy', label: 'Profile' },
  'work-tabs': { sel: '#work .tabs', label: 'Shipped systems' },
  'system-summary': { sel: '#work .sys-copy', label: 'What it does' },
  'system-points': { sel: '#work .sys-copy .point-list', label: 'Key points' },
  'system-stack': { sel: '#work .sys-copy .tags', label: 'Stack' },
  'system-media': { sel: '#work .sys-media', label: 'Screenshot' },
  'system-demo': { sel: '#work .video-stack', label: 'Demo video' },
  'system-shots': { sel: '#work .shot-grid', label: 'Screenshots' },
  'experience-list': { sel: '#experience .exp-list', label: 'Roles' },
  'open-role': { sel: '#experience .exp-item.is-open', label: 'This role' },
  capabilities: { sel: '#capabilities .cap-grid', label: 'Capabilities' },
  method: { sel: '#capabilities .method', label: 'How he ships' },
  degree: { sel: '#education .edu-card', label: 'Degree' },
  publication: { sel: '#education .edu-card-pub', label: 'SSRN Paper #5023739' },
  'ssrn-paper': { sel: '#education .edu-card-pub a', label: 'SSRN Paper No. 5023739' },
  credentials: { sel: '.cred-strip', label: 'Credentials' },
  contact: { sel: '#contact .contact-grid', label: 'Contact' },
  'contact-form': { sel: '#contact-form', label: 'Contact form' },
  'contact-name': { sel: '#contact-name', label: 'Your name' },
  'contact-email-input': { sel: '#contact-email-input', label: 'Your email' },
  'contact-topic': { sel: '#contact-topic', label: 'Inquiry topic' },
  'contact-company': { sel: '#contact-company', label: 'Company or project' },
  'contact-message': { sel: '#contact-message', label: 'Message brief' },
  'contact-submit': { sel: '#contact-submit', label: 'Send inquiry' },
  'contact-email': { sel: '#contact a[href^="mailto:"]', label: 'Email' },
  'contact-phone': { sel: '#contact a[href^="tel:"]', label: 'Phone' },
  'contact-linkedin': { sel: '#contact a[href*="linkedin.com"]', label: 'LinkedIn' },
  'contact-github': { sel: '#contact a[href*="github.com"]', label: 'GitHub' },
  'odoo-listing': { sel: '#contact a[href*="apps.odoo.com"]', label: 'Odoo Apps Store' },
};
export const LANDMARK_IDS = Object.keys(LANDMARKS);

/** Places the pointer may press: the site's own contact links. */
export const PRESSABLE = ['contact-email', 'contact-phone', 'contact-linkedin', 'contact-github', 'odoo-listing', 'ssrn-paper'];

/** Things a reply button may open. The visitor's own click opens them. */
export const LINKS = {
  email: 'mailto:daovinhkhang0834@gmail.com',
  phone: 'tel:+84834684568',
  linkedin: 'https://www.linkedin.com/in/dao-vinh-khang-32748023a/',
  github: 'https://github.com/daovinhkhang',
  odoo: 'https://apps.odoo.com/apps/modules/19.0/kami_agent',
  ssrn: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5023739',
};
export const LINK_IDS = Object.keys(LINKS);

export const ARTIFACT_KINDS = ['card', 'table', 'comparison', 'jd_match', 'metrics', 'timeline', 'architecture'];
export const MOVE_POSITIONS = [
  'auto',
  'left',
  'right',
  'up',
  'down',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
  'reset',
];

export const CHAT_SIZES = ['keep', 'auto', 'compact', 'short', 'narrow', 'tall', 'wide', 'default'];

export const CONTACT_TOPICS = ['hiring', 'project', 'consulting', 'other'];
export const CONTACT_FIELDS = ['name', 'email', 'topic', 'company', 'message', 'submit'];

export const WORKFLOW_ACTIONS = [
  'navigate',
  'show_system',
  'open_experience',
  'point_at',
  'play_demo',
  'press',
  'copy_contact',
  'fill_contact',
  'move_chat',
  'wait',
];

const SAY = {
  type: 'string',
  description:
    'A few words shown to the visitor as this step happens, in their language — like a guide saying "Let me open KAMI Pro".',
};

const fn = (name, description, properties, required) => ({
  type: 'function',
  function: { name, description, parameters: { type: 'object', properties, required } },
});

export const TOOLS = [
  fn(
    'read_page',
    'Read granular details from a section only when CONTEXT does not already cover what was asked (never call it just for contact links, section intros, or summary facts already in CONTEXT). Silent.',
    {
      target: {
        type: 'string',
        enum: [
          ...new Set([
            ...SECTIONS,
            ...LANDMARK_IDS,
            'publication',
            ...SYSTEMS.map((s) => `system:${s}`),
            ...EXPERIENCES.map((e) => `role:${e}`),
          ]),
        ],
      },
    },
    ['target'],
  ),
  fn(
    'search_site',
    'Free-text search across the entire portfolio and full CV corpus (systems, experiences, capabilities, education, SSRN publication, metrics, links). Silent.',
    {
      query: { type: 'string', description: 'Keywords or topic to search for (e.g. "TURN_FACTS", "Kai", "Agent Lab", "SSRN 5023739").' },
    },
    ['query'],
  ),
  fn(
    'navigate',
    'Scroll the page to a section or landmark. Do not call navigate right before point_at or fill_contact — they already scroll into view automatically.',
    { to: { type: 'string', enum: [...SECTIONS, ...LANDMARK_IDS] }, say: SAY },
    ['to'],
  ),
  fn(
    'show_system',
    'Open one shipped system in the Work section and bring it into view.',
    {
      system: {
        type: 'string',
        enum: SYSTEMS,
        description:
          'kami-pro = KAMI AI Agent Pro for Odoo. kami-community = open-source edition for Odoo 19. kami-medusa = Medusa commerce agent. tasker = BeeTa & Kai Dual Agent Platform (V2-V5) at bTaskee. stt = Vietnamese speech-to-text (EraX-WoW-medium).',
      },
      say: SAY,
    },
    ['system'],
  ),
  fn(
    'open_experience',
    'Expand one role in the Experience section and bring it into view.',
    { company: { type: 'string', enum: EXPERIENCES }, say: SAY },
    ['company'],
  ),
  fn(
    'point_at',
    'Move your pointer proactively to highlight ONE target OR a sequence of 2-6 related landmarks in one turn (scrolls and dodges chat automatically), speaking concisely in the pointer mini-bubble at each stop. Whenever showing contact channels, multiple cards, or multi-part sections, always pass stops (2-6 items) instead of pointing lazily at just 1 item.',
    {
      target: { type: 'string', enum: LANDMARK_IDS, description: 'Single landmark ID when highlighting just one spot.' },
      note: { type: 'string', description: "Short caption shown in the cursor's mini bubble, in the visitor's language." },
      stops: {
        type: 'array',
        description: 'Ordered sequence of 2-6 landmarks to glide across proactively in one pass.',
        items: {
          type: 'object',
          properties: {
            target: { type: 'string', enum: LANDMARK_IDS },
            note: { type: 'string', description: 'Short punchy caption for this stop (<= 12 words).' },
          },
          required: ['target', 'note'],
        },
      },
      say: SAY,
    },
    [],
  ),
  fn(
    'play_demo',
    'Open a system and play its demo video (muted). Only kami-pro, kami-community and kami-medusa have demos.',
    { system: { type: 'string', enum: ['kami-pro', 'kami-community', 'kami-medusa'] }, say: SAY },
    ['system'],
  ),
  fn(
    'press',
    "Move the pointer to one of Khang's contact links or the Odoo listing and press it. Use when the visitor asks you to open, click or go to a link. Email and phone open the visitor's own mail or call app; a web link may be blocked by the browser, so also offer it as a reply button.",
    {
      target: { type: 'string', enum: PRESSABLE },
      say: SAY,
    },
    ['target'],
  ),
  fn(
    'copy_contact',
    "Copy Khang's email or phone number to the visitor's clipboard.",
    { what: { type: 'string', enum: ['email', 'phone'] }, say: SAY },
    ['what'],
  ),
  fn(
    'fill_contact',
    'Walk the visitor to #contact-form ONCE per turn: move the chat box aside so the whole form is clear, point and explain either one focus field OR smoothly guide the cursor step-by-step across ALL 6 sections (topic, name, email, company, message, submit) when walkthrough=true, and optionally pre-fill drafted fields. Never call fill_contact multiple times in a row or auto-submit; also write the complete field-by-field breakdown in your chat message.',
    {
      name: { type: 'string', description: 'Visitor full name (only if the visitor stated it).' },
      email: { type: 'string', description: 'Visitor email address (only if the visitor stated it).' },
      topic: { type: 'string', enum: CONTACT_TOPICS, description: 'Inquiry category: hiring, project, consulting, or other.' },
      company: { type: 'string', description: 'Company, team, or product name (if mentioned).' },
      message: {
        type: 'string',
        description: 'Well-structured draft message tailored to what the visitor wants to discuss with Dao Vinh Khang.',
      },
      focus: {
        type: 'string',
        enum: CONTACT_FIELDS,
        description: 'Which form field to spotlight or land on: name, email, topic, company, message, or submit.',
      },
      walkthrough: {
        type: 'boolean',
        description:
          'Set true when the visitor asks to be guided through each field / all sections ("hướng dẫn từng ô", "chỉ hết các ô", "walk me through the form"): glides the pointer and mini speech bubble through all 6 fields (topic -> name -> email -> company -> message -> submit) in one smooth pass.',
      },
      note: {
        type: 'string',
        description: 'Concise guidance caption shown in the mini bubble beside the cursor (in the visitor’s language).',
      },
      say: SAY,
    },
    [],
  ),
  fn(
    'move_chat',
    'Grab the chat box header or borders with your cursor to move AND/OR resize it (taller, shorter, narrower, wider, compact, or reset to default) so the active section stays unobstructed.',
    {
      position: {
        type: 'string',
        enum: MOVE_POSITIONS,
        description:
          'Where to place the box: auto picks a clear side/corner around the active target, or pick left, right, up, down, top-left, top-right, bottom-left, bottom-right, or reset.',
      },
      size: {
        type: 'string',
        enum: CHAT_SIZES,
        description:
          'Optional resize target pulled by its edges: short (lower height), tall (grow taller), narrow (trim width), wide (widen), compact (both smaller), default (full 410x700), auto (fit open pocket), or keep.',
      },
      say: SAY,
    },
    [],
  ),
  fn(
    'run_workflow',
    'Execute a multi-step sequence of page actions in a single smooth choreography (e.g. open a system, point at its stack, wait, then open a role). Saves round-trips.',
    {
      say: SAY,
      steps: {
        type: 'array',
        minItems: 1,
        maxItems: 6,
        items: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: WORKFLOW_ACTIONS },
            args: { type: 'object', description: 'Arguments matching the chosen action (or { ms: 800 } for wait).' },
          },
          required: ['action'],
        },
      },
    },
    ['steps'],
  ),
  fn(
    'render_view',
    'Render a structured card, table, comparison, JD match, metrics, timeline, or architecture diagram inside the chat.',
    {
      kind: { type: 'string', enum: ARTIFACT_KINDS },
      title: { type: 'string' },
      subtitle: { type: 'string' },
      badge: { type: 'string' },
      summary: { type: 'string' },
      score: { type: 'number' },
      columns: { type: 'array', items: { type: 'string' } },
      rows: { type: 'array', items: { type: 'array', items: { type: 'string' } } },
      items: { type: 'array', items: { type: 'object' } },
      matched: { type: 'array', items: { type: 'string' } },
      gaps: { type: 'array', items: { type: 'string' } },
      nodes: { type: 'array', items: { type: 'object' } },
      edges: { type: 'array', items: { type: 'object' } },
      tags: { type: 'array', items: { type: 'string' } },
      actions: { type: 'array', maxItems: 3, items: { type: 'object' } },
    },
    ['kind', 'title'],
  ),
  fn(
    'execute_code',
    'Run concise JS in an isolated Web Worker sandbox (no DOM/network, 1500ms timeout) with DATA (portfolio + CV) and ctx helpers (search, matchJD, card, table, comparison, jdMatch, metrics, timeline, architecture, showSystem, openExperience, navigate, pointAt, log).',
    {
      purpose: { type: 'string' },
      code: { type: 'string', description: 'Concise async JS body receiving (input, DATA, ctx); always return a value.' },
      input: { type: 'object' },
      say: SAY,
    },
    ['purpose', 'code'],
  ),
  fn(
    'create_tool',
    'Synthesize and register a reusable custom tool (`kind: "code"` in sandbox JS or `kind: "workflow"` page macro). Pass `run_now: true` with `test_input` to register, test, and render its output/artifact immediately in one step.',
    {
      name: { type: 'string', description: 'snake_case, 2-40 chars: ^[a-z][a-z0-9_]{1,39}$' },
      description: { type: 'string' },
      kind: { type: 'string', enum: ['code', 'workflow'] },
      parameters: { type: 'string' },
      code: { type: 'string', description: 'Concise async JS body receiving (input, DATA, ctx).' },
      steps: {
        type: 'array',
        maxItems: 6,
        items: {
          type: 'object',
          properties: { action: { type: 'string', enum: WORKFLOW_ACTIONS }, args: { type: 'object' } },
          required: ['action'],
        },
      },
      test_input: { type: 'object' },
      run_now: { type: 'boolean', description: 'Set true to execute immediately and display any produced artifact.' },
      requires_approval: { type: 'boolean' },
      say: SAY,
    },
    ['name', 'description', 'kind'],
  ),
  fn(
    'run_custom_tool',
    'Execute a custom tool previously created with `create_tool` (or shown in SYNTHESIZED CUSTOM TOOLS).',
    {
      name: { type: 'string', description: 'Exact registered tool name.' },
      input: { type: 'object', description: 'JSON input payload passed to the custom tool.' },
      say: SAY,
    },
    ['name'],
  ),
  fn(
    'suggest_replies',
    "Offer 2-4 tappable next steps under your answer, written in the visitor's language. A reply is either a follow-up question they can send, or a link they can open (email, phone, linkedin, github, odoo, ssrn). Call this at the end of most turns.",
    {
      replies: {
        type: 'array',
        minItems: 1,
        maxItems: 4,
        items: {
          type: 'object',
          properties: {
            label: { type: 'string', description: 'At most 32 characters.' },
            ask: { type: 'string', description: 'The message sent when tapped. Omit for a link.' },
            link: { type: 'string', enum: LINK_IDS },
          },
          required: ['label'],
        },
      },
    },
    ['replies'],
  ),
  fn(
    'start_tour',
    'Hand the page over to a guided tour that walks stop to stop on its own. Use when they want a tour, an overview, or "show me around". You choose the route and the words.',
    {
      intro: { type: 'string', description: 'One short sentence before the first stop.' },
      stops: {
        type: 'array',
        minItems: 2,
        maxItems: 6,
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', enum: TOUR_IDS },
            note: { type: 'string', description: 'One or two sentences for this stop, in your own words.' },
          },
          required: ['id', 'note'],
        },
      },
    },
    ['stops', 'intro'],
  ),
];

export const TOOL_NAMES = TOOLS.map((t) => t.function.name);
export const REPLY_TOOLS = TOOLS.filter((t) => t.function.name === 'suggest_replies');

const READ_TARGETS = new Set(TOOLS[0].function.parameters.properties.target.enum);
const TOOL_NAME_RE = /^[a-z][a-z0-9_]{1,39}$/;

function validateWorkflowSteps(rawSteps) {
  if (!Array.isArray(rawSteps)) return [];
  const out = [];
  for (const s of rawSteps.slice(0, 6)) {
    if (!s || typeof s !== 'object') continue;
    const action = s.action;
    if (!WORKFLOW_ACTIONS.includes(action)) continue;
    if (action === 'wait') {
      const ms = Math.min(2500, Math.max(100, Number(s.args?.ms ?? s.ms ?? 600) || 600));
      out.push({ action: 'wait', args: { ms } });
      continue;
    }
    const valid = validateCall(action, s.args || {});
    if (valid) out.push({ action, args: valid });
  }
  return out;
}

/** Validate & normalize any generative UI artifact (from render_view or sandbox). */
export function normalizeArtifact(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const kind = ARTIFACT_KINDS.includes(raw.kind) ? raw.kind : 'card';
  const title = str(raw.title, 100);
  if (!title) return null;

  const actions = (Array.isArray(raw.actions) ? raw.actions : [])
    .map((a) => {
      if (!a || typeof a !== 'object') return null;
      const label = str(a.label, 36);
      if (!label) return null;
      if (SYSTEMS.includes(a.system)) return { label, system: a.system };
      if (EXPERIENCES.includes(a.company)) return { label, company: a.company };
      if (SECTIONS.includes(a.to) || LANDMARKS[a.to]) return { label, to: a.to };
      if (LINK_IDS.includes(a.link)) return { label, link: a.link };
      return null;
    })
    .filter(Boolean)
    .slice(0, 3);

  const columns = (Array.isArray(raw.columns) ? raw.columns : []).map((c) => str(c, 48)).filter(Boolean).slice(0, 6);
  const rawRows = Array.isArray(raw.rows) ? raw.rows : [];
  const rows = rawRows
    .filter((r) => Array.isArray(r))
    .slice(0, 12)
    .map((r) => r.slice(0, 6).map((cell) => str(String(cell ?? ''), 180)));

  // Gracefully accept object items if model passed { label, value, detail } into `rows`
  const rowObjects = rawRows.filter((r) => r && !Array.isArray(r) && typeof r === 'object');
  const rawItems = [...(Array.isArray(raw.items) ? raw.items : []), ...rowObjects];

  const items = rawItems
    .filter((it) => it && typeof it === 'object')
    .slice(0, 10)
    .map((it) => ({
      label: str(it.label, 80),
      value: str(it.value ?? '', 140),
      detail: str(it.detail ?? '', 220),
    }))
    .filter((it) => it.label || it.value);

  const nodes = (Array.isArray(raw.nodes) ? raw.nodes : [])
    .filter((n) => n && typeof n === 'object')
    .slice(0, 8)
    .map((n, i) => ({
      id: str(n.id || `n${i}`, 24),
      label: str(n.label, 48),
      detail: str(n.detail, 90),
    }))
    .filter((n) => n.label);

  const edges = (Array.isArray(raw.edges) ? raw.edges : [])
    .filter((e) => e && typeof e === 'object')
    .slice(0, 10)
    .map((e) => ({
      from: str(e.from, 24),
      to: str(e.to, 24),
      label: str(e.label, 36),
    }))
    .filter((e) => e.from && e.to);

  const scoreRaw = Number(raw.score);
  const score = Number.isFinite(scoreRaw) ? Math.min(100, Math.max(0, Math.round(scoreRaw))) : null;

  return {
    kind,
    title,
    subtitle: str(raw.subtitle, 140),
    badge: str(raw.badge, 32),
    summary: str(raw.summary, 420),
    score,
    columns,
    rows,
    items,
    matched: (Array.isArray(raw.matched) ? raw.matched : []).map((x) => str(x, 140)).filter(Boolean).slice(0, 8),
    gaps: (Array.isArray(raw.gaps) ? raw.gaps : []).map((x) => str(x, 140)).filter(Boolean).slice(0, 6),
    nodes,
    edges,
    tags: (Array.isArray(raw.tags) ? raw.tags : []).map((x) => str(x, 36)).filter(Boolean).slice(0, 10),
    actions,
  };
}

/** Reject anything the page cannot actually do; trim everything shown. */
export function validateCall(name, args) {
  if (!TOOL_NAMES.includes(name)) return null;
  const a = args && typeof args === 'object' ? args : {};
  const say = str(a.say, 120);

  switch (name) {
    case 'read_page':
      return READ_TARGETS.has(a.target) ? { target: a.target } : null;
    case 'search_site': {
      const query = str(a.query, 160);
      return query ? { query } : null;
    }
    case 'navigate':
      return SECTIONS.includes(a.to) || LANDMARKS[a.to] ? { to: a.to, say } : null;
    case 'show_system':
      return SYSTEMS.includes(a.system) ? { system: a.system, say } : null;
    case 'open_experience':
      return EXPERIENCES.includes(a.company) ? { company: a.company, say } : null;
    case 'point_at': {
      const rawStops = Array.isArray(a.stops)
        ? a.stops
            .filter((s) => s && typeof s === 'object' && LANDMARKS[s.target])
            .slice(0, 6)
            .map((s) => ({ target: s.target, note: str(s.note, 160) }))
        : [];
      if (rawStops.length) {
        return {
          target: rawStops[0].target,
          note: rawStops[0].note,
          stops: rawStops,
          say: say || rawStops[0].note,
        };
      }
      if (!LANDMARKS[a.target]) return null;
      const note = str(a.note, 160);
      return { target: a.target, note, stops: [{ target: a.target, note }], say: say || note };
    }
    case 'play_demo':
      return ['kami-pro', 'kami-community', 'kami-medusa'].includes(a.system) ? { system: a.system, say } : null;
    case 'press':
      return PRESSABLE.includes(a.target) ? { target: a.target, say } : null;
    case 'copy_contact':
      return a.what === 'email' || a.what === 'phone' ? { what: a.what, say } : null;
    case 'fill_contact': {
      const out = {};
      if (typeof a.name === 'string' && a.name.trim()) out.name = str(a.name, 120);
      if (typeof a.email === 'string' && a.email.trim()) out.email = str(a.email, 160);
      if (CONTACT_TOPICS.includes(a.topic)) out.topic = a.topic;
      if (typeof a.company === 'string' && a.company.trim()) out.company = str(a.company, 140);
      if (typeof a.message === 'string' && a.message.trim()) out.message = str(a.message, 2500);
      const focus = CONTACT_FIELDS.includes(a.focus) ? a.focus : '';
      const walkthrough = Boolean(a.walkthrough);
      const note = str(a.note, 200);
      if (!Object.keys(out).length && !focus && !walkthrough && !note && !say) return null;
      return { ...out, focus, walkthrough, note, say };
    }
    case 'move_chat': {
      const hasPos = MOVE_POSITIONS.includes(a.position);
      const hasSize = CHAT_SIZES.includes(a.size);
      if (!hasPos && !hasSize) return null;
      return {
        position: hasPos ? a.position : 'auto',
        size: hasSize ? a.size : a.position === 'reset' ? 'default' : 'keep',
        say,
      };
    }
    case 'run_workflow': {
      const steps = validateWorkflowSteps(a.steps);
      return steps.length ? { steps, say } : null;
    }
    case 'render_view':
      return normalizeArtifact(a);
    case 'execute_code': {
      const purpose = str(a.purpose, 120);
      const code = typeof a.code === 'string' ? a.code.trim().slice(0, 6000) : '';
      if (!code) return null;
      return {
        purpose: purpose || 'Sandbox computation',
        code,
        input: a.input && typeof a.input === 'object' ? a.input : {},
        say,
      };
    }
    case 'create_tool': {
      const toolName = str(a.name, 40).toLowerCase();
      const description = str(a.description, 220);
      const kind = a.kind === 'workflow' ? 'workflow' : a.kind === 'code' ? 'code' : '';
      if (!TOOL_NAME_RE.test(toolName) || !description || !kind) return null;
      if (kind === 'code') {
        const code = typeof a.code === 'string' ? a.code.trim().slice(0, 6000) : '';
        if (!code) return null;
        return {
          name: toolName,
          description,
          kind,
          parameters: str(a.parameters, 180),
          code,
          testInput: a.test_input && typeof a.test_input === 'object' ? a.test_input : null,
          runNow: Boolean(a.run_now),
          requiresApproval: Boolean(a.requires_approval),
          say,
        };
      }
      const steps = validateWorkflowSteps(a.steps);
      if (!steps.length) return null;
      const sensitive = steps.some((s) => s.action === 'press' || s.action === 'copy_contact');
      return {
        name: toolName,
        description,
        kind,
        parameters: str(a.parameters, 180),
        steps,
        runNow: Boolean(a.run_now),
        requiresApproval: a.requires_approval !== undefined ? Boolean(a.requires_approval) : sensitive,
        say,
      };
    }
    case 'run_custom_tool': {
      const toolName = str(a.name, 40).toLowerCase();
      if (!TOOL_NAME_RE.test(toolName)) return null;
      return {
        name: toolName,
        input: a.input && typeof a.input === 'object' ? a.input : {},
        say,
      };
    }
    case 'suggest_replies': {
      if (!Array.isArray(a.replies)) return null;
      const replies = a.replies
        .map((r) => ({
          label: str(r?.label, 32),
          ask: str(r?.ask, 200),
          link: LINK_IDS.includes(r?.link) ? r.link : '',
        }))
        .filter((r) => r.label && (r.ask || r.link))
        .slice(0, 4);
      return replies.length ? { replies } : null;
    }
    case 'start_tour': {
      if (!Array.isArray(a.stops)) return null;
      const stops = a.stops
        .filter((x) => x && TOUR_IDS.includes(x.id))
        .slice(0, 6)
        .map((x) => ({ id: x.id, note: str(x.note, 240) }));
      return stops.length >= 2 ? { stops, intro: str(a.intro, 200) } : null;
    }
    default:
      return null;
  }
}

function str(v, max = 160) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}
