import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ShifaClear — Multilingual Med & Lab Demystifier',
    short_name: 'ShifaClear',
    description:
      'MD-guardrailed UAE lab report & prescription demystifier across English, Arabic, Urdu, Tagalog, and Hindi.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F9F8',
    theme_color: '#0F766E',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
