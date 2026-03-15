import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware for Supabase Authentication and Route Protection
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 1. Initialize Supabase Client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 2. Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // 3. Route Protection Logic
  // Protect /dashboard and its sub-routes
  if (!user && url.pathname.startsWith('/dashboard')) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Prevent logged-in users from accessing /login or /signup
  if (user && (url.pathname === '/login' || url.pathname === '/')) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // 4. Log request for debug (optional, can be removed once verified)
  console.log(`[AUTH_MIDDLEWARE] ${user ? 'Authenticated' : 'Public'} access: ${url.pathname}`);

  return response;
}

// Ensure middleware runs for all routes except static assets
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
