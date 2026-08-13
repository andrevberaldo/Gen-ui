/**
 * GitHub REST API provider.
 *
 * Real, unauthenticated calls against api.github.com (60 requests/hour per IP;
 * set GITHUB_TOKEN to raise that). These are the "external API" half of the
 * demo: the agent calls them, then decides how to render the result.
 *
 * Setting GENUI_DATA_SOURCE=fixtures swaps them for clearly-labelled synthetic
 * data so the protocol can be demonstrated where api.github.com is unreachable.
 */

import {
  fixtureIssues,
  fixtureReleases,
  fixtureRepository,
  fixtureSearch,
  isFixtureMode,
} from './fixtures';

const API = 'https://api.github.com';

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

async function githubFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${API}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'gen-ui-a2ui-poc',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const response = await fetch(url, { headers, cache: 'no-store' });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new ProviderError(
      body.message ?? `GitHub responded with ${response.status}`,
      response.status,
    );
  }
  return (await response.json()) as T;
}

export interface RepoSummary {
  fullName: string;
  description: string | null;
  htmlUrl: string;
  ownerAvatar: string;
  language: string | null;
  license: string | null;
  topics: string[];
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  defaultBranch: string;
  pushedAt: string;
  archived: boolean;
  fetchedAt: string;
}

export async function getRepository(repo: string): Promise<RepoSummary> {
  const slug = normalizeRepo(repo);
  if (isFixtureMode()) return fixtureRepository(slug);
  const data = await githubFetch<Record<string, any>>(`/repos/${slug}`);
  return {
    fullName: data.full_name,
    description: data.description,
    htmlUrl: data.html_url,
    ownerAvatar: data.owner?.avatar_url ?? '',
    language: data.language,
    license: data.license?.spdx_id ?? null,
    topics: Array.isArray(data.topics) ? data.topics.slice(0, 6) : [],
    stars: data.stargazers_count,
    forks: data.forks_count,
    watchers: data.subscribers_count ?? data.watchers_count,
    openIssues: data.open_issues_count,
    defaultBranch: data.default_branch,
    pushedAt: data.pushed_at,
    archived: Boolean(data.archived),
    fetchedAt: new Date().toISOString(),
  };
}

export interface IssueSummary {
  number: number;
  title: string;
  author: string;
  comments: number;
  createdAt: string;
  url: string;
  labels: string[];
  isPullRequest: boolean;
}

export async function listIssues(
  repo: string,
  { state = 'open', limit = 5 }: { state?: 'open' | 'closed' | 'all'; limit?: number } = {},
): Promise<IssueSummary[]> {
  const slug = normalizeRepo(repo);
  if (isFixtureMode()) return fixtureIssues(slug, limit);
  const data = await githubFetch<Record<string, any>[]>(`/repos/${slug}/issues`, {
    state,
    per_page: String(Math.min(Math.max(limit, 1), 10)),
    sort: 'updated',
  });
  return data.map((issue) => ({
    number: issue.number,
    title: issue.title,
    author: issue.user?.login ?? 'unknown',
    comments: issue.comments,
    createdAt: issue.created_at,
    url: issue.html_url,
    labels: (issue.labels ?? []).map((label: any) => label.name).slice(0, 3),
    isPullRequest: Boolean(issue.pull_request),
  }));
}

export interface ReleaseSummary {
  name: string;
  tag: string;
  publishedAt: string;
  url: string;
  isPrerelease: boolean;
}

export async function listReleases(repo: string, limit = 3): Promise<ReleaseSummary[]> {
  const slug = normalizeRepo(repo);
  if (isFixtureMode()) return fixtureReleases(slug, limit);
  const data = await githubFetch<Record<string, any>[]>(`/repos/${slug}/releases`, {
    per_page: String(Math.min(Math.max(limit, 1), 10)),
  });
  return data.map((release) => ({
    name: release.name || release.tag_name,
    tag: release.tag_name,
    publishedAt: release.published_at,
    url: release.html_url,
    isPrerelease: Boolean(release.prerelease),
  }));
}

export interface RepoSearchResult {
  fullName: string;
  description: string | null;
  stars: number;
  language: string | null;
  url: string;
}

export async function searchRepositories(query: string, limit = 5): Promise<RepoSearchResult[]> {
  if (isFixtureMode()) return fixtureSearch(query, limit);
  const data = await githubFetch<{ items: Record<string, any>[] }>('/search/repositories', {
    q: query,
    per_page: String(Math.min(Math.max(limit, 1), 10)),
    sort: 'stars',
  });
  return data.items.map((item) => ({
    fullName: item.full_name,
    description: item.description,
    stars: item.stargazers_count,
    language: item.language,
    url: item.html_url,
  }));
}

/** Accepts "owner/repo" or a github.com URL. */
export function normalizeRepo(input: string): string {
  const trimmed = input.trim().replace(/^https?:\/\/(www\.)?github\.com\//i, '');
  const [owner, name] = trimmed.replace(/\.git$/, '').split('/');
  if (!owner || !name) {
    throw new ProviderError(`"${input}" is not a valid repository. Use the form "owner/repo".`);
  }
  return `${owner}/${name}`;
}
