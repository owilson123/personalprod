'use client';

import { useState, useEffect, useCallback } from 'react';

interface MarketIndex {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export function MarketSummaryBar() {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/finance/market-summary');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setIndices(data);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center gap-6 px-4 py-3" style={{ background: 'linear-gradient(135deg, #12131a, #161722)' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-3 w-16 rounded animate-pulse" style={{ background: '#242530' }} />
            <div className="h-4 w-14 rounded animate-pulse" style={{ background: '#242530' }} />
          </div>
        ))}
      </div>
    );
  }

  if (!indices.length) return null;

  return (
    <div className="flex items-center gap-1 px-3 py-2.5 shrink-0 overflow-x-auto"
      style={{ background: 'linear-gradient(135deg, #12131a, #161722)', borderBottom: '1px solid #1e1f2a' }}>
      {indices.map((idx, i) => {
        const isUp = idx.changePercent >= 0;
        const color = isUp ? '#00d084' : '#ff4757';
        return (
          <div key={idx.symbol} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ minWidth: 0 }}>
            {i > 0 && <div className="w-px h-6 mr-1" style={{ background: '#2a2b3d' }} />}
            <span style={{ fontSize: 11, color: '#8b8ca0', fontWeight: 500 }}>{idx.name}</span>
            <span className="font-semibold tabular-nums" style={{ fontSize: 12, color: '#f0f0f5' }}>
              ${idx.price?.toFixed(2)}
            </span>
            <span className="px-1.5 py-0.5 rounded font-semibold tabular-nums" style={{
              fontSize: 10,
              color,
              background: isUp ? 'rgba(0,208,132,0.12)' : 'rgba(255,71,87,0.12)',
            }}>
              {isUp ? '+' : ''}{idx.changePercent?.toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
