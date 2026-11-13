/**
 * Tool contract shared by the proxy (schema sent to the model) and the widget
 * (which executes the calls against the real page).
 *
 * The model is free to choose *what* to do and in what order — it can chain
 * several actions in one turn, read the page before answering, and offer its
 * own next steps. What it cannot do is invent a target: every action resolves
 * to a landmark that genuinely exists, so freedom never turns into a broken
 * selector or a hallucinated section.
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
  'hero': { sel: '.hero-title', label: 'Opening' },
  'stats': { sel: '.stats-grid', label: 'Headline numbers' },
  'profile': { sel: '#about .split-copy', label: 'Profile' },
  'work-tabs': { sel: '#work .tabs', label: 'Shipped systems' },
  'system-summary': { sel: '#work .sys-copy', label: 'What it does' },
  'system-points': { sel: '#work .sys-copy .point-list', label: 'Key points' },
  'system-stack': { sel: '#work .sys-copy .tags', label: 'Stack' },
  'system-media': { sel: '#work .sys-media', label: 'Screenshot' },
  'system-demo': { sel: '#work .video-stack', label: 'Demo video' },
  'system-shots': { sel: '#work .shot-grid', label: 'Screenshots' },
  'experience-list': { sel: '#experience .exp-list', label: 'Roles' },
  'open-role': { sel: '#experience .exp-item.is-open', label: 'This role' },
  'capabilities': { sel: '#capabilities .cap-grid', label: 'Capabilities' },
  'method': { sel: '#capabilities .method', label: 'How he ships' },
  'degree': { sel: '#education .edu-card', label: 'Degree' },
  'credentials': { sel: '.cred-strip', label: 'Credentials' },
  'contact': { sel: '#contact .contact-grid', label: 'Contact' },
  'contact-email': { sel: '#contact a[href^="mailto:"]', label: 'Email' },
  'contact-phone': { sel: '#contact a[href^="tel:"]', label: 'Phone' },
  'contact-linkedin': { sel: '#contact a[href*="linkedin.com"]', label: 'LinkedIn' },
  'contact-github': { sel: '#contact a[href*="github.com"]', label: 'GitHub' },
  'odoo-listing': { sel: '#contact a[href*="apps.odoo.com"]', label: 'Odoo Apps Store' },
};
export const LANDMARK_IDS = Object.keys(LANDMARKS);

/** Places the pointer may press: the site's own contact links. */
export const PRESSABLE = ['contact-email', 'contact-phone', 'contact-linkedin', 'contact-github', 'odoo-listing'];


/** Things a reply button may open. The visitor's own click opens them. */
export const LINKS = {
  email: 'mailto:daovinhkhang0834@gmail.com',
  phone: 'tel:+84834684568',
  linkedin: 'https://www.linkedin.com/in/dao-vinh-khang-32748023a/',
  github: 'https://github.com/daovinhkhang',
  odoo: 'https://apps.odoo.com/apps/modules/19.0/kami_agent',
};
export const LINK_IDS = Object.keys(LINKS);

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
    'Read the live text of part of the page. Use it whenever you need more detail than CONTEXT has (bullet points of a role, the exact wording of a system, what a section says). The visitor does not see this; it only informs you.',
    {
      target: {
        type: 'string',
        enum: [...SECTIONS, ...LANDMARK_IDS, ...SYSTEMS.map((s) => `system:${s}`), ...EXPERIENCES.map((e) => `role:${e}`)],
      },
    },
    ['target'],
  ),
  fn(
    'navigate',
    'Scroll the page to a section or landmark. The chat stays visible beside the page, so moving is cheap — do it whenever seeing it helps.',
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
          'kami-pro = KAMI AI Agent Pro for Odoo. kami-community = open-source edition for Odoo 19. kami-medusa = Medusa commerce agent. tasker = Tasker V2-V5 at bTaskee. stt = Vietnamese speech-to-text.',
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
    'Move your pointer to one landmark, ring it, and pin a short note next to it — the way a guide points while talking. Chain several to walk through details.',
    {
      target: { type: 'string', enum: LANDMARK_IDS },
      note: { type: 'string', description: 'One short sentence pinned beside it, in the visitor\'s language.' },
    },
    ['target', 'note'],
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
    'suggest_replies',
    'Offer 2-4 tappable next steps under your answer, written in the visitor\'s language. A reply is either a follow-up question they can send, or a link they can open (email, phone, linkedin, github, odoo). Call this at the end of most turns.',
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

const READ_TARGETS = new Set(TOOLS[0].function.parameters.properties.target.enum);

/** Reject anything the page cannot actually do; trim everything shown. */
export function validateCall(name, args) {
  if (!TOOL_NAMES.includes(name)) return null;
  const a = args && typeof args === 'object' ? args : {};
  const say = str(a.say, 120);

  switch (name) {
    case 'read_page':
      return READ_TARGETS.has(a.target) ? { target: a.target } : null;
    case 'navigate':
      return SECTIONS.includes(a.to) || LANDMARKS[a.to] ? { to: a.to, say } : null;
    case 'show_system':
      return SYSTEMS.includes(a.system) ? { system: a.system, say } : null;
    case 'open_experience':
      return EXPERIENCES.includes(a.company) ? { company: a.company, say } : null;
    case 'point_at':
      return LANDMARKS[a.target] ? { target: a.target, note: str(a.note, 160) } : null;
    case 'play_demo':
      return ['kami-pro', 'kami-community', 'kami-medusa'].includes(a.system) ? { system: a.system, say } : null;
    case 'press':
      return PRESSABLE.includes(a.target) ? { target: a.target, say } : null;
    case 'copy_contact':
      return a.what === 'email' || a.what === 'phone' ? { what: a.what, say } : null;
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
