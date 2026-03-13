'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
      setLoading(false);
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-xl font-semibold">Chargement...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-indigo-50 to-white">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex border bg-white shadow-xl rounded-2xl p-10">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
            Bienvenue dans votre Application Next.js + Supabase
          </h1>
          <p className="text-gray-600">
            Vous avez réussi à connecter avec succès l'authentification Supabase !
          </p>
        </div>
        
        <div className="mt-8 lg:mt-0 flex flex-col items-end gap-4">
           {user && (
             <div className="flex flex-col items-end bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm">
                <p className="font-semibold text-gray-700 mb-2">Connecté en tant que :</p>
                <p className="text-indigo-600 font-medium break-all bg-indigo-50 px-3 py-1 rounded-full">{user.email}</p>
                
                <button 
                  onClick={handleLogout}
                  className="mt-6 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors text-sm font-semibold border border-red-200"
                >
                  Se déconnecter
                </button>
             </div>
           )}
        </div>
      </div>
    </main>
  );
}
