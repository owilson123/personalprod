import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET ?? 'cc-dev-secret-change-in-prod';
const COOKIE_NAME = 'cc_session';

// ─── Password hashing (PBKDF2 with random salt) ───────────────────────────────

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  try {
    const hashBuffer = Buffer.from(hash, 'hex');
    const derived = pbkdf2Sync(password, salt, 10000, 64, 'sha512');
    if (hashBuffer.length !== derived.length) return false;
    return timingSafeEqual(hashBuffer, derived);
  } catch {
    return false;
  }
}

// ─── Session token (HMAC-signed JSON, no external deps) ───────────────────────

interface SessionPayload {
  userId: string;
  name: string;
  isAdmin: boolean;
  exp: number;
}

function signData(data: string): string {
  return createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
}

/** Returns the Unix timestamp (ms) for the next 5:00am from now. */
function next5amMs(): number {
  const now = new Date();
  const candidate = new Date(now);
  candidate.setHours(5, 0, 0, 0);
  if (candidate <= now) candidate.setDate(candidate.getDate() + 1);
  return candidate.getTime();
}

export function createSessionToken(userId: string, name: string, isAdmin: boolean): string {
  const payload: SessionPayload = {
    userId,
    name,
    isAdmin,
    exp: next5amMs(), // expires at next 5:00am
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = signData(data);
  return `${data}.${sig}`;
}

export function parseSessionToken(token: string): SessionPayload | null {
  const lastDot = token.lastIndexOf('.');
  if (lastDot === -1) return null;
  const data = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);

  const expectedSig = signData(data);
  try {
    const a = Buffer.from(sig, 'base64url');
    const b = Buffer.from(expectedSig, 'base64url');
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as SessionPayload;
    if (payload.exp < Date.now()) return null; // expired
    return payload;
  } catch {
    return null;
  }
}

// ─── Cookie helpers ────────────────────────────────────────────────────────────

export function getSessionFromRequest(req: Request): SessionPayload | null {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE_NAME) {
      return parseSessionToken(decodeURIComponent(v.join('=')));
    }
  }
  return null;
}

export function setSessionCookie(token: string): string {
  const secondsUntil5am = Math.max(0, Math.floor((next5amMs() - Date.now()) / 1000));
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${secondsUntil5am}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

// ─── Convenience: require auth in a route ────────────────────────────────────

import { NextResponse } from 'next/server';

export function requireAuth(req: Request): SessionPayload | NextResponse {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return session;
}
