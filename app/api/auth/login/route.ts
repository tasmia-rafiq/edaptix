// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import User from '@/models/User';
import { comparePassword, signToken, createSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body ?? {};

    if (!email || !password)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    await connectToDatabase();

    const user = await User.findOne({ email }) as {
      _id: { toString(): string },
      name: string,
      email: string,
      password: string
    } | null;
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const ok = await comparePassword(password, user.password);
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const token = signToken({ sub: user._id.toString(), email: user.email });
    const cookie = createSessionCookie(token);

    const res = NextResponse.json({
      user: { id: user._id, name: user.name, email: user.email },
    });
    res.headers.set('Set-Cookie', cookie);
    return res;
  } catch (err) {
    console.error('Login error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
