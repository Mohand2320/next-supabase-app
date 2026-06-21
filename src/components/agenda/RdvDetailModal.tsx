'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Phone, Calendar as CalIcon, FileText, Clock } from 'lucide-react';
import { STATUT_COLORS, STATUT_LABELS, formatHeure, formatDate } from '@/types/rdv';
import type { RendezVous } from '@/types/rdv';

interface RdvDetailData {
  id: string;
  date_heure: string;
  duree: number;
  statut: RendezVous['statut'];
  motif: string | null;
  observation?: string | null;
  patient_id: string | null;
  nom_minimal: string | null;
  prenom_minimal: string | null;
  telephone_minimal?: string | null;
  patient_nom?: string | null;
  patient_prenom?: string | null;
  patient?: { id: string; nom: string; prenom: string; telephone: string | null } | null;
  origine_annulation?: string | null;
}

interface RdvDetailModalProps {
  rdv: RdvDetailData | null;
  isOpen: boolean;
  onClose: () => void;
}

function getDisplayName(rdv: RdvDetailData): string {
  if (rdv.patient) return `${rdv.patient.prenom} ${rdv.patient.nom}`;
  if (rdv.patient_nom && rdv.patient_prenom) return `${rdv.patient_prenom} ${rdv.patient_nom}`;
  if (rdv.prenom_minimal && rdv.nom_minimal) return `${rdv.prenom_minimal} ${rdv.nom_minimal}`;
  return rdv.nom_minimal || 'Patient inconnu';
}

function getDisplayPhone(rdv: RdvDetailData): string | null {
  if (rdv.patient?.telephone) return rdv.patient.telephone;
  if (rdv.telephone_minimal) return rdv.telephone_minimal;
  return null;
}

export default function RdvDetailModal({ rdv, isOpen, onClose }: RdvDetailModalProps) {
  if (!rdv) return null;

  const displayName = getDisplayName(rdv);
  const displayPhone = getDisplayPhone(rdv);
  const isMinimal = !rdv.patient_id;
  const colors = STATUT_COLORS[rdv.statut];

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">Détails du Rendez-vous</h2>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Statut */}
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                  {STATUT_LABELS[rdv.statut]}
                </span>
                {rdv.statut === 'ANNULE' && rdv.origine_annulation && (
                  <span className="text-sm font-medium text-rose-600">
                    Par le {rdv.origine_annulation.toLowerCase()}
                  </span>
                )}
              </div>

              {/* Patient */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{displayName}</h3>
                    {isMinimal && (
                      <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                        Patient non enregistré (Nouveau)
                      </span>
                    )}
                  </div>
                </div>

                {displayPhone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{displayPhone}</span>
                  </div>
                )}
              </div>

              {/* RDV Info */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CalIcon className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{formatDate(rdv.date_heure)}</p>
                    <p className="text-sm text-slate-500">
                      <Clock className="w-3.5 h-3.5 inline mr-1" />
                      {formatHeure(rdv.date_heure)} ({rdv.duree} min)
                    </p>
                  </div>
                </div>

                {rdv.motif && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Motif</p>
                      <p className="text-sm text-slate-600 mt-1">{rdv.motif}</p>
                    </div>
                  </div>
                )}

                {rdv.observation && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Observation</p>
                      <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{rdv.observation}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
