import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize, SerializeOptions } from 'cookie';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const COOKIE_NAME = process.env.COOKIE_NAME || 'edaptix_session';

if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET in env');
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hashed: string) {
  return bcrypt.compare(password, hashed);
}

export function signToken(payload: Record<string, any>) {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (err) {
    return null;
  }
}

/** create HttpOnly cookie header value */
export function createSessionCookie(token: string) {
  const opts: SerializeOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days (keep in sync with JWT_EXPIRES_IN)
  };
  return serialize(COOKIE_NAME, token, opts);
}

/** clear cookie */
export function clearSessionCookie() {
  const opts: SerializeOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  };
  return serialize(COOKIE_NAME, '', opts);
}