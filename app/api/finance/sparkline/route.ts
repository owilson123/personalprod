export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 300_000; // 5 min

export async function GET(req: Request) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'FINNHUB_API_KEY not set' }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get('symbol') || '').toUpperCase();
  if (!symbol) return NextResponse.json([]);

  const cached = cache.get(`spark:${symbol}`);
  if (cached && Date.now() - cached.ts < TTL) return NextResponse.json(cached.data);

  const now = Math.floor(Date.now() / 1000);
  const from = now - 86400; // last 24 hours

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=5&from=${from}&to=${now}&token=${apiKey}`
    );
    if (!res.ok) return NextResponse.json([]);
    const data = await res.json();
    if (data.s !== 'ok' || !data.c) return NextResponse.json([]);

    const points = data.t.map((time: number, i: number) => ({
      time,
      value: data.c[i],
    }));

    cache.set(`spark:${symbol}`, { data: points, ts: Date.now() });
    return NextResponse.json(points);
  } catch {
    return NextResponse.json([]);
  }
}
