import { cookies } from 'next/headers';
import { verifyToken } from './auth';
import { connectToDatabase } from './database';
import User from '@/models/User';

const COOKIE_NAME = process.env.COOKIE_NAME || 'edaptix_session';

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(COOKIE_NAME)?.value;
    if (!cookie) return null;

    const payload = verifyToken(cookie);
    if (!payload) return null;

    // payload.sub holds user id
    await connectToDatabase();
    const user = await User.findById(payload.sub).select('-password').lean();
    // console.log("session.ts: ", user);
    return user;
  } catch (err) {
    console.error('getCurrentUser error', err);
    return null;
  }
}