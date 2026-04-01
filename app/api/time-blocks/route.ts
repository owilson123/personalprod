export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    if (!date) return NextResponse.json([]);

    const blocks = await prisma.timeBlock.findMany({
      where: { date: new Date(date) },
      orderBy: { startMinute: 'asc' },
    });
    return NextResponse.json(blocks);
  } catch {
    return NextResponse.json([], { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const { task, startMinute, endMinute, color, date } = await req.json();
    const block = await prisma.timeBlock.create({
      data: { task, startMinute, endMinute, color, date: new Date(date) },
    });
    return NextResponse.json(block);
  } catch {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  }
}
