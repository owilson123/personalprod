export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const todos = await req.json();
    if (!Array.isArray(todos)) return NextResponse.json({ error: 'Invalid' }, { status: 400 });
    await prisma.todo.createMany({
      data: todos.map((t: { text: string; done: boolean }, i: number) => ({
        text: t.text,
        done: t.done ?? false,
        position: i,
      })),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
