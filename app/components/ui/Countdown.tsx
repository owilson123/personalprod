'use client';

import { pad } from '@/lib/helpers';

export function Countdown({ startMin, endMin, now }: { startMin: number; endMin: number; now: Date }) {
  const nowSec   = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const startSec = startMin * 60;
  const endSec   = endMin * 60;

  if (nowSec >= endSec) return null;

  if (nowSec < startSec) {
    const secsUntil = startSec - nowSec;
    const h = Math.floor(secsUntil / 3600);
    const m = Math.floor((secsUntil % 3600) / 60);
    return (
      <span style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.75 }} className="font-mono">
        {h > 0 ? `in ${h}h ${m}m` : `in ${m}m`}
      </span>
    );
  }

  const secsLeft = endSec - nowSec;
  const h = Math.floor(secsLeft / 3600);
  const m = Math.floor((secsLeft % 3600) / 60);
  const s = secsLeft % 60;
  return (
    <span style={{ fontSize: 10, color: '#10b981', fontWeight: 600 }} className="font-mono">
      {h > 0 ? `${pad(h)}:` : ''}{pad(m)}:{pad(s)} left
    </span>
  );
}
