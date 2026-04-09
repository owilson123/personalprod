export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const rows = await prisma.userPreference.findMany({ where: { userId } });
    const prefs = Object.fromEntries(rows.map(r => [r.key, r.value]));
    return NextResponse.json(prefs);
  } catch {
    return NextResponse.json({}, { status: 503 });
  }
}

export async function PUT(req: Request) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const body = await req.json() as Record<string, string>;
    await Promise.all(
      Object.entries(body).map(([key, value]) =>
        prisma.userPreference.upsert({
          where: { userId_key: { userId, key } },
          update: { value },
          create: { userId, key, value },
        })
      )
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
