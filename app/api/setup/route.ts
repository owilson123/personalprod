export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Idempotent schema migration — runs on first app load
export async function POST() {
  try {
    await prisma.$executeRaw`
      ALTER TABLE "Todo" ADD COLUMN IF NOT EXISTS date TEXT NOT NULL DEFAULT ''
    `;
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "UserPreference" (key TEXT PRIMARY KEY, value TEXT NOT NULL)
    `;
    await prisma.$executeRaw`
      ALTER TABLE "TimeBlock" ADD COLUMN IF NOT EXISTS "tasks" JSONB NOT NULL DEFAULT '[]'::jsonb
    `;
    await prisma.$executeRaw`
      ALTER TABLE "TimeBlock" ADD COLUMN IF NOT EXISTS "isSuperBlock" BOOLEAN NOT NULL DEFAULT false
    `;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
