export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 30_000; // 30s

async function fetchQuote(symbol: string, apiKey: string) {
  const cached = cache.get(`quote:${symbol}`);
  if (cached && Date.now() - cached.ts < TTL) return cached.data;

  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
  if (!res.ok) return null;
  const data = await res.json();
  const result = {
    symbol,
    price: data.c,
    change: data.d,
    changePercent: data.dp,
    high: data.h,
    low: data.l,
    open: data.o,
    prevClose: data.pc,
  };
  cache.set(`quote:${symbol}`, { data: result, ts: Date.now() });
  return result;
}

export async function GET(req: Request) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'FINNHUB_API_KEY not set' }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const symbols = (searchParams.get('symbols') || '').split(',').filter(Boolean);
  if (!symbols.length) return NextResponse.json([]);

  const results = await Promise.all(symbols.map(s => fetchQuote(s.toUpperCase(), apiKey)));
  return NextResponse.json(results.filter(Boolean));
}
