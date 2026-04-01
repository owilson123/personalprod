'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export function Clock() {
  const [txt, setTxt] = useState('');
  useEffect(() => {
    const tick = () => setTxt(format(new Date(), 'EEEE, MMMM d yyyy — HH:mm:ss'));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  if (!txt) return <div className="h-5 w-72 rounded animate-pulse" style={{ background: '#1a1b23' }} />;
  return <span className="text-sm font-medium tabular-nums" style={{ color: '#8b8ca0' }}>{txt}</span>;
}
