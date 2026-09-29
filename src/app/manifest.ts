import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Granja OS Hub 🚜',
    short_name: 'Granja Hub',
    description: 'Portal maestro de negocios agropecuarios y balance general de la granja a 2.200 msnm',
    start_url: '/',
    id: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0F172A',
    theme_color: '#D97706',
    categories: ['business', 'productivity', 'finance'],
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
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
