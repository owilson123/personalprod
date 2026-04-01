'use client';

import { pad } from '@/lib/helpers';

export function Countdown({ endMin, now }: { endMin: number; now: Date }) {
  const curMin = now.getHours() * 60 + now.getMinutes();
  const sec    = (endMin - curMin) * 60 - now.getSeconds();
  if (sec <= 0) return <span style={{ color: '#ff4757', fontSize: 10 }} className="font-mono">Done</span>;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return (
    <span style={{ fontSize: 10, opacity: .7 }} className="font-mono">
      {h > 0 ? `${pad(h)}:` : ''}{pad(m)}:{pad(s)}
    </span>
  );
}
