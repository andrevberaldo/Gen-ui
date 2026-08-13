import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    // Agent-supplied avatars come from GitHub; the renderer uses a plain <img>,
    // so this only documents the expected remote origins.
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '*.githubusercontent.com' },
    ],
  },
};

export default config;
