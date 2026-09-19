import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore static assets, internal next files, and images
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/uploads') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Public routes
  const isAuthRoute = pathname === '/api/auth/login';
  const isLoginPage = pathname === '/login';

  const token = request.cookies.get('auth_token')?.value;
  const session = token ? await verifyJwt(token) : null;

  // If user is logged in and trying to visit /login, redirect to homepage
  if (isLoginPage && session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user is not logged in and trying to access a protected page
  if (!session && !isLoginPage && !isAuthRoute) {
    // If it's an API route, return 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Não autorizado. Por favor faça login.' },
        { status: 401 }
      );
    }
    // Otherwise redirect to login page
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
