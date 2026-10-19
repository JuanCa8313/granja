'use client';

import { useEffect } from 'react';

function enviarAssetsActualesAlSW(sw: ServiceWorker | null) {
  if (!sw || typeof document === 'undefined') return;

  const urls = new Set<string>([
    window.location.href,
    '/',
    '/manifest.webmanifest',
  ]);

  document.querySelectorAll<HTMLScriptElement>('script[src]').forEach((s) => {
    if (s.src && s.src.startsWith(window.location.origin)) {
      urls.add(s.src);
    }
  });

  document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]').forEach((l) => {
    if (l.href && l.href.startsWith(window.location.origin)) {
      urls.add(l.href);
    }
  });

  sw.postMessage({
    type: 'CACHE_CURRENT_PAGE_ASSETS',
    urls: Array.from(urls),
  });
}

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => {
        console.warn('[PWA Granja Hub] Error registrando Service Worker:', err);
      });

    navigator.serviceWorker.ready
      .then((reg) => {
        enviarAssetsActualesAlSW(reg.active);
      })
      .catch(() => {});
  }, []);

  return null;
}
