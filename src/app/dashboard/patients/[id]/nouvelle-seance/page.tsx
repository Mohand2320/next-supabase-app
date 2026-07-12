import { notFound, redirect } from 'next/navigation';
import { createClientServer } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/services/user.service';
import NouvelleSeanceForm from '@/components/seance-form/NouvelleSeanceForm';
import { getCatalogueActes } from '@/components/seance-form/seance.service';
import { ArrowLeft, User, Calendar, Activity } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Nouvelle Séance | DentiPro',
};

export default async function NouvelleSeancePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const patientId = params.id;
  const supabase = await createClientServer();

  // 1. Vérification auth et récupération Dentiste
  const { data: userData } = await getCurrentUserProfile();
  if (!userData) {
    redirect('/login');
  }

  let dentisteId = userData.profile.dentiste_id;

  // Si c'est un assistant, et qu'il n'y a qu'un seul dentiste dans le cabinet :
  if (userData.role === 'assistant' || !dentisteId) {
    const { data: firstDentist } = await supabase
      .from('dentistes')
      .select('id')
      .limit(1)
      .single();
      
    if (firstDentist) {
      dentisteId = firstDentist.id;
    }
  }

  if (!dentisteId) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-xl">
        Erreur : Impossible d'identifier le dentiste pour cette séance.
      </div>
    );
  }

  // 2. Charger les infos du patient
  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .single();

  if (!patient) {
    notFound();
  }

  // 3. Charger le catalogue
  const catalogueActes = await getCatalogueActes(supabase, dentisteId);

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
            Création d'une nouvelle séance pour {patient.nom} {patient.prenom}
          </p>
        </div>
      </div>

      {/* Patient Mini-Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-6">
        <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-lg font-bold shrink-0">
          {patient.prenom[0]}{patient.nom[0]}
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-900">{patient.nom} {patient.prenom}</span>
          </div>
          {patient.date_naissance && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Né(e) le {new Date(patient.date_naissance).toLocaleDateString('fr-FR')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Formulaire Principal (Client Component) */}
      <NouvelleSeanceForm 
        patientId={patientId}
        dentisteId={dentisteId}
        catalogueActes={catalogueActes}
      />
    </div>
  );
}
