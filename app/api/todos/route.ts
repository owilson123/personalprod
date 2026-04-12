export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { format, subDays, parseISO } from 'date-fns';

const today = () => format(new Date(), 'yyyy-MM-dd');

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') ?? today();

    let todos = await prisma.todo.findMany({
      where: { userId, date },
      orderBy: { position: 'asc' },
    });

    // Rollover: if this date has no entries yet, walk back through previous days
    // (up to 90 days) until we find undone tasks to carry forward.
    if (todos.length === 0) {
      let undone: typeof todos = [];
      for (let daysBack = 1; daysBack <= 90; daysBack++) {
        const prevDate = format(subDays(parseISO(date), daysBack), 'yyyy-MM-dd');
        const prev = await prisma.todo.findMany({
          where: { userId, date: prevDate },
          orderBy: { position: 'asc' },
        });
        // Stop searching once we reach a day that actually had entries
        if (prev.length > 0) {
          undone = prev.filter(t => !t.done);
          break;
        }
      }
      if (undone.length > 0) {
        await prisma.todo.createMany({
          data: undone.map((t, i) => ({ userId, text: t.text, done: false, position: i, date })),
        });
        todos = await prisma.todo.findMany({
          where: { userId, date },
          orderBy: { position: 'asc' },
        });
      }
    }

    return NextResponse.json(todos);
  } catch {
    return NextResponse.json([], { status: 503 });
  }
}

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const { text, date } = await req.json();
    const todoDate = date ?? today();
    const count = await prisma.todo.count({ where: { userId, date: todoDate } });
    const todo = await prisma.todo.create({ data: { userId, text, position: count, date: todoDate } });
    return NextResponse.json(todo);
  } catch {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  }
}
