import { notFound, redirect } from 'next/navigation';
import { createClientServer } from '@/lib/supabase/server';
import NouvelleSeanceForm from '@/components/seance-form/NouvelleSeanceForm';
import { getCatalogueActes } from '@/components/seance-form/seance.service';
import { ArrowLeft, User, Calendar, Activity, Clock } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Nouvelle Séance | DentiPro',
};

export default async function NouvelleSeancePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const patientId = params.id;
  const supabase = await createClientServer();

  // ── Étape 1 : Lancer TOUTES les requêtes indépendantes en parallèle ──
  const [authResult, patientResult, firstDentistResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('patients').select('id, nom, prenom, date_naissance').eq('id', patientId).single(),
    supabase.from('dentistes').select('id').limit(1).single(),
  ]);

  const { data: { user } } = authResult;
  const { data: patient } = patientResult;

  if (!user) {
    redirect('/login');
  }
  if (!patient) {
    notFound();
  }

  // ── Étape 2 : Récupérer le profil + dentiste_id (une seule requête) ──
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, dentiste_id')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Déterminer le dentiste_id : soit depuis le profil, soit le premier dentiste du cabinet
  let dentisteId = profile.dentiste_id;
  if (!dentisteId && firstDentistResult.data) {
    dentisteId = firstDentistResult.data.id;
  }

  if (!dentisteId) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-xl">
        Erreur : Impossible d&apos;identifier le dentiste pour cette séance.
      </div>
    );
  }

  // ── Étape 3 : Charger le catalogue (dépend du dentiste_id) ──
  const catalogueActes = await getCatalogueActes(supabase, dentisteId);

  // Formater la date de naissance lisiblement
  const dateNaissanceFormatted = patient.date_naissance
    ? new Date(patient.date_naissance).toLocaleDateString('fr-FR')
    : null;

  const now = new Date();
  const dateActuelle = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const heureActuelle = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // Calcul denture / âge
  const SEUIL_AGE_ENFANT = 13;
  function calculerAge(dateNaissance: string | null): number | null {
    if (!dateNaissance) return null;
    const naissance = new Date(dateNaissance);
    const aujourdHui = new Date();
    let age = aujourdHui.getFullYear() - naissance.getFullYear();
    const m = aujourdHui.getMonth() - naissance.getMonth();
    if (m < 0 || (m === 0 && aujourdHui.getDate() < naissance.getDate())) age--;
    return age;
  }
  const patientAge = calculerAge(patient.date_naissance);
  const dentureLabel = patientAge !== null && patientAge < SEUIL_AGE_ENFANT ? 'Enfant' : 'Adulte';

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href={`/dashboard/patients/${patientId}`}
          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-teal-600" />
            Feuille de soins
          </h1>
          <p className="text-slate-500 text-sm">
            Création d&apos;une nouvelle séance
          </p>
        </div>
      </div>

      {/* ── TÂCHE 1 : Bandeau unique Patient + Séance ── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-x-8 gap-y-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-lg font-bold shrink-0">
          {patient.prenom?.[0]}{patient.nom?.[0]}
        </div>

        {/* Nom / Prénom */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <User className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-900">{patient.nom} {patient.prenom}</span>
        </div>

        {/* Date de naissance */}
        {dateNaissanceFormatted && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Né(e) le {dateNaissanceFormatted}</span>
          </div>
        )}

        {/* Séparateur visuel */}
        <div className="hidden md:block w-px h-8 bg-slate-200" />

        {/* Date et heure de la séance */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>{dateActuelle} — {heureActuelle}</span>
        </div>

        {/* Denture */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Activity className="w-4 h-4 text-slate-400" />
          <span>Denture : {dentureLabel}{patientAge !== null ? ` — ${patientAge} ans` : ''}</span>
        </div>
      </div>

      {/* Formulaire Principal (Client Component) */}
      <NouvelleSeanceForm 
        patientId={patientId}
        dentisteId={dentisteId}
        catalogueActes={catalogueActes}
        patient={{
          nom: patient.nom,
          prenom: patient.prenom,
          dateNaissance: patient.date_naissance || null
        }}
      />
    </div>
  );
}
