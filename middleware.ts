import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas y recursos estáticos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/logo-') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('ppay_session')?.value;
  let user: { id: number; email: string; name: string; role: 'admin' | 'operador'; exp?: number } | null = null;

  if (sessionCookie && sessionCookie.includes('.')) {
    try {
      const [base64] = sessionCookie.split('.');
      const decoded = atob(base64);
      const parsed = JSON.parse(decoded);
      if (!parsed.exp || Date.now() < parsed.exp) {
        user = parsed;
      }
    } catch {
      user = null;
    }
  }

  // 1. Si no está logueado y no está en /login, redirigir a /login
  if (!user && pathname !== '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 2. Si ya está logueado e intenta ir a /login, redirigir al inicio
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 3. Control de Rol: Si es operador e intenta acceder a rutas /admin, bloquear y redirigir
  if (user && pathname.startsWith('/admin') && user.role !== 'admin') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('error', 'unauthorized_role');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
