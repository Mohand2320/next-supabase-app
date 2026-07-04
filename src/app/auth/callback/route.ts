import { createClientServer } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // "next" parameter can be used to redirect the user somewhere after login.
  // Par défaut, s'ils arrivent via un code (invitation ou mot de passe oublié), on les envoie créer leur mot de passe.
  const next = searchParams.get('next') ?? '/update-password';

  if (code) {
    const supabase = await createClientServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Si la connexion a réussi via le code, on redirige vers update-password ou dashboard
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("Auth callback error:", error.message);
    }
  }

  // Si pas de code ou erreur, on redirige vers le login avec un message d'erreur
  return NextResponse.redirect(`${origin}/login?error=LienInvalideOuExpire`);
}
