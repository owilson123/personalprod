export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 120_000; // 2 min

const POPULAR_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'JPM',
  'V', 'UNH', 'JNJ', 'WMT', 'MA', 'PG', 'HD', 'DIS',
  'BAC', 'NFLX', 'ADBE', 'CRM', 'AMD', 'INTC', 'PYPL', 'COST',
  'PEP', 'CSCO', 'AVGO', 'ORCL', 'QCOM', 'CMCSA',
];

export async function GET() {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'FINNHUB_API_KEY not set' }, { status: 503 });

  const cached = cache.get('movers');
  if (cached && Date.now() - cached.ts < TTL) return NextResponse.json(cached.data);

  const results = await Promise.all(
    POPULAR_STOCKS.map(async (symbol) => {
      try {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.c || data.c === 0) return null;
        return { symbol, price: data.c, change: data.d, changePercent: data.dp };
      } catch { return null; }
    })
  );

  const valid = results.filter(Boolean) as { symbol: string; price: number; change: number; changePercent: number }[];
  const sorted = [...valid].sort((a, b) => b.changePercent - a.changePercent);
  const gainers = sorted.filter(s => s.changePercent > 0).slice(0, 5);
  const losers = sorted.filter(s => s.changePercent < 0).reverse().slice(0, 5);

  const data = { gainers, losers };
  cache.set('movers', { data, ts: Date.now() });
  return NextResponse.json(data);
}
