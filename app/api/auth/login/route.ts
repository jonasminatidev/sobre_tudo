import { NextResponse } from 'next/server';
import { getUserByUsername } from '@/lib/db';
import { createJwt, verifyPassword } from '@/lib/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuário e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    let user: { id: string; username: string; password_hash: string } | null = null;

    // 1. Try fetching from Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, password_hash')
          .eq('username', cleanUsername)
          .maybeSingle();

        if (!error && data) {
          user = data;
        }
      } catch (err) {
        console.warn('Supabase query failed, attempting local fallback:', err);
      }
    }

    // 2. Try fetching from local SQLite if not found yet
    if (!user) {
      try {
        const localUser = getUserByUsername(cleanUsername);
        if (localUser) {
          user = localUser;
        }
      } catch (err) {
        console.warn('SQLite not available in serverless environment:', err);
      }
    }

    // 3. Robust fallback for default root user (jonasdev)
    if (!user && cleanUsername === 'jonasdev') {
      user = {
        id: 'usr-root-01',
        username: 'jonasdev',
        password_hash: 'd5f4e3e94b8f3d8d8450ad8bf4cbedd3ed49b9e90aa0378eae46886b32064400',
      };
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário ou senha incorretos.' },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Usuário ou senha incorretos.' },
        { status: 401 }
      );
    }

    // Create JWT valid for 12 hours
    const token = await createJwt(
      { id: user.id, username: user.username },
      12 // hours
    );

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 3600, // 12 hours in seconds
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username },
    });
  } catch (error: any) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { error: `Erro no servidor: ${error?.message || 'Falha ao autenticar.'}` },
      { status: 500 }
    );
  }
}
