import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Proxy (Next.js 16 convention, replaces middleware.ts)
 * Handles Supabase Authentication and Route Protection.
 *
 * Uses getUser() to refresh the session if expired —
 * this is critical for keeping auth cookies alive.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 1. Initialize Supabase Client using request/response cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
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

  // 2. Refresh session if expired (getUser() triggers token refresh)
  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // Vérification de is_active pour les utilisateurs connectés
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_active')
      .eq('user_id', user.id)
      .single();

    if (profile && profile.is_active === false) {
      await supabase.auth.signOut();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // 3. Route Protection Logic
  // Protect /dashboard and /update-password
  if (!user && (url.pathname.startsWith('/dashboard') || url.pathname === '/update-password')) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Prevent logged-in users from accessing /login
  if (user && (url.pathname === '/login' || url.pathname === '/')) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}

// Ensure proxy runs for all routes except static assets and API routes
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};