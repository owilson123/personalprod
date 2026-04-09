export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { format } from 'date-fns';

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const { todos, date } = await req.json();
    const todoDate = date ?? format(new Date(), 'yyyy-MM-dd');
    if (!Array.isArray(todos)) return NextResponse.json({ error: 'Invalid' }, { status: 400 });
    await prisma.todo.createMany({
      data: todos.map((t: { text: string; done: boolean }, i: number) => ({
        userId,
        text: t.text,
        done: t.done ?? false,
        position: i,
        date: todoDate,
      })),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
