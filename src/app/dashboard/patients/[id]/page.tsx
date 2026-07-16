"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Edit2, Trash2, Loader2, Phone, Mail, MapPin,
  Calendar, AlertTriangle, PlusCircle, Eye, X, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Patient, Treatment, TreatmentInsert } from '@/types/patient';
import PatientOdontogramDrawer from '@/components/patients/PatientOdontogramDrawer';
import { RowActions } from '@/components/ui/row-actions';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { deleteTreatment } from '@/services/patient.service';

export default function PatientDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [allTreatments, setAllTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [savingTreatment, setSavingTreatment] = useState(false);
  const [showOdontogram, setShowOdontogram] = useState(false);
  const [deletingTreatmentId, setDeletingTreatmentId] = useState<string | null>(null);
  const [confirmDeleteTreatment, setConfirmDeleteTreatment] = useState<Treatment | null>(null);
  const [treatmentForm, setTreatmentForm] = useState<Omit<TreatmentInsert, 'patient_id'>>({
    date: new Date().toISOString().split('T')[0], treatment_type: '', tooth_number: null, description: null, cost: 0,
  });

  const {
    data: treatments,
    setPage: setTreatmentPage,
    currentPage: treatmentPage,
    totalPages: treatmentTotalPages,
    reload,
  } = usePaginatedList<Treatment>(
    `/api/patients/${id}/treatments`,
    {},
    { defaultLimit: 10, deps: [id], enabled: !!id }
  );

  const fetchForOdontogram = useCallback(async () => {
    try {
      const res = await fetch(`/api/patients/${id}/treatments?limit=200`);
      const json = await res.json();
      if (res.ok) setAllTreatments(json.data || []);
    } catch {}
  }, [id]);

  useEffect(() => {
    const fetchPatient = async () => {
      setLoading(true);
      try {
        const pRes = await fetch(`/api/patients/${id}`);
        const pData = await pRes.json();
        if (!pRes.ok) throw new Error(pData.error);
        setPatient(pData);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchPatient();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce patient et tout son historique ?')) return;
    await fetch(`/api/patients/${id}`, { method: 'DELETE' });
    router.push('/dashboard/patients');
  };

  const handleDeleteTreatment = async (treatment: Treatment) => {
    setConfirmDeleteTreatment(treatment);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteTreatment) return;
    setDeletingTreatmentId(confirmDeleteTreatment.id);
    setConfirmDeleteTreatment(null);
    try {
      await deleteTreatment(id, confirmDeleteTreatment.id);
      reload();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingTreatmentId(null);
    }
  };

  const handleAddTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTreatment(true);
    try {
      const res = await fetch(`/api/patients/${id}/treatments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(treatmentForm) });
      if (!res.ok) throw new Error('Erreur');
      const newT = await res.json();
      setAllTreatments((prev) => [newT, ...prev]);
      setShowTreatmentForm(false);
      setTreatmentForm({ date: new Date().toISOString().split('T')[0], treatment_type: '', tooth_number: null, description: null, cost: 0 });
    } catch (err) { console.error(err); }
    finally { setSavingTreatment(false); }
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const getGenderLabel = (g: string | null) => (g === 'M' ? 'Homme' : g === 'F' ? 'Femme' : g || '—');
  const inputClass = "w-full px-3 sm:px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all";

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  if (!patient) return <div className="flex min-h-[50vh] items-center justify-center"><p className="text-slate-500">Patient non trouvé.</p></div>;

  const totalPages = treatmentTotalPages;

  return (
    <>
      <header className="h-14 sm:h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3 pl-10 lg:pl-0 min-w-0">
          <button onClick={() => router.push('/dashboard/patients')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors shrink-0"><ArrowLeft className="w-5 h-5" /></button>
          <h2 className="text-base sm:text-xl font-bold text-slate-900 truncate">{patient.last_name} {patient.first_name}</h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => router.push(`/dashboard/patients/${id}/edit`)} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors">
            <Edit2 className="w-4 h-4" /><span className="hidden sm:inline">Modifier</span>
          </button>
          <button onClick={handleDelete} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-sm font-semibold hover:bg-rose-100 transition-colors">
            <Trash2 className="w-4 h-4" /><span className="hidden sm:inline">Supprimer</span>
          </button>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Patient Info Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Identity */}
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-bold">{patient.first_name?.[0]}{patient.last_name?.[0]}</div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate">{patient.last_name} {patient.first_name}</p>
                <p className="text-xs text-slate-500">{getGenderLabel(patient.gender)} • Né(e) le {formatDate(patient.date_of_birth)}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              {patient.phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400 shrink-0" /> <span className="truncate">{patient.phone}</span></p>}
              {patient.email && <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400 shrink-0" /> <span className="truncate">{patient.email}</span></p>}
              {patient.address && <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400 shrink-0" /> <span className="truncate">{patient.address}</span></p>}
              <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400 shrink-0" /> Dossier créé le {formatDate(patient.created_at)}</p>
            </div>
          </div>

          {/* Medical Info */}
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Médical</h4>
            <div className="space-y-3 text-sm">
              <div><p className="font-medium text-slate-500 mb-1">Allergies</p><p className="text-slate-700">{patient.allergies || 'Aucune connue'}</p></div>
              <div><p className="font-medium text-slate-500 mb-1">Antécédents</p><p className="text-slate-700">{patient.medical_history || 'Aucun'}</p></div>
              {patient.internal_notes && <div><p className="font-medium text-slate-500 mb-1">Notes internes</p><p className="text-slate-700 text-xs">{patient.internal_notes}</p></div>}
            </div>
          </div>
        </motion.div>

        {/* Treatments */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-5 h-5 text-blue-600" aria-hidden="true"><path d="M12 2C7.46 2 4 5.5 4 10.5c0 3.2 1.8 6.5 3.5 8.5 1 1.2 2.5 2.8 4.5 2.8s3.5-1.6 4.5-2.8c1.7-2 3.5-5.3 3.5-8.5C20 5.5 16.54 2 12 2Z"/><path d="M9 6.5c1.2.8 3.5.8 6 0" stroke-linecap="round"/></svg> Traitements</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { fetchForOdontogram(); setShowOdontogram(true); }}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
                >
                  <Eye className="w-4 h-4" /> <span className="hidden sm:inline">Odontogramme</span>
                </button>
                <button onClick={() => router.push(`/dashboard/patients/${id}/nouvelle-seance`)} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
                  <PlusCircle className="w-4 h-4" /> <span className="hidden sm:inline">Ajouter</span>
                </button>
              </div>
          </div>

          {showTreatmentForm && (
            <motion.form onSubmit={handleAddTreatment} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="p-4 sm:p-6 border-b border-slate-100 bg-blue-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Date</label><input type="date" value={treatmentForm.date} onChange={(e) => setTreatmentForm((p) => ({ ...p, date: e.target.value }))} className={inputClass} required /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Type de soin *</label><input value={treatmentForm.treatment_type} onChange={(e) => setTreatmentForm((p) => ({ ...p, treatment_type: e.target.value }))} className={inputClass} placeholder="Détartrage..." required /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Dent</label><input value={treatmentForm.tooth_number || ''} onChange={(e) => setTreatmentForm((p) => ({ ...p, tooth_number: e.target.value || null }))} className={inputClass} placeholder="14, 36..." /></div>
                <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Description</label><input value={treatmentForm.description || ''} onChange={(e) => setTreatmentForm((p) => ({ ...p, description: e.target.value || null }))} className={inputClass} placeholder="Détails..." /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Coût (DA) *</label><input type="number" step="0.01" min="0" value={treatmentForm.cost} onChange={(e) => setTreatmentForm((p) => ({ ...p, cost: parseFloat(e.target.value) || 0 }))} className={inputClass} required /></div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowTreatmentForm(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-white transition-colors">Annuler</button>
                <button type="submit" disabled={savingTreatment} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all disabled:opacity-50">
                  {savingTreatment ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Enregistrer
                </button>
              </div>
            </motion.form>
          )}

          {treatments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-10 h-10 mb-2" aria-hidden="true"><path d="M12 2C7.46 2 4 5.5 4 10.5c0 3.2 1.8 6.5 3.5 8.5 1 1.2 2.5 2.8 4.5 2.8s3.5-1.6 4.5-2.8c1.7-2 3.5-5.3 3.5-8.5C20 5.5 16.54 2 12 2Z"/><path d="M9 6.5c1.2.8 3.5.8 6 0" stroke-linecap="round"/></svg><p className="text-sm">Aucun traitement enregistré</p></div>
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="block sm:hidden divide-y divide-slate-100">
                {treatments.map((t) => (
                  <div key={t.id} className="p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">{formatDate(t.date)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{Number(t.cost).toFixed(2)} DA</span>
                        <RowActions
                          actions={[
                            { icon: Trash2, label: 'Supprimer', onClick: () => handleDeleteTreatment(t), variant: 'destructive', loading: deletingTreatmentId === t.id },
                          ]}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-slate-700">{t.treatment_type}{t.tooth_number ? ` — Dent ${t.tooth_number}` : ''}</p>
                    {t.description && <p className="text-xs text-slate-500">{t.description}</p>}
                  </div>
                ))}
              </div>
              {/* Desktop: table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Type de soin</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Dent</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Coût</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {treatments.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-900 font-medium">{formatDate(t.date)}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{t.treatment_type}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{t.tooth_number || '—'}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{t.description || '—'}</td>
                        <td className="px-6 py-4 text-sm text-slate-900 font-semibold text-right">{Number(t.cost).toFixed(2)} DA</td>
                        <td className="px-6 py-4 text-sm text-right">
                          <RowActions
                            actions={[
                              { icon: Trash2, label: 'Supprimer', onClick: () => handleDeleteTreatment(t), variant: 'destructive', loading: deletingTreatmentId === t.id },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-white">
                  <button
                    onClick={() => setTreatmentPage(treatmentPage - 1)}
                    disabled={treatmentPage <= 1}
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg disabled:opacity-50 hover:bg-slate-200 transition-colors"
                  >
                    Précédent
                  </button>
                  <span className="text-sm text-slate-500">
                    Page {treatmentPage} sur {totalPages}
                  </span>
                  <button
                    onClick={() => setTreatmentPage(treatmentPage + 1)}
                    disabled={treatmentPage >= totalPages}
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg disabled:opacity-50 hover:bg-slate-200 transition-colors"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      <PatientOdontogramDrawer
        isOpen={showOdontogram}
        onClose={() => setShowOdontogram(false)}
        patientName={`${patient.last_name} ${patient.first_name}`}
        patientBirthDate={patient.date_of_birth}
        treatments={allTreatments}
      />

      <AnimatePresence>
        {confirmDeleteTreatment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDeleteTreatment(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-rose-50/30">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Supprimer la séance</h2>
                <button onClick={() => setConfirmDeleteTreatment(null)} className="ml-auto p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600">
                  Vous êtes sur le point de supprimer définitivement cette séance. Cette action est irréversible.
                </p>

                <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date</span>
                    <span className="font-semibold text-slate-900">{formatDate(confirmDeleteTreatment.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Actes</span>
                    <span className="font-semibold text-slate-900 text-right max-w-[200px]">{confirmDeleteTreatment.treatment_type}</span>
                  </div>
                  {confirmDeleteTreatment.tooth_number && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Dents</span>
                      <span className="font-semibold text-slate-900">{confirmDeleteTreatment.tooth_number}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="text-slate-500">Montant total</span>
                    <span className="font-semibold text-slate-900">{Number(confirmDeleteTreatment.cost).toFixed(2)} DA</span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDeleteTreatment(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2 bg-rose-600 text-white text-sm font-semibold rounded-lg hover:bg-rose-700 transition-all shadow-md shadow-rose-100 flex items-center gap-2"
                >
                  Supprimer la séance
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
