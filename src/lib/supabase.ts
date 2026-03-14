import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Affiche dans les logs Vercel si les variables sont manquantes
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE ENV VARS MANQUANTES:', {
        url: supabaseUrl,
        key: supabaseKey ? '✅ présente' : '❌ manquante'
    });
}

export const supabase = createClient(supabaseUrl!, supabaseKey!);