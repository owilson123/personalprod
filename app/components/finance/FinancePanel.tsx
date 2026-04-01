'use client';

import { MarketSummaryBar } from './MarketSummaryBar';
import { StockWatchlist } from './StockWatchlist';
import { MarketMovers } from './MarketMovers';
import { FinanceNewsFeed } from './FinanceNewsFeed';

export function FinancePanel() {
  return (
    <div className="flex flex-col h-full">
      <MarketSummaryBar />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div style={{ height: '45%', minHeight: 200 }}>
          <StockWatchlist />
        </div>
        <div style={{ borderTop: '1px solid #1e1f2a' }}>
          <MarketMovers />
        </div>
        <div style={{ borderTop: '1px solid #1e1f2a' }}>
          <FinanceNewsFeed />
        </div>
      </div>
    </div>
  );
}
