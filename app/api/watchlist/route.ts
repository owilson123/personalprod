export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const items = await prisma.watchlistItem.findMany({ orderBy: { position: 'asc' } });
    return NextResponse.json(items);
  } catch {
    return NextResponse.json([], { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const { symbol, name } = await req.json();
    const count = await prisma.watchlistItem.count();
    const item = await prisma.watchlistItem.create({
      data: { symbol: symbol.toUpperCase(), name: name || '', position: count },
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
