'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export function Clock() {
  const [txt, setTxt] = useState('');
  useEffect(() => {
    const tick = () => setTxt(format(new Date(), 'HH:mm:ss'));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  if (!txt) return <div className="h-4 w-16 rounded animate-pulse" style={{ background: '#1a1b23' }} />;
  return <span className="tabular-nums" style={{ fontSize: 11, color: '#52536a', letterSpacing: '0.03em' }}>{txt}</span>;
}
