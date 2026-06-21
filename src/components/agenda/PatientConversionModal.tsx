'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Users, User, ArrowRight, Check } from 'lucide-react';
import type { RendezVous, RdvConvertPatientPayload } from '@/types/rdv';

interface PatientConversionModalProps {
  data: {
    rdv: RendezVous;
    candidats: Array<{ id: string; nom: string; prenom: string; telephone: string | null }>;
  } | null;
  onClose: () => void;
  onConfirm: (rdvId: string, payload: RdvConvertPatientPayload) => Promise<void>;
}

export default function PatientConversionModal({
  data,
  onClose,
  onConfirm,
}: PatientConversionModalProps) {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | 'NEW'>('NEW');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!data) return null;

  const { rdv, candidats } = data;
  const hasCandidates = candidats && candidats.length > 0;

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const payload: RdvConvertPatientPayload = selectedCandidateId === 'NEW'
        ? {
            action: 'create_new',
            patient_data: {
              nom: rdv.nom_minimal || '',
              prenom: rdv.prenom_minimal || '',
              telephone: rdv.telephone_minimal || '',
            }
          }
        : {
            action: 'link_existing',
            patient_id: selectedCandidateId,
          };

      await onConfirm(rdv.id, payload);
      // Close handled by parent
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-blue-50/50">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Convertir en dossier patient</h2>
            <button onClick={onClose} className="ml-auto p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-sm font-medium text-slate-800 mb-1">
                Le RDV minimal de <span className="font-bold">{rdv.prenom_minimal} {rdv.nom_minimal}</span> est terminé.
              </p>
              <p className="text-xs text-slate-500">
                Souhaitez-vous rattacher ce RDV à une fiche patient pour générer la séance de traitement correspondante ?
              </p>
            </div>

            {hasCandidates && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  Patients correspondants trouvés
                </h3>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {candidats.map(c => (
                    <label 
                      key={c.id}
                      className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                        selectedCandidateId === c.id 
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500 ring-opacity-50' 
                          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="patient_candidate"
                        value={c.id}
                        checked={selectedCandidateId === c.id}
                        onChange={() => setSelectedCandidateId(c.id)}
                        className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-bold text-slate-900">{c.prenom} {c.nom}</div>
                        {c.telephone && <div className="text-xs text-slate-500 mt-0.5">{c.telephone}</div>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <label 
                className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                  selectedCandidateId === 'NEW' 
                    ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500 ring-opacity-50' 
                    : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="patient_candidate"
                  value="NEW"
                  checked={selectedCandidateId === 'NEW'}
                  onChange={() => setSelectedCandidateId('NEW')}
                  className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Créer une nouvelle fiche</div>
                    <div className="text-xs text-slate-500 mt-0.5">Pour {rdv.prenom_minimal} {rdv.nom_minimal}</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Ignorer (Garder minimal)
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-100 flex items-center gap-2"
            >
              {isSubmitting ? 'Traitement...' : 'Convertir'}
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
