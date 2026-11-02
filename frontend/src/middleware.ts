import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js Middleware for Client Route Protection (UX Safeguard)
 * Directs unauthenticated users trying to access /dashboard to login with safe returnTo parameter.
 * Server-side RBAC & token verification is strictly enforced at every API endpoint.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /dashboard and /leads routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/leads')) {
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      // Validate relative path only (e.g. /dashboard or /leads)
      // Reject open redirects like //evil.com or https://evil.com
      let safeReturnTo = pathname;
      if (!/^\/(?!\/)/.test(safeReturnTo)) {
        safeReturnTo = '/dashboard';
      }

      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('returnTo', safeReturnTo);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/leads/:path*'],
};
