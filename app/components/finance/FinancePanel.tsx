'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { MarketSummaryBar } from './MarketSummaryBar';
import { StockWatchlist } from './StockWatchlist';
import { MarketMovers } from './MarketMovers';
import { FinanceNewsFeed } from './FinanceNewsFeed';

const MIN_PCT = 15;

const dividerStyle = { height: '4px', background: '#1e1f2a', cursor: 'row-resize', flexShrink: 0 as const, transition: 'background 0.15s' };

export function FinancePanel() {
  const [topPct,    setTopPct]    = useState(55);
  const [marketTab, setMarketTab] = useState<'movers' | 'watchlist'>('movers');
  const containerRef = useRef<HTMLDivElement>(null);

  const prefsLoaded = useRef(false);

  // Load from localStorage first (fast), then DB (cross-device, may override)
  useEffect(() => {
    const tp = localStorage.getItem('finance.topPct');
    const mt = localStorage.getItem('finance.marketTab');
    if (tp) setTopPct(Number(tp));
    if (mt) setMarketTab(mt as 'movers' | 'watchlist');

    fetch('/api/preferences')
      .then(r => r.ok ? r.json() : null)
      .then((prefs: Record<string, string> | null) => {
        if (!prefs) return;
        if (prefs['finance.topPct'])    setTopPct(Number(prefs['finance.topPct']));
        if (prefs['finance.marketTab']) setMarketTab(prefs['finance.marketTab'] as 'movers' | 'watchlist');
      })
      .catch(() => {})
      .finally(() => { prefsLoaded.current = true; });
  }, []);

  // Save to localStorage immediately, DB with debounce
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleDbSave = useCallback((patch: Record<string, string>) => {
    Object.entries(patch).forEach(([k, v]) => localStorage.setItem(k, v));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch('/api/preferences', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).catch(() => {});
    }, 1000);
  }, []);

  useEffect(() => { if (prefsLoaded.current) scheduleDbSave({ 'finance.topPct':    String(topPct)  }); }, [topPct,     scheduleDbSave]);
  useEffect(() => { if (prefsLoaded.current) scheduleDbSave({ 'finance.marketTab': marketTab        }); }, [marketTab,  scheduleDbSave]);

  const onDividerDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY, startPct = topPct;
    const totalH = containerRef.current?.getBoundingClientRect().height ?? 1;
    const onMove = (ev: MouseEvent) => {
      const delta = ((ev.clientY - startY) / totalH) * 100;
      setTopPct(Math.max(MIN_PCT, Math.min(100 - MIN_PCT, startPct + delta)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [topPct]);

  const newsPct = 100 - topPct;

  return (
    <div className="flex flex-col h-full">
      <MarketSummaryBar />
      <div className="flex-1 flex flex-col overflow-hidden" ref={containerRef}>

        {/* Tabbed top: Movers (default) + Watchlist */}
        <div className="overflow-hidden flex flex-col" style={{ height: `${topPct}%` }}>
          <div style={{ display: 'flex', background: '#13141c', borderBottom: '1px solid #1e1f2a', flexShrink: 0 }}>
            {(['movers', 'watchlist'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setMarketTab(tab)}
                style={{
                  padding: '7px 18px',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  background: 'none',
                  border: 'none',
                  borderBottom: marketTab === tab ? '2px solid #4f7df9' : '2px solid transparent',
                  color: marketTab === tab ? '#4f7df9' : '#555770',
                  cursor: 'pointer',
                  transition: 'color 0.15s, border-color 0.15s',
                  marginBottom: '-1px',
                }}
              >
                {tab === 'movers' ? 'Market Movers' : 'Watchlist'}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {marketTab === 'movers' ? <MarketMovers /> : <StockWatchlist />}
          </div>
        </div>

        <div
          style={dividerStyle}
          onMouseDown={onDividerDown}
          onMouseEnter={e => (e.currentTarget.style.background = '#3a3b52')}
          onMouseLeave={e => (e.currentTarget.style.background = '#1e1f2a')}
        />

        <div className="overflow-y-auto scrollbar-thin" style={{ height: `${newsPct}%` }}>
          <FinanceNewsFeed />
        </div>
      </div>
    </div>
  );
}
