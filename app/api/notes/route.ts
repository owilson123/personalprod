export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const note = await prisma.note.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton', content: '' },
    });
    return NextResponse.json(note);
  } catch {
    return NextResponse.json({ content: '' }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  try {
    const { content } = await req.json();
    const note = await prisma.note.upsert({
      where: { id: 'singleton' },
      update: { content },
      create: { id: 'singleton', content },
    });
    return NextResponse.json(note);
  } catch {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  }
}
