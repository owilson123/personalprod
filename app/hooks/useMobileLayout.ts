'use client';
import { useState, useLayoutEffect } from 'react';

export function useMobileLayout() {
  const [isMobile, setIsMobile] = useState(false);

  // useLayoutEffect fires synchronously after DOM paint, before the user
  // sees anything — avoids the server(false) → client(true) flash
  useLayoutEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
