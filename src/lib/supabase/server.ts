import { createServerClient } from '@supabase/ssr';

import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * SERVER CLIENT
 * For Server Components, Actions, and Route Handlers.
 */
export const createClientServer = async () => {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Can be ignored if middleware is handling session refresh
        }
      },
    },
  });
};

/**
 * Fast local JWT verification (no network round-trip to Auth server).
 * Uses getClaims() which validates signature locally using WebCrypto + cached JWKS
 * when asymmetric keys (RSA/ECDSA) are configured in Supabase.
 * 
 * If symmetric key (HS256) is used, falls back to network call like getUser().
 * 
 * SECURITY TRADE-OFF: Does NOT detect server-side revocation (banned user, password change)
 * until JWT expires (max 1 hour). Acceptable for route protection, NOT for sensitive actions.
 * For sensitive actions (password change, account deletion), use getUserVerified().
 */
export const getUserClaims = async () => {
  const supabase = await createClientServer();
  const { data, error } = await supabase.auth.getClaims();
  
  if (error || !data?.claims) {
    return { claims: null, error: error?.message ?? 'No valid session' };
  }
  
  return { claims: data.claims, error: null };
};

/**
 * Full server-side user verification (network round-trip to Supabase).
 * Use for sensitive operations: password change, account deletion, admin actions.
 */
export const getUserVerified = async () => {
  const supabase = await createClientServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  return { user, error };
};