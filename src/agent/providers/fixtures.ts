/**
 * Offline fixtures.
 *
 * Opt-in only, via `GENUI_DATA_SOURCE=fixtures`. They exist so the protocol,
 * the renderer and the action round trip can be demonstrated and tested where
 * api.github.com is unreachable (locked-down CI, a sandboxed environment, a
 * plane). The numbers are **synthetic** — deterministic from the repository
 * name, not recorded from GitHub — and every widget built from them is labelled
 * as fixture data so a demo can never be mistaken for live data.
 */

import type { IssueSummary, ReleaseSummary, RepoSearchResult, RepoSummary } from './github';

export function isFixtureMode(): boolean {
  return process.env.GENUI_DATA_SOURCE === 'fixtures';
}

/** Small deterministic hash so a given repo always yields the same numbers. */
function seed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

const LANGUAGES = ['TypeScript', 'JavaScript', 'Rust', 'Python', 'Go'];

export function fixtureRepository(slug: string): RepoSummary {
  const base = seed(slug);
  const [owner] = slug.split('/');
  return {
    fullName: slug,
    description: 'Synthetic fixture data — this widget is not showing live GitHub numbers.',
    htmlUrl: `https://github.com/${slug}`,
    ownerAvatar: `https://avatars.githubusercontent.com/${owner}`,
    language: LANGUAGES[base % LANGUAGES.length],
    license: 'MIT',
    topics: ['fixture', 'demo'],
    stars: 1000 + (base % 90000),
    forks: 100 + (base % 9000),
    watchers: 50 + (base % 900),
    openIssues: 5 + (base % 400),
    defaultBranch: 'main',
    pushedAt: new Date(Date.now() - (base % 72) * 3600_000).toISOString(),
    archived: false,
    fetchedAt: new Date().toISOString(),
  };
}

export function fixtureIssues(slug: string, limit: number): IssueSummary[] {
  const base = seed(slug);
  const titles = [
    'Hydration mismatch when streaming a nested layout',
    'Document the incremental update path',
    'Renderer drops the template scope on deep lists',
    'Add a dark-mode token for elevated surfaces',
    'Validation error messages should include the pointer',
    'Support keyboard focus rings inside widgets',
  ];
  return titles.slice(0, Math.min(Math.max(limit, 1), titles.length)).map((title, index) => ({
    number: 1000 + ((base + index * 37) % 9000),
    title,
    author: ['ana', 'kai', 'mira', 'tobi'][(base + index) % 4],
    comments: (base + index * 13) % 24,
    createdAt: new Date(Date.now() - (index + 1) * 86_400_000).toISOString(),
    url: `https://github.com/${slug}/issues/${1000 + index}`,
    labels: index % 2 === 0 ? ['bug'] : ['docs'],
    isPullRequest: false,
  }));
}

export function fixtureReleases(slug: string, limit: number): ReleaseSummary[] {
  const base = seed(slug);
  return Array.from({ length: Math.min(Math.max(limit, 1), 5) }, (_value, index) => {
    const minor = 12 - index;
    return {
      name: `v3.${minor}.0`,
      tag: `v3.${minor}.0`,
      publishedAt: new Date(Date.now() - (index + 1) * 14 * 86_400_000).toISOString(),
      url: `https://github.com/${slug}/releases/tag/v3.${minor}.0`,
      isPrerelease: (base + index) % 7 === 0,
    };
  });
}

export function fixtureSearch(query: string, limit: number): RepoSearchResult[] {
  const base = seed(query);
  const owners = ['acme', 'northwind', 'globex', 'initech', 'umbrella'];
  return Array.from({ length: Math.min(Math.max(limit, 1), 5) }, (_value, index) => {
    const slug = `${owners[(base + index) % owners.length]}/${query.split(/\s+/)[0] || 'project'}-${index + 1}`;
    return {
      fullName: slug,
      description: 'Synthetic fixture result.',
      stars: 500 + ((base + index * 911) % 40000),
      language: LANGUAGES[(base + index) % LANGUAGES.length],
      url: `https://github.com/${slug}`,
    };
  });
}
