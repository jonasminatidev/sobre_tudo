import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.id,
        username: session.username,
      },
    });
  } catch (error) {
    console.error('Error fetching auth session:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
