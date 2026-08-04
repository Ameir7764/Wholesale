import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('b2b_session');
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth
  const publicRoutes = ['/', '/register'];
  const isPublicRoute = publicRoutes.includes(pathname);
  const isApiRoute = pathname.startsWith('/api/');
  const isStaticAsset = pathname.startsWith('/_next/') || pathname.includes('.');

  if (isStaticAsset || isApiRoute) {
    return NextResponse.next();
  }

  // If no session and trying to access protected route
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If has session and trying to access login page, let server component handle redirect
  if (session && isPublicRoute) {
    return NextResponse.next();
  }

  // Basic role-based route protection by parsing the session cookie
  if (session) {
    try {
      // Extract the data part before the HMAC signature
      const signed = session.value;
      const lastDot = signed.lastIndexOf('.');
      if (lastDot === -1) {
        // Invalid session format, redirect to login
        const response = NextResponse.redirect(new URL('/', request.url));
        response.cookies.delete('b2b_session');
        return response;
      }
      const data = signed.substring(0, lastDot);
      const parsed = JSON.parse(data);
      const role = parsed.role;

      // Prevent cross-role access
      if (pathname.startsWith('/admin') && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      if (pathname.startsWith('/wholesaler') && role !== 'WHOLESALER') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      if (pathname.startsWith('/retailer') && role !== 'RETAILER') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      // If parsing fails, clear the cookie and redirect
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('b2b_session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
