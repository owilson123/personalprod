export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({ orderBy: { position: 'asc' } });
    return NextResponse.json(todos);
  } catch {
    return NextResponse.json([], { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    const count = await prisma.todo.count();
    const todo = await prisma.todo.create({ data: { text, position: count } });
    return NextResponse.json(todo);
  } catch {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  }
}
