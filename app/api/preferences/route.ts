export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await prisma.userPreference.findMany();
    const prefs = Object.fromEntries(rows.map(r => [r.key, r.value]));
    return NextResponse.json(prefs);
  } catch {
    return NextResponse.json({}, { status: 503 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json() as Record<string, string>;
    await Promise.all(
      Object.entries(body).map(([key, value]) =>
        prisma.userPreference.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
