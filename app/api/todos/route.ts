export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { format, subDays, parseISO } from 'date-fns';

const today = () => format(new Date(), 'yyyy-MM-dd');

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') ?? today();

    let todos = await prisma.todo.findMany({
      where: { date },
      orderBy: { position: 'asc' },
    });

    // Rollover: if this date has no entries yet, look back up to 7 days for the
    // most recent day that had any todos, then copy over the undone ones.
    if (todos.length === 0) {
      let prev: typeof todos = [];
      for (let daysBack = 1; daysBack <= 7; daysBack++) {
        const prevDate = format(subDays(parseISO(date), daysBack), 'yyyy-MM-dd');
        const dayTodos = await prisma.todo.findMany({
          where: { date: prevDate },
          orderBy: { position: 'asc' },
        });
        if (dayTodos.length > 0) {
          prev = dayTodos.filter(t => !t.done);
          break;
        }
      }
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
