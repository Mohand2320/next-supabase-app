'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle } from 'lucide-react';
import type { OrigineAnnulation } from '@/types/rdv';

interface RdvCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (origine: OrigineAnnulation) => Promise<void>;
}

export default function RdvCancelModal({
  isOpen,
  onClose,
  onConfirm,
}: RdvCancelModalProps) {
  const [origine, setOrigine] = useState<OrigineAnnulation>('PATIENT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm(origine);
      // Close is handled by parent
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
          className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-rose-50/30">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Annuler le RDV</h2>
            <button onClick={onClose} className="ml-auto p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <p className="text-sm text-slate-600">
              Veuillez indiquer l'origine de cette annulation.
            </p>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors hover:bg-slate-50 border-slate-200">
                <input
                  type="radio"
                  name="origine"
                  value="PATIENT"
                  checked={origine === 'PATIENT'}
                  onChange={() => setOrigine('PATIENT')}
                  className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="text-sm font-semibold text-slate-900">Annulé par le patient</div>
                  <div className="text-xs text-slate-500">Le patient a prévenu de son absence.</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors hover:bg-slate-50 border-slate-200">
                <input
                  type="radio"
                  name="origine"
                  value="CABINET"
                  checked={origine === 'CABINET'}
                  onChange={() => setOrigine('CABINET')}
                  className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="text-sm font-semibold text-slate-900">Annulé par le cabinet</div>
                  <div className="text-xs text-slate-500">Cas de force majeure, absence médecin...</div>
                </div>
              </label>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Retour
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-rose-600 text-white text-sm font-semibold rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-all shadow-md shadow-rose-100 flex items-center gap-2"
            >
              {isSubmitting ? 'Annulation...' : 'Confirmer l\'annulation'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
