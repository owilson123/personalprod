export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { format } from 'date-fns';

const noteId = (date?: string | null) => `note-${date ?? format(new Date(), 'yyyy-MM-dd')}`;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = noteId(searchParams.get('date'));
    const note = await prisma.note.upsert({
      where: { id },
      update: {},
      create: { id, content: '' },
    });
    return NextResponse.json(note);
  } catch {
    return NextResponse.json({ content: '' }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  try {
    const { content, date } = await req.json();
    const id = noteId(date);
    const note = await prisma.note.upsert({
      where: { id },
      update: { content },
      create: { id, content },
    });
    return NextResponse.json(note);
  } catch {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  }
}
