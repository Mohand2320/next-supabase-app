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

  // 4. Log request for debug (removed for production)

  return response;
}

// Ensure middleware runs for all routes except static assets
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
