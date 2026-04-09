export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { verifyPassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { name, password } = await req.json();
    if (!name || !password) {
      return NextResponse.json({ error: 'Name and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { name } });
    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = createSessionToken(user.id, user.name, user.isAdmin);

    return NextResponse.json(
      { ok: true, name: user.name, isAdmin: user.isAdmin },
      { headers: { 'Set-Cookie': setSessionCookie(token) } }
    );
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
