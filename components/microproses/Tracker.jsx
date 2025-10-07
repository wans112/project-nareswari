"use client";

import { useEffect } from 'react';

// Simple tracker: posts to /api/track but avoids duplicate hits per session per path
// TTL is milliseconds (default 5 minutes)
export default function Tracker({ ttl = 5 * 60 * 1000 }) {
  useEffect(() => {
    const path = window.location.pathname + window.location.search;
    try {
      const key = `pv:${path}`;
      const prev = sessionStorage.getItem(key);
      const now = Date.now();
      if (prev) {
        const t = Number(prev);
        if (!isNaN(t) && now - t < ttl) return; // skip duplicate
      }

      // record timestamp
      sessionStorage.setItem(key, String(now));

      const payload = {
        path,
        hostname: location.hostname,
        referrer: document.referrer || null,
        userAgent: navigator.userAgent || null,
        lang: navigator.language || null,
      };

      // fire-and-forget
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch (e) {
      // ignore sessionStorage errors in strict browsers
    }
  }, [ttl]);

  return null;
}
