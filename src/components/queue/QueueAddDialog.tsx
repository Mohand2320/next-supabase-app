'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, Plus, Loader2 } from 'lucide-react';
import { queueService } from '@/services/queue.service';
import type { AddToQueueDTO } from '@/types/queue';
import { createClientBrowser } from '@/lib/supabase/client';

interface QueueAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type TabType = 'RDV' | 'PATIENT' | 'WALKIN';

export default function QueueAddDialog({ isOpen, onClose, onSuccess }: QueueAddDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>('RDV');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // States for RDV
  const [rdvs, setRdvs] = useState<any[]>([]);
  const [rdvsLoading, setRdvsLoading] = useState(false);

  // States for Patient
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);

  // States for Walk-in
  const [walkin, setWalkin] = useState({ nom: '', prenom: '', tel: '', motif: '' });

  // Load RDVs for today
  useEffect(() => {
    if (isOpen && activeTab === 'RDV') {
      const loadRdvs = async () => {
        setRdvsLoading(true);
        try {
          const supabase = createClientBrowser();
          const today = new Date().toISOString().split('T')[0];
          
          const { data, error } = await supabase
            .from('rendez_vous')
            .select('*, patient:patients(nom, prenom, telephone)')
            .gte('date_heure', `${today}T00:00:00Z`)
            .lte('date_heure', `${today}T23:59:59Z`)
            .not('statut', 'in', '("TERMINE","ANNULE")');

          if (error) throw error;
          setRdvs(data || []);
        } catch (err) {
          console.error(err);
        } finally {
          setRdvsLoading(false);
        }
      };
      loadRdvs();
    }
  }, [isOpen, activeTab]);

  // Search Patients
  useEffect(() => {
    if (activeTab === 'PATIENT' && search.length > 2) {
      const timer = setTimeout(async () => {
        setPatientsLoading(true);
        try {
          const supabase = createClientBrowser();
          const { data, error } = await supabase
            .from('patients')
            .select('id, nom, prenom, telephone')
            .or(`nom.ilike.%${search}%,prenom.ilike.%${search}%`)
            .limit(10);
          
          if (error) throw error;
          setPatients(data || []);
        } catch (err) {
          console.error(err);
        } finally {
          setPatientsLoading(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setPatients([]);
    }
  }, [search, activeTab]);

  if (!isOpen) return null;

  const handleSubmit = async (dto: AddToQueueDTO) => {
    setLoading(true);
    setError('');
    try {
      await queueService.addToQueue(dto);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col pointer-events-auto max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-xl font-semibold text-slate-900">Ajouter à la file d'attente</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-500 rounded-lg p-1 hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'RDV' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('RDV')}
            >
              <div className="flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" />
                RDV du jour
              </div>
            </button>
            <button
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'PATIENT' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('PATIENT')}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                Patient existant
              </div>
            </button>
            <button
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'WALKIN' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('WALKIN')}
            >
              <div className="flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Urgence / Visiteur
              </div>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}

            {/* Tab: RDV */}
            {activeTab === 'RDV' && (
              <div className="space-y-4">
                {rdvsLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
                ) : rdvs.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">Aucun rendez-vous planifié aujourd'hui.</p>
                ) : (
                  <div className="grid gap-3">
                    {rdvs.map((rdv) => (
                      <div key={rdv.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                        <div>
                          <div className="font-medium text-slate-900">
                            {rdv.patient ? `${rdv.patient.nom} ${rdv.patient.prenom}` : `${rdv.nom_minimal} ${rdv.prenom_minimal}`}
                          </div>
                          <div className="text-sm text-slate-500">
                            {new Date(rdv.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • {rdv.motif || 'Aucun motif'}
                          </div>
                        </div>
                        <button
                          disabled={loading}
                          onClick={() => handleSubmit({
                            patient_id: rdv.patient_id,
                            rdv_id: rdv.id,
                            dentiste_id: rdv.dentiste_id,
                            nom_minimal: rdv.nom_minimal,
                            prenom_minimal: rdv.prenom_minimal,
                            motif: rdv.motif
                          })}
                          className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
                        >
                          Ajouter
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: PATIENT */}
            {activeTab === 'PATIENT' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rechercher un patient</label>
                  <input
                    type="text"
                    placeholder="Nom ou prénom..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {patientsLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
                ) : patients.length > 0 ? (
                  <div className="grid gap-3 mt-4">
                    {patients.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                        <div>
                          <div className="font-medium text-slate-900">{p.nom} {p.prenom}</div>
                          <div className="text-sm text-slate-500">{p.telephone || 'Pas de téléphone'}</div>
                        </div>
                        <button
                          disabled={loading}
                          onClick={() => handleSubmit({ patient_id: p.id })}
                          className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
                        >
                          Ajouter
                        </button>
                      </div>
                    ))}
                  </div>
                ) : search.length > 2 ? (
                  <p className="text-center text-slate-500 py-8">Aucun patient trouvé.</p>
                ) : (
                  <p className="text-center text-slate-500 py-8">Entrez au moins 3 caractères pour rechercher.</p>
                )}
              </div>
            )}

            {/* Tab: WALKIN */}
            {activeTab === 'WALKIN' && (
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSubmit({
                  nom_minimal: walkin.nom,
                  prenom_minimal: walkin.prenom,
                  telephone_minimal: walkin.tel,
                  motif: walkin.motif
                });
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
                    <input
                      required
                      type="text"
                      value={walkin.nom}
                      onChange={(e) => setWalkin(prev => ({ ...prev, nom: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prénom *</label>
                    <input
                      required
                      type="text"
                      value={walkin.prenom}
                      onChange={(e) => setWalkin(prev => ({ ...prev, prenom: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={walkin.tel}
                    onChange={(e) => setWalkin(prev => ({ ...prev, tel: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Motif</label>
                  <input
                    type="text"
                    value={walkin.motif}
                    onChange={(e) => setWalkin(prev => ({ ...prev, motif: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || !walkin.nom || !walkin.prenom}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Ajouter à la file
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
