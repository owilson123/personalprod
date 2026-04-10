'use client';

import { useState, useEffect, useCallback } from 'react';
import { SectionHeader } from '@/app/components/ui/SectionHeader';

interface Mover {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export function MarketMovers() {
  const [gainers, setGainers] = useState<Mover[]>([]);
  const [losers, setLosers] = useState<Mover[]>([]);
  const [tab, setTab] = useState<'gainers' | 'losers'>('gainers');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/finance/market-movers');
      if (res.ok) {
        const data = await res.json();
        setGainers(data.gainers || []);
        setLosers(data.losers || []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 120_000);
    return () => clearInterval(t);
  }, [load]);

  const items = tab === 'gainers' ? gainers : losers;

  const tabBtn = (key: 'gainers' | 'losers', label: string) => (
    <button
      onClick={() => setTab(key)}
      className="px-3 py-1 rounded-md text-xs font-semibold transition-all"
      style={{
        background: tab === key ? (key === 'gainers' ? 'rgba(0,208,132,0.12)' : 'rgba(255,71,87,0.12)') : 'transparent',
        color: tab === key ? (key === 'gainers' ? 'var(--accent-green)' : 'var(--accent-red)') : 'var(--text-muted)',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col">
      <SectionHeader title="Market Movers" action={
        <div className="flex gap-1">
          {tabBtn('gainers', 'Gainers')}
          {tabBtn('losers', 'Losers')}
        </div>
      } />
      <div className="px-3 pb-2 space-y-1">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div className="h-3 w-10 rounded animate-pulse" style={{ background: 'var(--bg-input)' }} />
              <div className="flex-1" />
              <div className="h-3 w-12 rounded animate-pulse" style={{ background: 'var(--bg-input)' }} />
            </div>
          ))
        ) : items.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: 12 }}>No data available</p>
        ) : items.map(stock => {
          const isUp = stock.changePercent >= 0;
          const color = isUp ? 'var(--accent-green)' : 'var(--accent-red)';
          return (
            <div key={stock.symbol}
              className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-input)')}
              onMouseOut={e => (e.currentTarget.style.background = 'var(--bg-card)')}>
              <span className="font-bold" style={{ fontSize: 12, width: 50, color: 'var(--text-main)' }}>{stock.symbol}</span>
              <span className="tabular-nums" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                ${stock.price?.toFixed(2)}
              </span>
              <span className="ml-auto px-2 py-0.5 rounded font-semibold tabular-nums" style={{
                fontSize: 10,
                color,
                background: isUp ? 'rgba(0,208,132,0.12)' : 'rgba(255,71,87,0.12)',
              }}>
                {isUp ? '+' : ''}{stock.changePercent?.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
