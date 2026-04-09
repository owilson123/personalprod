export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: habitId } = await params;
    const { date } = await req.json();

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
    }

    dateObj.setUTCHours(0, 0, 0, 0);

    const existing = await prisma.habitCheck.findUnique({
      where: { habitId_date: { habitId, date: dateObj } },
    });

    if (existing) {
      await prisma.habitCheck.delete({ where: { id: existing.id } });
      return NextResponse.json({ checked: false });
    } else {
      await prisma.habitCheck.create({ data: { habitId, date: dateObj } });
      return NextResponse.json({ checked: true });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
