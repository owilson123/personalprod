export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    if (!date) return NextResponse.json([]);

    const blocks = await prisma.timeBlock.findMany({
      where: { userId, date: new Date(date) },
      orderBy: { startMinute: 'asc' },
    });
    return NextResponse.json(blocks);
  } catch {
    return NextResponse.json([], { status: 503 });
  }
}

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const { task, tasks, isSuperBlock, startMinute, endMinute, color, date } = await req.json();
    const block = await prisma.timeBlock.create({
      data: { userId, task, tasks: tasks ?? [], isSuperBlock: isSuperBlock ?? false, startMinute, endMinute, color, date: new Date(date) },
    });
    return NextResponse.json(block);
  } catch {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  }
}
