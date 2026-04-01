'use client';

import { useState, useRef, useCallback } from 'react';
import { MarketSummaryBar } from './MarketSummaryBar';
import { StockWatchlist } from './StockWatchlist';
import { MarketMovers } from './MarketMovers';
import { FinanceNewsFeed } from './FinanceNewsFeed';

const MIN_PCT = 15;

const dividerStyle = { height: '4px', background: '#1e1f2a', cursor: 'row-resize', flexShrink: 0 as const, transition: 'background 0.15s' };

export function FinancePanel() {
  const [watchlistPct, setWatchlistPct] = useState(40);
  const [moversPct, setMoversPct] = useState(35);
  const containerRef = useRef<HTMLDivElement>(null);

  const makeDragger = useCallback((
    startPct: number,
    setPct: (v: number) => void,
    otherPct: number,
  ) => (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const totalH = containerRef.current?.getBoundingClientRect().height ?? 1;
    const onMove = (ev: MouseEvent) => {
      const delta = ((ev.clientY - startY) / totalH) * 100;
      setPct(Math.max(MIN_PCT, Math.min(100 - otherPct - MIN_PCT, startPct + delta)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  const newsPct = 100 - watchlistPct - moversPct;

  return (
    <div className="flex flex-col h-full">
      <MarketSummaryBar />
      <div className="flex-1 flex flex-col overflow-hidden" ref={containerRef}>
        <div className="overflow-y-auto scrollbar-thin" style={{ height: `${watchlistPct}%` }}>
          <StockWatchlist />
        </div>

        <div
          style={dividerStyle}
          onMouseDown={makeDragger(watchlistPct, setWatchlistPct, moversPct)}
          onMouseEnter={e => (e.currentTarget.style.background = '#3a3b52')}
          onMouseLeave={e => (e.currentTarget.style.background = '#1e1f2a')}
        />

        <div className="overflow-y-auto scrollbar-thin" style={{ height: `${moversPct}%` }}>
          <MarketMovers />
        </div>

        <div
          style={dividerStyle}
          onMouseDown={makeDragger(moversPct, setMoversPct, watchlistPct)}
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
