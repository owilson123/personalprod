export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { format, subDays } from 'date-fns';

const today = () => format(new Date(), 'yyyy-MM-dd');
const yesterday = () => format(subDays(new Date(), 1), 'yyyy-MM-dd');

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') ?? today();

    let todos = await prisma.todo.findMany({
      where: { date },
      orderBy: { position: 'asc' },
    });

    // Rollover: if today has no entries yet, copy undone from yesterday
    if (todos.length === 0 && date === today()) {
      const prev = await prisma.todo.findMany({
        where: { date: yesterday(), done: false },
        orderBy: { position: 'asc' },
      });
      if (prev.length > 0) {
        await prisma.todo.createMany({
          data: prev.map((t, i) => ({ text: t.text, done: false, position: i, date: date })),
        });
        todos = await prisma.todo.findMany({
          where: { date },
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
  try {
    const { text, date } = await req.json();
    const todoDate = date ?? today();
    const count = await prisma.todo.count({ where: { date: todoDate } });
    const todo = await prisma.todo.create({ data: { text, position: count, date: todoDate } });
    return NextResponse.json(todo);
  } catch {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  }
}
