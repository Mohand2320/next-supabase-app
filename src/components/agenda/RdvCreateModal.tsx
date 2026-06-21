'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, User, UserPlus, Clock, FileText } from 'lucide-react';
import type { RdvCreatePayload } from '@/types/rdv';
import { searchPatients } from '@/services/rdv.service';

interface RdvCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: RdvCreatePayload) => Promise<void>;
  prefilledDate: Date | null;
  // Temporary: we need a hardcoded dentiste_id for now if auth context isn't fully wired for it
  defaultDentisteId?: string;
}

export default function RdvCreateModal({
  isOpen,
  onClose,
  onSubmit,
  prefilledDate,
}: RdvCreateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [duree, setDuree] = useState(30);
  const [motif, setMotif] = useState('');
  const [observation, setObservation] = useState('');
  
  // Patient Selection State
  const [mode, setMode] = useState<'search' | 'minimal'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{id: string, nom: string, prenom: string, telephone: string | null}>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{id: string, nom: string, prenom: string} | null>(null);

  // Minimal Patient State
  const [nomMinimal, setNomMinimal] = useState('');
  const [prenomMinimal, setPrenomMinimal] = useState('');
  const [telephoneMinimal, setTelephoneMinimal] = useState('');

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      const d = prefilledDate || new Date();
      
      // Local date format YYYY-MM-DD
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setDateStr(`${year}-${month}-${day}`);
      
      // Local time format HH:MM
      const hours = String(d.getHours()).padStart(2, '0');
      // Round to nearest 30 mins for UX
      const minutes = d.getMinutes() < 30 ? '00' : '30';
      setTimeStr(`${hours}:${minutes}`);
      
      setDuree(30);
      setMotif('');
      setObservation('');
      setMode('search');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedPatient(null);
      setNomMinimal('');
      setPrenomMinimal('');
      setTelephoneMinimal('');
      setError(null);
    }
  }, [isOpen, prefilledDate]);

  // Debounced search
  useEffect(() => {
    if (mode !== 'search' || selectedPatient) return;
    
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const results = await searchPatients(searchQuery);
          setSearchResults(results);
        } catch (err) {
          console.error("Search failed", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, mode, selectedPatient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate
    if (mode === 'search' && !selectedPatient) {
      setError("Veuillez sélectionner un patient.");
      return;
    }
    if (mode === 'minimal') {
      if (!nomMinimal.trim() || !prenomMinimal.trim()) {
        setError("Nom et prénom sont requis pour un nouveau patient.");
        return;
      }
    }
    if (!dateStr || !timeStr) {
      setError("Date et heure requises.");
      return;
    }

    // Construct ISO Date
    const isoDate = new Date(`${dateStr}T${timeStr}:00`).toISOString();

    const rdvDate = new Date(isoDate);

    // Vérification de date dans le passé (on bloque si c'est strictement hier ou avant)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Début de journée
    
    if (rdvDate.getTime() < today.getTime()) {
      setError("Il n'est pas possible de planifier un rendez-vous à une date déjà passée.");
      setIsSubmitting(false);
      return;
    }

    const payload: RdvCreatePayload = {
      date_heure: isoDate,
      duree: Number(duree),
      motif: motif || null,
      observation: observation || null,
    };

    if (mode === 'search' && selectedPatient) {
      payload.patient_id = selectedPatient.id;
    } else {
      payload.nom_minimal = nomMinimal.trim();
      payload.prenom_minimal = prenomMinimal.trim();
      payload.telephone_minimal = telephoneMinimal.trim();
    }

    try {
      setIsSubmitting(true);
      await onSubmit(payload);
      // close is handled by parent
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création.");
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900">Nouveau Rendez-vous</h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="p-3 text-sm font-medium text-rose-600 bg-rose-50 rounded-lg border border-rose-100">
                {error}
              </div>
            )}

            {/* Patient Selection Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-900">Patient</label>
                <div className="flex bg-slate-100 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => { setMode('search'); setSelectedPatient(null); }}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${mode === 'search' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Existant
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('minimal'); setSelectedPatient(null); }}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${mode === 'minimal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Nouveau (Minimal)
                  </button>
                </div>
              </div>

              {mode === 'search' ? (
                <div className="space-y-3">
                  {selectedPatient ? (
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-blue-900">{selectedPatient.prenom} {selectedPatient.nom}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPatient(null)}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        Changer
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Rechercher par nom..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {/* Search Results Dropdown */}
                      {searchQuery.length >= 2 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {isSearching ? (
                            <div className="p-3 text-sm text-slate-500 text-center">Recherche...</div>
                          ) : searchResults.length > 0 ? (
                            <ul className="divide-y divide-slate-100">
                              {searchResults.map(p => (
                                <li key={p.id}>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPatient(p)}
                                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center justify-between group transition-colors"
                                  >
                                    <div>
                                      <div className="font-medium text-slate-900 group-hover:text-blue-600">{p.prenom} {p.nom}</div>
                                      {p.telephone && <div className="text-xs text-slate-500">{p.telephone}</div>}
                                    </div>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="p-3 text-sm text-slate-500 text-center">Aucun patient trouvé.</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
                  <div className="col-span-2 sm:col-span-1 space-y-1.5">
                    <label className="block text-xs font-medium text-slate-700">Nom *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={nomMinimal}
                      onChange={(e) => setNomMinimal(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1 space-y-1.5">
                    <label className="block text-xs font-medium text-slate-700">Prénom *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={prenomMinimal}
                      onChange={(e) => setPrenomMinimal(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="block text-xs font-medium text-slate-700">Téléphone</label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={telephoneMinimal}
                      onChange={(e) => setTelephoneMinimal(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-900">Date *</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={dateStr}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDateStr(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-900">Heure *</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="time"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Duree */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-900">Durée (minutes) *</label>
              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={duree}
                onChange={(e) => setDuree(Number(e.target.value))}
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min (Standard)</option>
                <option value={45}>45 min</option>
                <option value={60}>1 heure</option>
                <option value={90}>1h 30</option>
                <option value={120}>2 heures</option>
              </select>
            </div>

            {/* Motif & Observation */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-900">Motif</label>
                <input
                  type="text"
                  placeholder="Ex: Consultation de contrôle"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-900">Observation</label>
                <textarea
                  placeholder="Notes additionnelles..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                />
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-100 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Création...
                </>
              ) : (
                'Créer le RDV'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
