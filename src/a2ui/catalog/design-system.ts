/**
 * The catalog for this app's design system.
 *
 * Every entry here maps 1:1 to a React component in `src/design-system`. The
 * agent composes from this list and nothing else: there is no `style`, no
 * `className`, no colour and no pixel value anywhere in the vocabulary, only
 * named design-system variants. Whatever the model decides to render is
 * therefore on-brand by construction.
 */

import {
  action,
  binding,
  bool,
  CatalogDefinition,
  checks,
  child,
  childList,
  num,
  str,
  variant,
} from './define';

export const TONES = ['default', 'muted', 'accent', 'positive', 'warning', 'negative'] as const;
export const BADGE_TONES = ['neutral', 'info', 'positive', 'warning', 'negative'] as const;
export const TEXT_VARIANTS = [
  'display',
  'heading',
  'subheading',
  'body',
  'caption',
  'mono',
] as const;
export const GAPS = ['none', 'xs', 'sm', 'md', 'lg'] as const;
export const ICON_NAMES = [
  'star',
  'fork',
  'issue',
  'pullRequest',
  'release',
  'watchers',
  'code',
  'clock',
  'refresh',
  'search',
  'external',
  'check',
  'alert',
  'trendUp',
  'trendDown',
  'sun',
  'cloud',
  'rain',
  'snow',
  'wind',
  'thermometer',
] as const;

const instructions = `
## How to build a surface

1. A surface is a **flat list of components** referencing each other by id. The
   entry point is always the component with id \`root\`.
2. \`root\` must be a \`Card\` — it is the design system's chat-embedded widget
   frame. Put a \`Column\` inside it to stack content.
3. Separate **structure** from **state**. Anything that can change after the
   first render (numbers, labels, statuses, list items) belongs in the
   \`dataModel\` and is referenced with \`{"path": "/some/pointer"}\`. Structure
   is sent once; state is refreshed with \`updateDataModel\`.
4. To concatenate or interpolate strings use
   \`{"call": "formatString", "args": {"value": "\${/repo/stars} stars"}}\`.
   There are no operators and no template syntax outside that function.
5. Buttons that need work done — a network call, new data, a different view —
   use \`action.event\` with a stable \`name\`; you receive that event back and
   answer with \`updateDataModel\` (preferred) or \`updateComponents\`.
   Buttons that only need to open a link use
   \`action.functionCall\` with \`openUrl\`, which never leaves the browser.
6. Give every event a short \`userMessage\` so the transcript reads as a
   conversation ("Refreshed the stats").
7. Repeat lists with a children template:
   \`"children": {"componentId": "issue-row", "path": "/issues"}\`. Inside the
   template, paths are relative to the array item (\`{"path": "title"}\`).
8. Never invent props, component names, tones or variants. Anything outside
   this catalog is rejected and sent back to you as a validation error.
`.trim();

