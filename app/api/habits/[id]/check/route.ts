import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Normalize to UTC midnight for consistent matching
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