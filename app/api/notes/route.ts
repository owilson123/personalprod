export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { format } from 'date-fns';

const noteId = (userId: string, date?: string | null) =>
  `${userId}-note-${date ?? format(new Date(), 'yyyy-MM-dd')}`;

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const { searchParams } = new URL(req.url);
    const id = noteId(userId, searchParams.get('date'));
    const note = await prisma.note.upsert({
      where: { id },
      update: {},
      create: { id, userId, content: '' },
    });
    return NextResponse.json(note);
  } catch {
    return NextResponse.json({ content: '' }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const { content, date } = await req.json();
    const id = noteId(userId, date);
    const note = await prisma.note.upsert({
      where: { id },
      update: { content },
      create: { id, userId, content },
    });
    return NextResponse.json(note);
  } catch {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  }
}
