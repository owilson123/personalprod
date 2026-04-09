export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

type HabitWithChecks = Prisma.HabitGetPayload<{
  include: {
    checks: true;
  };
}>;

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const habits = await prisma.habit.findMany({
      where: { userId },
      orderBy: { position: 'asc' },
      include: {
        checks: from && to ? {
          where: {
            date: {
              gte: new Date(from),
              lte: new Date(to),
            },
          },
        } : { take: 0 },
      },
    });

    if (from) {
      const startDate = new Date(from);
      const mapped = habits.map((h: HabitWithChecks) => {
        const checksArr = Array(7).fill(false);
        h.checks.forEach(c => {
          const checkDate = new Date(c.date);
          const dayDiff = Math.round((checkDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          if (dayDiff >= 0 && dayDiff < 7) checksArr[dayDiff] = true;
        });
        return { id: h.id, name: h.name, checks: checksArr };
      });
      return NextResponse.json(mapped);
    }

    return NextResponse.json(habits.map(h => ({ id: h.id, name: h.name, checks: Array(7).fill(false) })));
  } catch {
    return NextResponse.json([], { status: 503 });
  }
}

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const { name } = await req.json();
    const count = await prisma.habit.count({ where: { userId } });
    const habit = await prisma.habit.create({ data: { userId, name, position: count } });
    return NextResponse.json(habit);
  } catch {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  }
}