export const designSystemCatalog: CatalogDefinition = {
  catalogId: 'gen-ui.local:design-system/v1',
  title: 'Gen-UI Design System',
  description:
    'Chat-embedded widget primitives. Layout, typography, colour and spacing are owned by the design system; the agent only chooses composition, content and behaviour.',
  instructions,
  components: {
    Column: {
      description: 'Stacks children vertically.',
      props: {
        children: childList('Children of the stack.'),
        gap: variant('Vertical spacing between children.', GAPS, 'md'),
        align: variant('Cross-axis alignment.', ['start', 'center', 'end', 'stretch'], 'stretch'),
        justify: variant(
          'Main-axis distribution.',
          ['start', 'center', 'end', 'spaceBetween'],
          'start',
        ),
        weight: num('Flex weight when inside a Row or Column.', { dynamic: false }),
      },
      required: ['children'],
    },
    Row: {
      description: 'Arranges children horizontally. Wraps on narrow screens.',
      props: {
        children: childList('Children of the row.'),
        gap: variant('Horizontal spacing between children.', GAPS, 'md'),
        align: variant('Cross-axis alignment.', ['start', 'center', 'end', 'stretch'], 'center'),
        justify: variant(
          'Main-axis distribution.',
          ['start', 'center', 'end', 'spaceBetween'],
          'start',
        ),
        wrap: bool('Allow children to wrap onto a second line.', { dynamic: false }),
        weight: num('Flex weight when inside a Row or Column.', { dynamic: false }),
      },
      required: ['children'],
    },
    Card: {
      description:
        'The widget frame. Takes exactly one child — wrap multiple elements in a Column.',
      props: {
        child: child('The single child rendered inside the card.'),
        tone: variant('Surface treatment.', ['default', 'accent', 'muted'], 'default'),
        weight: num('Flex weight when inside a Row or Column.', { dynamic: false }),
      },
      required: ['child'],
    },
    Text: {
      description: 'Typographic block. Supports inline markdown emphasis only.',
      props: {
        text: str('The text to display.'),
        variant: variant('Typographic role.', TEXT_VARIANTS, 'body'),
        tone: variant('Semantic colour.', TONES, 'default'),
        weight: num('Flex weight when inside a Row or Column.', { dynamic: false }),
      },
      required: ['text'],
    },
    Badge: {
      description: 'Small status pill, e.g. a language, a state, a category.',
      props: {
        label: str('Badge label.'),
        tone: variant('Semantic colour.', BADGE_TONES, 'neutral'),
        icon: variant('Optional leading icon.', ICON_NAMES),
      },
      required: ['label'],
    },
    Stat: {
      description:
        'A single metric: big value, small label, optional delta. The workhorse for live data.',
      props: {
        label: str('What the number means.'),
        value: str('The value, pre-formatted for display.'),
        delta: str('Optional change indicator, e.g. "+12 today".'),
        deltaTone: variant('Colour of the delta.', ['positive', 'negative', 'muted'], 'muted'),
        icon: variant('Optional icon shown next to the label.', ICON_NAMES),
        weight: num('Flex weight when inside a Row or Column.', { dynamic: false }),
      },
      required: ['label', 'value'],
    },
    Button: {
      description: 'Triggers an agent event or a local function.',
      props: {
        child: child('Id of the Text or Icon rendered inside the button.'),
        variant: variant('Emphasis.', ['primary', 'secondary', 'ghost'], 'secondary'),
        action: action('What happens on click.'),
        checks: checks('Renderer-side checks; the button is disabled while any of them fails.'),
        disabled: bool('Disable the button.'),
        weight: num('Flex weight when inside a Row or Column.', { dynamic: false }),
      },
      required: ['child', 'action'],
    },
    TextField: {
      description: 'Single-line input. Writes straight into the data model as the user types.',
      props: {
        value: binding('Data model path holding the field value.'),
        label: str('Field label.'),
        placeholder: str('Placeholder text.'),
        variant: variant('Input mode.', ['text', 'number', 'search'], 'text'),
        checks: checks('Renderer-side validation rules.'),
        weight: num('Flex weight when inside a Row or Column.', { dynamic: false }),
      },
      required: ['value'],
    },
    List: {
      description: 'Vertical collection, usually driven by a children template.',
      props: {
        children: childList('Static ids, or a {componentId, path} template.'),
        variant: variant('Row separation.', ['plain', 'divided'], 'divided'),
        weight: num('Flex weight when inside a Row or Column.', { dynamic: false }),
      },
      required: ['children'],
    },
    Divider: {
      description: 'Horizontal rule.',
      props: {},
    },
    Image: {
      description: 'Remote image, e.g. an avatar or a logo.',
      props: {
        url: str('Image URL.'),
        alt: str('Accessible description.'),
        shape: variant('Cropping.', ['square', 'rounded', 'circle'], 'rounded'),
        size: variant('Rendered size.', ['sm', 'md', 'lg'], 'md'),
      },
      required: ['url', 'alt'],
    },
    Icon: {
      description: 'Glyph from the design system icon set.',
      props: {
        name: variant('Which glyph.', ICON_NAMES),
        tone: variant('Semantic colour.', TONES, 'default'),
        size: variant('Rendered size.', ['sm', 'md', 'lg'], 'md'),
      },
      required: ['name'],
    },
    ProgressBar: {
      description: 'Bounded progress or usage indicator.',
      props: {
        value: num('Progress from 0 to 100.'),
        label: str('Optional caption.'),
        tone: variant('Bar colour.', ['accent', 'positive', 'warning', 'negative'], 'accent'),
      },
      required: ['value'],
    },
    Spinner: {
      description: 'Indeterminate loading indicator, for state the agent is still fetching.',
      props: {
        label: str('Optional caption.'),
      },
    },
    Alert: {
      description: 'Inline message for errors, warnings and confirmations.',
      props: {
        title: str('Headline.'),
        message: str('Supporting text.'),
        tone: variant('Severity.', ['info', 'positive', 'warning', 'negative'], 'info'),
      },
      required: ['title'],
    },
  },
  functions: {
    formatString: {
      description:
        'Interpolates data model values into a string. Placeholders use ${/json/pointer} and may repeat.',
      args: { value: { description: 'Template string, e.g. "${/repo/stars} stars".', required: true } },
      returnType: 'string',
    },
    openUrl: {
      description: 'Opens a URL in a new tab. Runs locally in the renderer; the agent is not called.',
      args: { url: { description: 'Absolute https URL.', required: true } },
      returnType: 'void',
    },
    required: {
      description: 'Check that passes when the value is present and non-empty.',
      args: { value: { description: 'Usually a {"path": ...} binding.', required: true } },
      returnType: 'validationResult',
    },
    regex: {
      description: 'Check that passes when the value matches a regular expression.',
      args: {
        value: { description: 'Usually a {"path": ...} binding.', required: true },
        pattern: { description: 'JavaScript regular expression source.', required: true },
      },
      returnType: 'validationResult',
    },
  },
};

export const CATALOG_ID = designSystemCatalog.catalogId;
