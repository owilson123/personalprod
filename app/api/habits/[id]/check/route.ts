export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: { id: string } } // <--- NOT a Promise
) {
  try {
    const { id: habitId } = params;
    const { date } = await req.json();
    const dateObj = new Date(date);

    // Toggle: if check exists, delete it; otherwise create it
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
    console.error(err); // helpful for debugging
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}