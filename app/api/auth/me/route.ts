export const runtime = 'nodejs';

import { getSessionFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ userId: session.userId, name: session.name, isAdmin: session.isAdmin });
}
