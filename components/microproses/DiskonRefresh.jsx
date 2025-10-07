"use client";
import { useEffect } from 'react';

export default function DiskonRefresh({ enabled = true }) {
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    // fire-and-forget: calling GET will trigger server-side auto-deactivate
    fetch('/api/diskon?include_all=1', { method: 'GET', cache: 'no-store' })
      .then(() => {})
      .catch(() => {})
      .finally(() => { cancelled = true; });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return null;
}
