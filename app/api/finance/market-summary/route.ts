export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 60_000; // 60s

const INDICES = [
  { symbol: 'SPY', name: 'S&P 500' },
  { symbol: 'DIA', name: 'Dow Jones' },
  { symbol: 'QQQ', name: 'Nasdaq' },
];

export async function GET() {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'FINNHUB_API_KEY not set' }, { status: 503 });

  const cached = cache.get('market-summary');
  if (cached && Date.now() - cached.ts < TTL) return NextResponse.json(cached.data);

  const results = await Promise.all(
    INDICES.map(async ({ symbol, name }) => {
      try {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
        if (!res.ok) return null;
        const data = await res.json();
        return { name, symbol, price: data.c, change: data.d, changePercent: data.dp };
      } catch { return null; }
    })
  );

  const filtered = results.filter(Boolean);
  cache.set('market-summary', { data: filtered, ts: Date.now() });
  return NextResponse.json(filtered);
}
