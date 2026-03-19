'use client';

import { useEffect } from 'react';

export default function PWAInit() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
          console.log('[v0] Stale Service Worker unregistered');
        }
      });

      // Listen for updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[v0] Service Worker controller changed');
      });
    }
  }, []);

  return null;
}
