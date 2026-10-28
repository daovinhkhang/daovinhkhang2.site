/**
 * Tool contract shared by the Netlify function (schema sent to the model)
 * and the widget (which executes the calls against real page state).
 *
 * Keeping one source of truth stops the two drifting apart — the model is
 * only ever offered actions the page can genuinely perform.
 */

export const SYSTEMS = ['kami-pro', 'kami-community', 'kami-medusa', 'tasker', 'stt'];
export const EXPERIENCES = ['btaskee', 'erax', 'fptis', 'greenwich'];
export const SECTIONS = [
  'top',
  'about',
  'work',
  'capabilities',
  'experience',
  'education',
  'contact',
];

export const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'show_system',
      description:
        'Open a shipped system in the Work section and bring it into view. Use when the user asks what something is, how it works, or wants to see a project.',
      parameters: {
        type: 'object',
        properties: {
          system: {
            type: 'string',
            enum: SYSTEMS,
            description:
              'kami-pro = KAMI AI Agent Pro for Odoo. kami-community = KAMI Community Edition. kami-medusa = KAMI commerce/Medusa agent. tasker = Tasker V2-V5 platform. stt = Vietnamese speech-to-text.',
          },
          reason: {
            type: 'string',
            description: 'One short sentence, shown to the user, on why this is worth looking at.',
          },
        },
        required: ['system', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'open_experience',
      description:
        'Expand a role in the Experience section and scroll to it. Use for questions about employment, employers, or what he did at a company.',
      parameters: {
        type: 'object',
        properties: {
          company: { type: 'string', enum: EXPERIENCES },
          reason: { type: 'string', description: 'One short sentence shown to the user.' },
        },
        required: ['company', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'go_to_section',
      description:
        'Scroll to a section. Use for navigation requests ("show me your contact", "take me to education").',
      parameters: {
        type: 'object',
        properties: {
          section: { type: 'string', enum: SECTIONS },
          reason: { type: 'string', description: 'One short sentence shown to the user.' },
        },
        required: ['section', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'highlight',
      description:
        'Draw a temporary spotlight ring around a single element so the user can spot one detail you just described. Use sparingly, after scrolling somewhere.',
      parameters: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description:
              'A short CSS selector for a stable landmark, e.g. "#work .system-tabs", "#experience", "#contact a[href^=\'mailto:\']". Prefer ids and classes over deep paths.',
          },
          label: {
            type: 'string',
            description: 'A few words to show next to the ring, at most 40 characters.',
          },
        },
        required: ['selector', 'label'],
      },
    },
  },
];

export const TOOL_NAMES = TOOLS.map((t) => t.function.name);

/** Reject anything the model invents that the page cannot actually do. */
export function validateCall(name, args) {
  if (!TOOL_NAMES.includes(name)) return null;
  const a = args && typeof args === 'object' ? args : {};
  if (name === 'show_system' && SYSTEMS.includes(a.system)) return { system: a.system, reason: str(a.reason) };
  if (name === 'open_experience' && EXPERIENCES.includes(a.company))
    return { company: a.company, reason: str(a.reason) };
  if (name === 'go_to_section' && SECTIONS.includes(a.section)) return { section: a.section, reason: str(a.reason) };
  if (name === 'highlight' && typeof a.selector === 'string' && a.selector.length < 120)
    return { selector: a.selector.slice(0, 120), label: str(a.label).slice(0, 40) };
  return null;
}

function str(v) {
  return typeof v === 'string' ? v.slice(0, 160) : '';
}
