// Import necessary Next.js server components and authentication utility
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAuth } from '@/lib/auth'; // Import the new utility

// Main middleware function that handles request authentication and routing
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Perform authentication check using the utility
  const verification = await verifyAuth(req);
  const userIsAuthenticated = !!verification.user; // Check if user payload exists

  // Define protected paths that require authentication
  const protectedPaths = ['/pos', '/dashboard']; // Added /dashboard
  const isPathProtected = protectedPaths.some(path => pathname.startsWith(path));

  if (isPathProtected) {
    if (!userIsAuthenticated) {
      // If verification failed and returned a response (e.g., redirect with cookie clearing)
      if (verification.response) {
         // Add the original pathname to the redirect URL for better UX
         const loginUrl = verification.response.headers.get('location') ? new URL(verification.response.headers.get('location')!) : new URL('/login', req.url);
         loginUrl.searchParams.set('redirectedFrom', pathname);
         verification.response.headers.set('location', loginUrl.toString());
         return verification.response;
      }
      // Otherwise, redirect to login normally
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirectedFrom', pathname);
      if (verification.error) {
        // Add specific error if available (e.g., session_expired)
        // Map verification.error message to a query param if needed, or use the 'session_expired' from verifyAuth
        const errorParam = verification.error === 'Session expired. Please log in again.' ? 'session_expired' : 'auth_failed';
        loginUrl.searchParams.set('error', errorParam);
      }
      return NextResponse.redirect(loginUrl);
    }
    // If authenticated and accessing a protected path, allow
    return NextResponse.next();
  }

  // Allow access to non-protected paths
  return NextResponse.next();
}

// Keep the matcher config as it was
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     * - register (register page)
     * This ensures middleware runs on pages like /pos, /dashboard, etc.
     * but not on static assets or auth pages themselves.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|register).*)',
  ],
}; 