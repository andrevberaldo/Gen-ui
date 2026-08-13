'use client';

/** The design system icon set. Catalog `Icon.name` values map here 1:1. */

import type { CSSProperties } from 'react';

export const ICON_PATHS: Record<string, string> = {
  star: 'M12 3.6l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.8l5.9-.9z',
  fork: 'M7 4.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm10 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 8.5v2a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-2M12 13.5v2m0 4a2 2 0 1 1 0-4 2 2 0 0 1 0 4z',
  issue: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zm0 4.5v5m0 3h.01',
  pullRequest:
    'M7 6.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm0 4v7m10-7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 0v4a3 3 0 0 1-3 3h-3m0 0l2.5-2.5M11 17.5l2.5 2.5M7 19.5a2 2 0 1 1 0-4 2 2 0 0 1 0 4z',
  release: 'M12 3.5l7 4v9l-7 4-7-4v-9zM5 7.5l7 4 7-4M12 11.5v8',
  watchers: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zm9.5 2.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z',
  code: 'M9 7.5L4.5 12 9 16.5M15 7.5L19.5 12 15 16.5',
  clock: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zm0 4v5l3.5 2',
  refresh: 'M20 12a8 8 0 1 1-2.4-5.7M20 4v4h-4',
  search: 'M11 4.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zm4.8 11.3L20.5 20.5',
  external: 'M14 4.5h5.5V10M19 5l-8 8M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10',
  check: 'M4.5 12.5l5 5 10-11',
  alert: 'M12 4l9 16H3zM12 10v4.5m0 3h.01',
  trendUp: 'M3.5 17.5l6-6 4 4 7-7m0 0h-5m5 0v5',
  trendDown: 'M3.5 6.5l6 6 4-4 7 7m0 0v-5m0 5h-5',
  sun: 'M12 7.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zM12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8',
  cloud: 'M7.5 18.5h9.8a3.7 3.7 0 0 0 .3-7.4A5.6 5.6 0 0 0 6.9 9.9a4.3 4.3 0 0 0 .6 8.6z',
  rain: 'M7.5 15.5h9.3a3.5 3.5 0 0 0 .3-7A5.3 5.3 0 0 0 7 7.2a4 4 0 0 0 .5 8.3zM8.5 18l-1 2.5M12.5 18l-1 2.5M16.5 18l-1 2.5',
  snow: 'M7.5 15.5h9.3a3.5 3.5 0 0 0 .3-7A5.3 5.3 0 0 0 7 7.2a4 4 0 0 0 .5 8.3zM9 19h.01M12 20.5h.01M15 19h.01',
  wind: 'M3.5 9h10a3 3 0 1 0-3-3M3.5 14h13a3 3 0 1 1-3 3M3.5 11.5h6',
  thermometer: 'M14 14.8V6a2 2 0 1 0-4 0v8.8a4 4 0 1 0 4 0z',
};

export type IconName = keyof typeof ICON_PATHS;

const SIZES: Record<string, number> = { sm: 14, md: 18, lg: 24 };

export interface IconProps {
  name: string;
  tone?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: CSSProperties;
}

export function Icon({ name, tone = 'default', size = 'md', style }: IconProps) {
  const path = ICON_PATHS[name];
  if (!path) return null;
  const px = SIZES[size] ?? SIZES.md;
  return (
    <svg
      className="ds-icon"
      data-tone={tone}
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={style}
    >
      <path d={path} />
    </svg>
  );
}
