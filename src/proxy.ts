import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client for the proxy
async function createProxyClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });
}

export async function proxy(request: NextRequest) {
  const supabase = await createProxyClient();

  // Fast local JWT verification (no network round-trip with asymmetric keys)
  // Uses getClaims() which validates signature locally using cached JWKS
  const { data: claimsData } = await supabase.auth.getClaims();

  const url = request.nextUrl.clone();
  const userId = claimsData?.claims?.sub ?? null;

  // Check is_active for authenticated users (requires DB query - sensitive check)
  if (userId) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_active')
      .eq('user_id', userId)
      .single();

    if (profile && profile.is_active === false) {
      await supabase.auth.signOut();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // Route Protection Logic
  // Protect /dashboard and /update-password
  if (!userId && (url.pathname.startsWith('/dashboard') || url.pathname === '/update-password')) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Prevent logged-in users from accessing /login
  if (userId && (url.pathname === '/login' || url.pathname === '/')) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Ensure proxy runs for all routes except static assets and API routes
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};