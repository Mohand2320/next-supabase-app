'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, User, Phone, Clock, Calendar as CalIcon, Stethoscope, FileText,
  CheckCircle2, XCircle, ArrowRightCircle, Trash2
} from 'lucide-react';
import type { RendezVous } from '@/types/rdv';
import { STATUT_COLORS, STATUT_LABELS, getDisplayName, getDisplayPhone, formatHeure, formatDate } from '@/types/rdv';

interface RdvDrawerProps {
  rdv: RendezVous | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmer: (id: string) => void;
  onAnnuler: () => void; // Opens cancel modal
  onTerminer: (id: string) => void; // Opens terminer flow
  onDelete: (id: string) => void;
}

export default function RdvDrawer({
  rdv,
  isOpen,
  onClose,
  onConfirmer,
  onAnnuler,
  onTerminer,
  onDelete,
}: RdvDrawerProps) {
  if (!rdv) return null;

  const displayName = getDisplayName(rdv);
  const displayPhone = getDisplayPhone(rdv);
  const isMinimal = !rdv.patient_id;
  const colors = STATUT_COLORS[rdv.statut];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Détails du Rendez-vous</h2>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Statut Badge */}
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

              {/* Patient Info */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{displayName}</h3>
                    {isMinimal && (
                      <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                        Patient non enregistré (Nouveau)
                      </span>
                    )}
                  </div>
                </div>

                {displayPhone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 pl-13">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {displayPhone}
                  </div>
                )}

                {!isMinimal && (
                  <a
                    href={`/dashboard/patients/${rdv.patient_id}`}
                    className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline pl-13"
                  >
                    Voir le dossier patient <ArrowRightCircle className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* RDV Info */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CalIcon className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{formatDate(rdv.date_heure)}</p>
                    <p className="text-sm text-slate-500">
                      {formatHeure(rdv.date_heure)} ({rdv.duree} min)
                    </p>
                  </div>
                </div>

                {rdv.motif && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Motif</p>
                      <p className="text-sm text-slate-600 mt-1">{rdv.motif}</p>
                    </div>
                  </div>
                )}
                
                {rdv.observation && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Observation</p>
                      <p className="text-sm text-slate-600 mt-1">{rdv.observation}</p>
                    </div>
                  </div>
                )}

                {isMinimal && !rdv.patient_id && rdv.statut !== 'ANNULE' && (
                  <Link
                    href={`/dashboard/patients/new?nom=${encodeURIComponent(rdv.nom_minimal || '')}&prenom=${encodeURIComponent(rdv.prenom_minimal || '')}&telephone=${encodeURIComponent(rdv.telephone_minimal || '')}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow-sm shadow-emerald-100 transition-all mt-4"
                  >
                    Créer la fiche patient
                  </Link>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            {rdv.statut !== 'ANNULE' && rdv.statut !== 'TERMINE' && (
              <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-2">
                {rdv.statut === 'PLANIFIE' && (
                  <button
                    onClick={() => onConfirmer(rdv.id)}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmer
                  </button>
                )}
                
                {(rdv.statut === 'PLANIFIE' || rdv.statut === 'CONFIRME') && (
                  <button
                    onClick={() => onTerminer(rdv.id)}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Marquer Terminé
                  </button>
                )}

                <button
                  onClick={onAnnuler}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-rose-200 text-rose-600 rounded-lg text-sm font-semibold hover:bg-rose-50 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Annuler
                </button>

                {rdv.statut === 'PLANIFIE' && (
                  <button
                    onClick={() => {
                      if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce RDV ?")) {
                        onDelete(rdv.id);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mt-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
