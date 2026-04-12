'use client';

import { useState, useEffect, useCallback } from 'react';
import { SectionHeader } from '@/app/components/ui/SectionHeader';
import { SparklineChart } from './SparklineChart';
import { AddSymbolModal } from './AddSymbolModal';

interface WatchlistStock {
  id: string;
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  changePercent?: number;
  sparkline?: { time: number; value: number }[];
}

const DEFAULT_WATCHLIST = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'NVDA', name: 'NVIDIA' },
];

export function StockWatchlist() {
  const [stocks, setStocks] = useState<WatchlistStock[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = useCallback(async () => {
    try {
      const res = await fetch('/api/watchlist');
      if (res.ok) {
        const items = await res.json();
        if (items.length === 0) {
          // Seed default watchlist
          await Promise.all(DEFAULT_WATCHLIST.map(s =>
            fetch('/api/watchlist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(s),
            })
          ));
          const seeded = await fetch('/api/watchlist');
          if (seeded.ok) return await seeded.json();
        }
        return items;
      }
    } catch { /* silent */ }
    return DEFAULT_WATCHLIST.map((s, i) => ({ id: `default-${i}`, ...s }));
  }, []);

  const fetchQuotes = useCallback(async (symbols: string[]) => {
    if (!symbols.length) return {};
    try {
      const res = await fetch(`/api/finance/quote?symbols=${symbols.join(',')}`);
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, { price: number; change: number; changePercent: number }> = {};
        data.forEach((q: { symbol: string; price: number; change: number; changePercent: number }) => {
          map[q.symbol] = q;
        });
        return map;
      }
    } catch { /* silent */ }
    return {};
  }, []);

  const fetchSparklines = useCallback(async (symbols: string[]) => {
    const map: Record<string, { time: number; value: number }[]> = {};
    await Promise.all(symbols.map(async (s) => {
      try {
        const res = await fetch(`/api/finance/sparkline?symbol=${s}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) map[s] = data;
        }
      } catch { /* silent */ }
    }));
    return map;
  }, []);

  const loadAll = useCallback(async () => {
    const items = await fetchWatchlist();
    const symbols = items.map((i: { symbol: string }) => i.symbol);
    const [quotes, sparklines] = await Promise.all([
      fetchQuotes(symbols),
      fetchSparklines(symbols),
    ]);

    setStocks(items.map((item: WatchlistStock) => ({
      ...item,
      ...(quotes[item.symbol] || {}),
      sparkline: sparklines[item.symbol] || [],
    })));
    setLoading(false);
  }, [fetchWatchlist, fetchQuotes, fetchSparklines]);

  useEffect(() => {
    loadAll();
    const t = setInterval(loadAll, 60_000);
    return () => clearInterval(t);
  }, [loadAll]);

  const removeStock = async (id: string) => {
    setStocks(p => p.filter(s => s.id !== id));
    try { await fetch(`/api/watchlist/${id}`, { method: 'DELETE' }); } catch { /* silent */ }
  };

  const onSymbolAdded = () => {
    setShowAdd(false);
    loadAll();
  };

  const addButton = (
    <button onClick={() => setShowAdd(true)}
      className="flex items-center justify-center w-6 h-6 rounded-md transition-all"
      style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)', fontSize: 16, border: '1px solid var(--border-main)', cursor: 'pointer' }}
      onMouseOver={e => { e.currentTarget.style.background = 'var(--border-main)'; e.currentTarget.style.color = 'var(--text-main)'; }}
      onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-input)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
      +
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      <SectionHeader title="Watchlist" action={addButton} accent="#f59e0b" />
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-2 space-y-1">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div className="h-3 w-12 rounded animate-pulse" style={{ background: 'var(--bg-input)' }} />
              <div className="flex-1" />
              <div className="h-3 w-16 rounded animate-pulse" style={{ background: 'var(--bg-input)' }} />
            </div>
          ))
        ) : stocks.map(stock => {
          const isUp = (stock.changePercent ?? 0) >= 0;
          const color = isUp ? 'var(--accent-green)' : 'var(--accent-red)';
          return (
            <div key={stock.id}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1 group transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-input)')}
              onMouseOut={e => (e.currentTarget.style.background = 'var(--bg-card)')}>
              <div className="flex flex-col min-w-0" style={{ width: 48 }}>
                <span className="font-bold truncate" style={{ fontSize: 11, color: 'var(--text-main)' }}>{stock.symbol}</span>
                <span className="truncate" style={{ fontSize: 8, color: 'var(--text-muted)' }}>{stock.name}</span>
              </div>

              <div className="flex-shrink-0">
                <SparklineChart
                  data={stock.sparkline || []}
                  color={color}
                  width={52}
                  height={22}
                />
              </div>

              <div className="flex flex-col items-end ml-auto min-w-0">
                <span className="font-semibold tabular-nums" style={{ fontSize: 11, color: 'var(--text-main)' }}>
                  ${stock.price?.toFixed(2) ?? '—'}
                </span>
                <span className="tabular-nums font-semibold" style={{
                  fontSize: 9, color,
                }}>
                  {isUp ? '+' : ''}{stock.changePercent?.toFixed(2) ?? '0.00'}%
                </span>
              </div>

              <button onClick={() => removeStock(stock.id)}
                className="flex items-center justify-center text-sm leading-none opacity-0 group-hover:opacity-100 transition-all shrink-0"
                style={{ width: 16, height: 16, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseOver={e => (e.currentTarget.style.color = 'var(--accent-red)')}
                onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                ×
              </button>
            </div>
          );
        })}
      </div>

      {showAdd && <AddSymbolModal onClose={() => setShowAdd(false)} onAdded={onSymbolAdded} />}
    </div>
  );
}
