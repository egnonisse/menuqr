import NextAuth from "next-auth";
import { authConfigEdge } from "@/server/auth/config-edge";

const { auth } = NextAuth(authConfigEdge);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Middleware - Path:', pathname);
    console.log('Middleware - Auth:', !!req.auth);
    console.log('Middleware - User role:', req.auth?.user?.role);
    console.log('Middleware - User approved:', req.auth?.user?.isApproved);
  }
  
  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!req.auth) {
      console.log('Redirecting to signin for:', pathname);
      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return Response.redirect(signInUrl);
    }
    
    // Vérifier si l'utilisateur est approuvé
    const user = req.auth.user as any;
    if (!user.isApproved || user.role === 'PENDING' || user.role === 'REJECTED') {
      console.log('User not approved, redirecting to pending page:', user.email);
      const pendingUrl = new URL('/auth/pending', req.url);
      return Response.redirect(pendingUrl);
    }
  }
  
  // Allow all other routes
  return;
});

export const config = {
  matcher: [
    // Match all admin routes
    '/admin/:path*',
    // Exclude static files and API routes (except auth API)
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}; 