export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Idempotent schema migration — runs on first app load
export async function POST() {
  try {
    await prisma.$executeRaw`
      ALTER TABLE "Todo" ADD COLUMN IF NOT EXISTS date TEXT NOT NULL DEFAULT ''
    `;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
