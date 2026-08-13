/**
 * A scripted stand-in for the model, used when no Anthropic key is configured.
 *
 * It is not a simulation of the renderer: it goes through the same `render_ui`
 * tool, the same catalog validation and the same surface store as the real
 * agent, and it calls the same live GitHub API. What it lacks is judgement —
 * it always builds the repository widget, where the real agent chooses.
 *
 * It exists so the protocol and the renderer can be demonstrated (and tested)
 * end to end without credentials.
 */

import type { A2uiComponent, AgentToRendererMessage } from '../a2ui/protocol/types';
import { A2UI_VERSION } from '../a2ui/protocol/types';
import { CATALOG_ID } from '../a2ui/catalog/design-system';
import type { Session } from '../server/sessions';
import { touch } from '../server/sessions';
import type { AgentEvent } from './runAgent';
import { getRepository, listIssues, listReleases, RepoSummary } from './providers/github';
import { isFixtureMode } from './providers/fixtures';
import { runTool } from './tools';

const DEFAULT_REPO = 'facebook/react';

interface ListState {
  title: string;
  items: { title: string; meta: string }[];
}

export async function* runMockAgent(
  session: Session,
  userMessage: string,
): AsyncGenerator<AgentEvent> {
  session.messages.push({ role: 'user', content: userMessage });
  touch(session);

  const action = parseAction(userMessage);

  try {
    if (action) {
      yield* handleAction(session, action);
      return;
    }

    const repoName = extractRepo(userMessage) ?? DEFAULT_REPO;
    const surfaceId = `repo-${Object.keys(session.surfaces).length + 1}`;

    yield { type: 'tool', name: 'get_repository', phase: 'start', detail: repoName };
    const repo = await getRepository(repoName);
    yield { type: 'tool', name: 'get_repository', phase: 'end' };

    const list = await loadIssues(repo.fullName);
    const messages = buildRepoSurface(surfaceId, repo, list);

    yield* emit(session, messages);
    yield {
      type: 'text',
      text: `Here's **${repo.fullName}**. The buttons fetch again and update this widget in place — the message is never re-rendered.`,
    };
    yield { type: 'done' };
  } catch (error) {
    yield { type: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

/* -------------------------------------------------------------------------- */
/* Actions                                                                    */
/* -------------------------------------------------------------------------- */

interface ParsedAction {
  name: string;
  surfaceId: string;
  context: Record<string, unknown>;
}

function parseAction(message: string): ParsedAction | null {
  if (!message.startsWith('[a2ui action]')) return null;
  const name = /name=(\S+)/.exec(message)?.[1];
  const surfaceId = /surface=(\S+)/.exec(message)?.[1];
  const contextRaw = /context=(\{[\s\S]*\})\s*$/.exec(message)?.[1];
  if (!name || !surfaceId) return null;
  let context: Record<string, unknown> = {};
  try {
    context = contextRaw ? JSON.parse(contextRaw) : {};
  } catch {
    context = {};
  }
  return { name, surfaceId, context };
}

async function* handleAction(session: Session, action: ParsedAction): AsyncGenerator<AgentEvent> {
  const surface = session.surfaces[action.surfaceId];
  if (!surface) {
    yield { type: 'error', message: `Surface "${action.surfaceId}" is no longer on screen.` };
    return;
  }
  const current = (surface.dataModel.repo ?? {}) as { fullName?: string };
  const repoName =
    typeof action.context.repo === 'string' && action.context.repo.trim()
      ? String(action.context.repo)
      : (current.fullName ?? DEFAULT_REPO);

  yield { type: 'tool', name: 'github', phase: 'start', detail: repoName };
  try {
    switch (action.name) {
      case 'refresh':
      case 'load_repo': {
        const repo = await getRepository(repoName);
        const list = await loadIssues(repo.fullName);
        yield { type: 'tool', name: 'github', phase: 'end' };
        yield* emit(session, [
          dataUpdate(action.surfaceId, '/repo', repoState(repo)),
          dataUpdate(action.surfaceId, '/list', list),
          dataUpdate(action.surfaceId, '/meta', meta(SOURCE_LABEL)),
        ]);
        yield {
          type: 'text',
          text: action.name === 'refresh' ? 'Refreshed.' : `Loaded **${repo.fullName}**.`,
        };
        break;
      }
      case 'show_issues': {
        const list = await loadIssues(repoName);
        yield { type: 'tool', name: 'github', phase: 'end' };
        yield* emit(session, [
          dataUpdate(action.surfaceId, '/list', list),
          dataUpdate(action.surfaceId, '/meta', meta('Showing open issues')),
        ]);
        break;
      }
      case 'show_releases': {
        const releases = await listReleases(repoName, 5);
        const list: ListState = {
          title: 'Latest releases',
          items: releases.length
            ? releases.map((release) => ({
                title: release.name,
                meta: relativeTime(release.publishedAt),
              }))
            : [{ title: 'This repository has no published releases.', meta: '—' }],
        };
        yield { type: 'tool', name: 'github', phase: 'end' };
        yield* emit(session, [
          dataUpdate(action.surfaceId, '/list', list),
          dataUpdate(action.surfaceId, '/meta', meta('Showing releases')),
        ]);
        break;
      }
      default:
        yield { type: 'tool', name: 'github', phase: 'end' };
        yield { type: 'error', message: `No handler for the "${action.name}" event.` };
        return;
    }
    yield { type: 'done' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    yield { type: 'tool', name: 'github', phase: 'end', detail: 'failed' };
    yield* emit(session, [dataUpdate(action.surfaceId, '/meta', meta(`Failed: ${message}`))]);
    yield { type: 'error', message };
  }
}

async function loadIssues(repo: string): Promise<ListState> {
  const issues = await listIssues(repo, { state: 'open', limit: 5 });
  return {
    title: 'Recently updated issues',
    items: issues.length
      ? issues.map((issue) => ({
          title: `#${issue.number} ${issue.title}`,
          meta: `${issue.comments} 💬`,
        }))
      : [{ title: 'No open issues.', meta: '—' }],
  };
}

/* -------------------------------------------------------------------------- */
/* Surface construction                                                       */
/* -------------------------------------------------------------------------- */

async function* emit(session: Session, messages: AgentToRendererMessage[]): AsyncGenerator<AgentEvent> {
  const accepted: AgentToRendererMessage[] = [];
  const outcome = await runTool('render_ui', { messages }, {
    session,
    emit: (applied) => accepted.push(...applied),
  });
  if (outcome.isError) {
    yield { type: 'error', message: outcome.content };
    return;
  }
  yield { type: 'a2ui', messages: accepted };
}

function dataUpdate(surfaceId: string, path: string, value: unknown): AgentToRendererMessage {
  return { version: A2UI_VERSION, updateDataModel: { surfaceId, path, value } };
}

function repoState(repo: RepoSummary) {
  return {
    fullName: repo.fullName,
    description: repo.description ?? 'No description.',
    avatar: repo.ownerAvatar,
    url: repo.htmlUrl,
    language: repo.language ?? 'n/a',
    stars: formatCount(repo.stars),
    forks: formatCount(repo.forks),
    watchers: formatCount(repo.watchers),
    issues: formatCount(repo.openIssues),
    pushed: relativeTime(repo.pushedAt),
  };
}

function meta(status: string) {
  return { status, updatedAt: new Date().toLocaleTimeString() };
}

/** Never let a fixture-backed widget claim to be showing live data. */
const SOURCE_LABEL = isFixtureMode()
  ? 'Synthetic fixture data (GENUI_DATA_SOURCE=fixtures)'
  : 'Live from the GitHub API';

function buildRepoSurface(
  surfaceId: string,
  repo: RepoSummary,
  list: ListState,
): AgentToRendererMessage[] {
  const components: A2uiComponent[] = [
    { id: 'root', component: 'Card', child: 'body' },
    {
      id: 'body',
      component: 'Column',
      gap: 'md',
      children: ['header', 'stats', 'divider', 'listTitle', 'list', 'actions', 'loadRow', 'footer'],
    },
    { id: 'header', component: 'Row', gap: 'md', align: 'center', children: ['avatar', 'titleBlock', 'lang'] },
    {
      id: 'avatar',
      component: 'Image',
      url: { path: '/repo/avatar' },
      alt: 'Repository owner',
      shape: 'circle',
      size: 'md',
    },
    { id: 'titleBlock', component: 'Column', gap: 'xs', weight: 1, children: ['name', 'description'] },
    { id: 'name', component: 'Text', text: { path: '/repo/fullName' }, variant: 'heading' },
    { id: 'description', component: 'Text', text: { path: '/repo/description' }, variant: 'caption' },
    { id: 'lang', component: 'Badge', label: { path: '/repo/language' }, tone: 'info', icon: 'code' },
    {
      id: 'stats',
      component: 'Row',
      gap: 'lg',
      wrap: true,
      children: ['starStat', 'forkStat', 'issueStat', 'watchStat'],
    },
    {
      id: 'starStat',
      component: 'Stat',
      label: 'Stars',
      value: { path: '/repo/stars' },
      icon: 'star',
      weight: 1,
    },
    {
      id: 'forkStat',
      component: 'Stat',
      label: 'Forks',
      value: { path: '/repo/forks' },
      icon: 'fork',
      weight: 1,
    },
    {
      id: 'issueStat',
      component: 'Stat',
      label: 'Open issues',
      value: { path: '/repo/issues' },
      icon: 'issue',
      weight: 1,
    },
    {
      id: 'watchStat',
      component: 'Stat',
      label: 'Watchers',
      value: { path: '/repo/watchers' },
      icon: 'watchers',
      delta: { call: 'formatString', args: { value: 'pushed ${/repo/pushed}' } },
      deltaTone: 'muted',
      weight: 1,
    },
    { id: 'divider', component: 'Divider' },
    { id: 'listTitle', component: 'Text', text: { path: '/list/title' }, variant: 'subheading' },
    {
      id: 'list',
      component: 'List',
      variant: 'divided',
      children: { componentId: 'listRow', path: '/list/items' },
    },
    {
      id: 'listRow',
      component: 'Row',
      gap: 'sm',
      justify: 'spaceBetween',
      align: 'center',
      children: ['rowTitle', 'rowMeta'],
    },
    { id: 'rowTitle', component: 'Text', text: { path: 'title' }, weight: 1 },
    { id: 'rowMeta', component: 'Badge', label: { path: 'meta' }, tone: 'neutral' },
    {
      id: 'actions',
      component: 'Row',
      gap: 'sm',
      wrap: true,
      children: ['refreshBtn', 'issuesBtn', 'releasesBtn', 'openBtn'],
    },
    {
      id: 'refreshBtn',
      component: 'Button',
      variant: 'primary',
      child: 'refreshLabel',
      action: {
        event: {
          name: 'refresh',
          userMessage: 'Refreshed the repository stats',
          context: { repo: { path: '/repo/fullName' } },
        },
      },
    },
    { id: 'refreshLabel', component: 'Text', text: 'Refresh' },
    {
      id: 'issuesBtn',
      component: 'Button',
      child: 'issuesLabel',
      action: {
        event: {
          name: 'show_issues',
          userMessage: 'Asked for open issues',
          context: { repo: { path: '/repo/fullName' } },
        },
      },
    },
    { id: 'issuesLabel', component: 'Text', text: 'Open issues' },
    {
      id: 'releasesBtn',
      component: 'Button',
      child: 'releasesLabel',
      action: {
        event: {
          name: 'show_releases',
          userMessage: 'Asked for releases',
          context: { repo: { path: '/repo/fullName' } },
        },
      },
    },
    { id: 'releasesLabel', component: 'Text', text: 'Releases' },
    {
      id: 'openBtn',
      component: 'Button',
      variant: 'ghost',
      child: 'openLabel',
      action: { functionCall: { call: 'openUrl', args: { url: { path: '/repo/url' } } } },
    },
    { id: 'openLabel', component: 'Text', text: 'Open on GitHub' },
    { id: 'loadRow', component: 'Row', gap: 'sm', align: 'end', children: ['repoField', 'loadBtn'] },
    {
      id: 'repoField',
      component: 'TextField',
      label: 'Load another repository',
      placeholder: 'owner/name',
      variant: 'search',
      weight: 1,
      value: { path: '/form/repo' },
      checks: [
        {
          condition: {
            call: 'regex',
            args: { value: { path: '/form/repo' }, pattern: '^[\\w.-]+/[\\w.-]+$' },
          },
          message: 'Use the form owner/name.',
        },
      ],
    },
    {
      id: 'loadBtn',
      component: 'Button',
      child: 'loadLabel',
      checks: [
        {
          condition: { call: 'required', args: { value: { path: '/form/repo' } } },
          message: 'Type a repository first.',
        },
        {
          condition: {
            call: 'regex',
            args: { value: { path: '/form/repo' }, pattern: '^[\\w.-]+/[\\w.-]+$' },
          },
          message: 'Use the form owner/name.',
        },
      ],
      action: {
        event: {
          name: 'load_repo',
          userMessage: 'Loaded a different repository',
          context: { repo: { path: '/form/repo' } },
        },
      },
    },
    { id: 'loadLabel', component: 'Text', text: 'Load' },
    {
      id: 'footer',
      component: 'Text',
      variant: 'caption',
      tone: 'muted',
      text: {
        call: 'formatString',
        args: { value: '${/meta/status} · updated ${/meta/updatedAt}' },
      },
    },
  ];

  return [
    {
      version: A2UI_VERSION,
      createSurface: {
        surfaceId,
        catalogId: CATALOG_ID,
        components,
        dataModel: {
          repo: repoState(repo),
          list,
          form: { repo: '' },
          meta: meta(SOURCE_LABEL),
        },
      },
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                 */
/* -------------------------------------------------------------------------- */

export function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'unknown';
  const minutes = Math.round((Date.now() - then) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function extractRepo(message: string): string | null {
  const url = /github\.com\/([\w.-]+\/[\w.-]+)/i.exec(message);
  if (url) return url[1].replace(/\.git$/, '');
  const slug = /\b([\w.-]+\/[\w.-]+)\b/.exec(message);
  return slug ? slug[1] : null;
}
