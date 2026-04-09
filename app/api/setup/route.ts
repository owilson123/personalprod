export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Idempotent schema migration — runs on first app load each deployment
export async function POST() {
  try {
    // ── Legacy migrations (kept for existing deployments) ──────────────────
    await prisma.$executeRaw`
      ALTER TABLE "Todo" ADD COLUMN IF NOT EXISTS date TEXT NOT NULL DEFAULT ''
    `;
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "UserPreference" (key TEXT PRIMARY KEY, value TEXT NOT NULL)
    `;

    // ── User table ─────────────────────────────────────────────────────────
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "User" (
        id        TEXT PRIMARY KEY,
        name      TEXT UNIQUE NOT NULL,
        password  TEXT NOT NULL,
        "isAdmin" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // ── Add userId columns to all data tables ──────────────────────────────
    await prisma.$executeRaw`ALTER TABLE "Todo"          ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL DEFAULT 'usr_olly'`;
    await prisma.$executeRaw`ALTER TABLE "Note"          ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL DEFAULT 'usr_olly'`;
    await prisma.$executeRaw`ALTER TABLE "Habit"         ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL DEFAULT 'usr_olly'`;
    await prisma.$executeRaw`ALTER TABLE "TimeBlock"     ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL DEFAULT 'usr_olly'`;
    await prisma.$executeRaw`ALTER TABLE "WatchlistItem" ADD COLUMN IF NOT EXISTS "userId" TEXT NOT NULL DEFAULT 'usr_olly'`;

    // ── Migrate existing Notes: rename IDs to include user prefix ──────────
    await prisma.$executeRaw`
      UPDATE "Note"
      SET id = 'usr_olly-' || id
      WHERE id NOT LIKE 'usr_olly-%'
        AND id NOT LIKE 'usr_ellie-%'
        AND id NOT LIKE 'usr_adam-%'
    `;

    // ── Migrate UserPreference: add userId col + composite primary key ─────
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'UserPreference' AND column_name = 'userId'
        ) THEN
          ALTER TABLE "UserPreference" ADD COLUMN "userId" TEXT NOT NULL DEFAULT 'usr_olly';
          ALTER TABLE "UserPreference" DROP CONSTRAINT "UserPreference_pkey";
          ALTER TABLE "UserPreference" ADD PRIMARY KEY ("userId", key);
        END IF;
      END $$
    `;

    // ── Migrate WatchlistItem: drop old symbol-unique, add (userId, symbol) ─
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'WatchlistItem_symbol_key'
        ) THEN
          ALTER TABLE "WatchlistItem" DROP CONSTRAINT "WatchlistItem_symbol_key";
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'WatchlistItem_userId_symbol_key'
        ) THEN
          ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_userId_symbol_key" UNIQUE ("userId", symbol);
        END IF;
      END $$
    `;

    // ── Seed users (ON CONFLICT = no-op, so passwords never overwritten) ───
    const pass = hashPassword('123');

    await prisma.$executeRaw`
      INSERT INTO "User" (id, name, password, "isAdmin", "createdAt")
      VALUES ('usr_olly', 'Olly', ${pass}, true, NOW())
      ON CONFLICT (name) DO NOTHING
    `;
    await prisma.$executeRaw`
      INSERT INTO "User" (id, name, password, "isAdmin", "createdAt")
      VALUES ('usr_ellie', 'Ellie', ${pass}, false, NOW())
      ON CONFLICT (name) DO NOTHING
    `;
    await prisma.$executeRaw`
      INSERT INTO "User" (id, name, password, "isAdmin", "createdAt")
      VALUES ('usr_adam', 'Adam', ${pass}, false, NOW())
      ON CONFLICT (name) DO NOTHING
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Setup error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
