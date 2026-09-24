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

  const isLoginPage = pathname === '/login';
  const token = request.cookies.get('auth_token')?.value;
  const session = token ? await verifyJwt(token) : null;

  // If user is accessing /login, redirect to /admin
  if (isLoginPage) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Public GET endpoints and public pages (/ , /admin, /post/[id])
  const isPublicPage = pathname === '/' || pathname === '/admin' || pathname.startsWith('/post/');
  const isPublicApi = pathname.startsWith('/api/') && (request.method === 'GET' || pathname.startsWith('/api/auth/'));

  if (isPublicPage || isPublicApi) {
    return NextResponse.next();
  }

  // Protected routes (/novo, /post/[id]/editar, POST/PUT/DELETE API endpoints)
  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Não autorizado. Por favor faça login.' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/admin', request.url));
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
