export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const items = await prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { position: 'asc' },
    });
    return NextResponse.json(items);
  } catch {
    return NextResponse.json([], { status: 503 });
  }
}

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const { symbol, name } = await req.json();
    const count = await prisma.watchlistItem.count({ where: { userId } });
    const item = await prisma.watchlistItem.create({
      data: { userId, symbol: symbol.toUpperCase(), name: name || '', position: count },
    });
    return NextResponse.json(item);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Symbol already in watchlist' }, { status: 409 });
    }
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  }
}
