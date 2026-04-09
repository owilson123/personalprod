export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Run a single SQL migration, ignoring errors so one failure doesn't block others
async function run(sql: () => Promise<unknown>, label: string) {
  try {
    await sql();
  } catch (err) {
    console.warn(`[setup] ${label} skipped:`, (err as Error).message?.split('\n')[0]);
  }
}

// Idempotent schema migration — runs on every page load, each step is independent
export async function POST() {
  try {
    // ── Legacy migrations ──────────────────────────────────────────────────
    await run(() => prisma.$executeRaw`
      ALTER TABLE "Todo" ADD COLUMN IF NOT EXISTS date TEXT NOT NULL DEFAULT ''
    `, 'todo.date column');

    await run(() => prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "UserPreference" (key TEXT PRIMARY KEY, value TEXT NOT NULL)
    `, 'UserPreference legacy table');

    // ── User table ─────────────────────────────────────────────────────────
    await run(() => prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "User" (
        id        TEXT PRIMARY KEY,
        name      TEXT UNIQUE NOT NULL,
        password  TEXT NOT NULL,
        "isAdmin" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `, 'User table');

    // ── Add userId columns to all data tables ──────────────────────────────
    await run(() => prisma.$executeRaw`ALTER TABLE "Todo"          ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL DEFAULT 'usr_olly'`, 'Todo.userId');
    await run(() => prisma.$executeRaw`ALTER TABLE "Note"          ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL DEFAULT 'usr_olly'`, 'Note.userId');
    await run(() => prisma.$executeRaw`ALTER TABLE "Habit"         ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL DEFAULT 'usr_olly'`, 'Habit.userId');
    await run(() => prisma.$executeRaw`ALTER TABLE "TimeBlock"     ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL DEFAULT 'usr_olly'`, 'TimeBlock.userId');
    await run(() => prisma.$executeRaw`ALTER TABLE "WatchlistItem" ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL DEFAULT 'usr_olly'`, 'WatchlistItem.userId');

    // ── Migrate existing Notes: rename IDs to include user prefix ──────────
    await run(() => prisma.$executeRaw`
      UPDATE "Note"
      SET id = 'usr_olly-' || id
      WHERE id NOT LIKE 'usr_olly-%'
        AND id NOT LIKE 'usr_ellie-%'
        AND id NOT LIKE 'usr_adam-%'
    `, 'Note id rename');

    // ── Migrate UserPreference: add userId col + composite primary key ─────
    await run(() => prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'UserPreference' AND column_name = 'userId'
        ) THEN
          ALTER TABLE "UserPreference" ADD COLUMN "userId" TEXT NOT NULL DEFAULT 'usr_olly';
          ALTER TABLE "UserPreference" DROP CONSTRAINT IF EXISTS "UserPreference_pkey";
          ALTER TABLE "UserPreference" ADD PRIMARY KEY ("userId", key);
        END IF;
      END $$
    `, 'UserPreference composite PK');

    // ── Migrate WatchlistItem: drop old symbol-unique, add (userId, symbol) ─
    await run(() => prisma.$executeRaw`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WatchlistItem_symbol_key') THEN
          ALTER TABLE "WatchlistItem" DROP CONSTRAINT "WatchlistItem_symbol_key";
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WatchlistItem_userId_symbol_key') THEN
          ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_userId_symbol_key" UNIQUE ("userId", symbol);
        END IF;
      END $$
    `, 'WatchlistItem composite unique');

    // ── Seed users (ON CONFLICT = no-op, passwords never overwritten) ──────
    const pass = hashPassword('123');

    await run(() => prisma.$executeRaw`
      INSERT INTO "User" (id, name, password, "isAdmin", "createdAt")
      VALUES ('usr_olly', 'Olly', ${pass}, true, NOW())
      ON CONFLICT (name) DO NOTHING
    `, 'seed Olly');
    await run(() => prisma.$executeRaw`
      INSERT INTO "User" (id, name, password, "isAdmin", "createdAt")
      VALUES ('usr_ellie', 'Ellie', ${pass}, false, NOW())
      ON CONFLICT (name) DO NOTHING
    `, 'seed Ellie');
    await run(() => prisma.$executeRaw`
      INSERT INTO "User" (id, name, password, "isAdmin", "createdAt")
      VALUES ('usr_adam', 'Adam', ${pass}, false, NOW())
      ON CONFLICT (name) DO NOTHING
    `, 'seed Adam');

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Setup fatal error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
