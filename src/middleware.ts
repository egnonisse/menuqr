import { auth } from "@/server/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  
  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!req.auth) {
      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return Response.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    // Match all admin routes
    '/admin/:path*',
    // Exclude static files and API routes (except auth API)
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}; 