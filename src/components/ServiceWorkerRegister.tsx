'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA Granja Hub] Service Worker registrado:', reg.scope);
      })
      .catch((err) => {
        console.error('[PWA Granja Hub] Error registrando Service Worker:', err);
      });
  }, []);

  return null;
}
