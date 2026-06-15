'use client';

import { useState, useEffect } from 'react';
import { Loader2, LogOut, AlertCircle } from 'lucide-react';
import type { CurrentUserData } from '@/types/user';
import { getCurrentUserProfile } from '@/services/user.service';
import { createClientBrowser } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function ProfileSettings() {
  const [data, setData] = useState<CurrentUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchProfile() {
      const { data: profileData, error } = await getCurrentUserProfile();
      if (error) {
        setErrorMsg(error);
      } else if (profileData) {
        setData(profileData);
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    const supabase = createClientBrowser();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
        <AlertCircle className="mx-auto mb-2 h-8 w-8" />
        <h3 className="text-lg font-semibold">Impossible de charger le profil</h3>
        <p className="mt-1 text-sm text-rose-600">{errorMsg || "Erreur inconnue"}</p>
        <button
            type="button"
            onClick={handleLogout}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 text-white px-6 py-2.5 font-semibold transition hover:bg-rose-700"
          >
            <LogOut className="h-5 w-5" />
            Se déconnecter
          </button>
      </div>
    );
  }

  const roleLabel = data.role === 'dentiste' ? 'Chirurgien-dentiste' : 'Assistant(e)';
  const nom = data.data.nom || '';
  const prenom = data.data.prenom || '';
  const initiales = `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase() || '?';
  const specialite = data.role === 'dentiste' ? (data.data as any).specialite : null;
  const login = data.role === 'assistant' ? (data.data as any).login : null;

  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-6 sm:px-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-2xl font-bold shadow-md shadow-blue-200">
            {initiales}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{prenom} {nom}</h2>
            <p className="text-sm font-medium text-blue-600">{roleLabel}</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-500">Nom</label>
            <div className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-slate-900 border border-slate-100 font-medium break-all">
              {nom}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-500">Prénom</label>
            <div className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-slate-900 border border-slate-100 font-medium break-all">
              {prenom}
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-500">Nom complet</label>
            <div className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-slate-900 border border-slate-100 font-medium break-all">
              {prenom} {nom}
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-500">Adresse email</label>
            <div className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-slate-900 border border-slate-100 font-medium break-all">
              {data.email}
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-500">Rôle utilisateur</label>
            <div className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-slate-900 border border-slate-100 font-medium">
              {roleLabel}
            </div>
          </div>

          {data.role === 'dentiste' && (
            <div className="space-y-2 sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-500">Spécialité</label>
              <div className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-slate-900 border border-slate-100 font-medium break-all">
                {specialite || 'Non renseignée'}
              </div>
            </div>
          )}

          {data.role === 'assistant' && (
            <div className="space-y-2 sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-500">Identifiant de connexion (Login)</label>
              <div className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-slate-900 border border-slate-100 font-medium break-all">
                {login}
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 flex items-center justify-end border-t border-slate-100 pt-8">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 text-rose-600 px-6 py-3 font-semibold transition hover:bg-rose-100 hover:text-rose-700 sm:w-auto"
          >
            <LogOut className="h-5 w-5" />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
