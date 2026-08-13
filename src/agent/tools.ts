/**
 * The agent's tool surface.
 *
 * Two kinds of tools, and the split is the whole architecture:
 *
 *   - Data tools (`get_repository`, `list_issues`, ...) reach real external
 *     APIs. They return facts, never markup.
 *   - UI tools (`render_ui`) accept A2UI messages. They are validated against
 *     the design-system catalog and, on success, streamed to the renderer.
 *
 * The model decides which widget to build and when to refresh it; it never gets
 * to decide what a Card looks like.
 */

import type Anthropic from '@anthropic-ai/sdk';
import { designSystemCatalog } from '../a2ui/catalog/design-system';
import type { AgentToRendererMessage } from '../a2ui/protocol/types';
import { applyMessages } from '../a2ui/runtime/surface';
import { formatValidationFeedback, validateMessages } from '../a2ui/validate';
import type { Session } from '../server/sessions';
import { getRepository, listIssues, listReleases, searchRepositories } from './providers/github';
import { getWeather } from './providers/weather';

export const tools: Anthropic.Tool[] = [
  {
    name: 'get_repository',
    description:
      'Fetch live statistics for a public GitHub repository: stars, forks, watchers, open issues, language, license, topics and last push time. Use it before rendering or refreshing a repository widget.',
    input_schema: {
      type: 'object',
      properties: {
        repo: { type: 'string', description: 'Repository as "owner/name", e.g. "vercel/next.js".' },
      },
      required: ['repo'],
    },
  },
  {
    name: 'list_issues',
    description:
      'List recent issues or pull requests for a public GitHub repository, most recently updated first.',
    input_schema: {
      type: 'object',
      properties: {
        repo: { type: 'string', description: 'Repository as "owner/name".' },
        state: { type: 'string', enum: ['open', 'closed', 'all'], description: 'Defaults to open.' },
        limit: { type: 'integer', description: 'How many to return, 1-10. Defaults to 5.' },
      },
      required: ['repo'],
    },
  },
  {
    name: 'list_releases',
    description: 'List the most recent releases of a public GitHub repository.',
    input_schema: {
      type: 'object',
      properties: {
        repo: { type: 'string', description: 'Repository as "owner/name".' },
        limit: { type: 'integer', description: 'How many to return, 1-10. Defaults to 3.' },
      },
      required: ['repo'],
    },
  },
  {
    name: 'search_repositories',
    description:
      'Search GitHub for repositories matching a query, ranked by stars. Use it when the user describes a project instead of naming it.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'GitHub search query, e.g. "react state management".' },
        limit: { type: 'integer', description: 'How many results, 1-10. Defaults to 5.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_weather',
    description:
      'Fetch current conditions and a daily forecast for a place, from Open-Meteo. Temperatures come back in the unit you request.',
    input_schema: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City or place name, e.g. "Lisbon".' },
        unit: { type: 'string', enum: ['celsius', 'fahrenheit'], description: 'Defaults to celsius.' },
        days: { type: 'integer', description: 'Forecast days, 1-7. Defaults to 3.' },
      },
      required: ['location'],
    },
  },
  {
    name: 'render_ui',
    description: [
      'Send A2UI messages to the renderer. This is the only way to put a widget on screen.',
      'Pass a list of protocol messages: createSurface to introduce a new widget, updateDataModel to refresh',
      'the state of an existing one (preferred for live data), updateComponents to restructure one, and',
      'deleteSurface to remove one. Messages are validated against the catalog before anything renders; if',
      'validation fails nothing is shown and you receive the errors to correct.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        messages: {
          type: 'array',
          description: 'A2UI v1.0 messages, applied in order.',
          items: { type: 'object' },
        },
      },
      required: ['messages'],
    },
  },
];

export interface ToolContext {
  session: Session;
  /** Called with messages that passed validation, so they can be streamed out. */
  emit: (messages: AgentToRendererMessage[]) => void;
}

export interface ToolOutcome {
  content: string;
  isError?: boolean;
}

export async function runTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolOutcome> {
  try {
    switch (name) {
      case 'get_repository':
        return ok(await getRepository(String(input.repo ?? '')));

      case 'list_issues':
        return ok(
          await listIssues(String(input.repo ?? ''), {
            state: (input.state as 'open' | 'closed' | 'all') ?? 'open',
            limit: Number(input.limit ?? 5),
          }),
        );

      case 'list_releases':
        return ok(await listReleases(String(input.repo ?? ''), Number(input.limit ?? 3)));

      case 'search_repositories':
        return ok(await searchRepositories(String(input.query ?? ''), Number(input.limit ?? 5)));

      case 'get_weather':
        return ok(
          await getWeather(String(input.location ?? ''), {
            unit: (input.unit as 'celsius' | 'fahrenheit') ?? 'celsius',
            days: Number(input.days ?? 3),
          }),
        );

      case 'render_ui':
        return renderUi(input.messages, ctx);

      default:
        return { content: `Unknown tool "${name}".`, isError: true };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { content: `The call failed: ${message}`, isError: true };
  }
}

function ok(value: unknown): ToolOutcome {
  return { content: JSON.stringify(value) };
}

function renderUi(rawMessages: unknown, ctx: ToolContext): ToolOutcome {
  const validation = validateMessages(designSystemCatalog, rawMessages, ctx.session.surfaces);
  if (!validation.ok) {
    return { content: formatValidationFeedback(validation.issues), isError: true };
  }

  const messages = rawMessages as AgentToRendererMessage[];
  const result = applyMessages(ctx.session.surfaces, messages);
  if (result.error) {
    return { content: `VALIDATION_FAILED — ${result.error.message}`, isError: true };
  }

  ctx.session.surfaces = result.surfaces;
  ctx.emit(messages);

  const summary = Object.entries(ctx.session.surfaces)
    .map(([id, surface]) => `${id} (${Object.keys(surface.components).length} components)`)
    .join(', ');
  return {
    content: `Rendered. Live surfaces: ${summary || 'none'}. Do not repeat the widget's contents in your reply — the user can see it.`,
  };
}
