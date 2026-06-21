"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Users, UserPlus, PlusCircle,
  TrendingUp, Edit2, Search, X
} from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { createClientBrowser } from '@/lib/supabase/client';
import type { RendezVous } from '@/types/rdv';
import { STATUT_LABELS, STATUT_COLORS, formatHeure, formatDate } from '@/types/rdv';

// --- Types ---

interface DashboardRdv {
  id: string;
  date_heure: string;
  duree: number;
  statut: RendezVous['statut'];
  motif: string | null;
  patient_nom: string | null;
  patient_prenom: string | null;
  nom_minimal: string | null;
  prenom_minimal: string | null;
  patient_id: string | null;
}

interface Stat {
  label: string;
  value: string;
  icon: React.ReactNode;
}

// --- Helpers ---

function startOfDay(d: Date): string {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r.toISOString();
}

function endOfDay(d: Date): string {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r.toISOString();
}

const STATUT_FILTERS: { value: RendezVous['statut'] | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tous' },
  { value: 'PLANIFIE', label: 'Planifié' },
  { value: 'CONFIRME', label: 'Confirmé' },
  { value: 'TERMINE', label: 'Terminé' },
  { value: 'ANNULE', label: 'Annulé' },
];

// --- Components ---

function StatCard({ stat, loading, error }: { stat: Stat; loading: boolean; error?: string | null }) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <span className="text-slate-500 text-xs sm:text-sm font-medium">{stat.label}</span>
        <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg text-blue-600">{stat.icon}</div>
      </div>
      <div className="flex items-baseline gap-2">
        {loading ? (
          <div className="h-7 w-20 bg-slate-200 rounded animate-pulse" />
        ) : error ? (
          <span className="text-sm text-red-500 font-medium">{error}</span>
        ) : (
          <span className="text-xl sm:text-2xl font-bold text-slate-900">{stat.value}</span>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ statut }: { statut: RendezVous['statut'] }) {
  const c = STATUT_COLORS[statut];
  return (
    <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {STATUT_LABELS[statut]}
    </span>
  );
}

function getPatientDisplayName(rdv: DashboardRdv): string {
  if (rdv.patient_nom && rdv.patient_prenom) return `${rdv.patient_prenom} ${rdv.patient_nom}`;
  if (rdv.prenom_minimal && rdv.nom_minimal) return `${rdv.prenom_minimal} ${rdv.nom_minimal}`;
  return rdv.nom_minimal || 'Patient inconnu';
}

// ============================================================
// Hook personnalisé pour les stats du dashboard
// ============================================================
function useDashboardStats() {
  const [stats, setStats] = useState<Stat[]>([
    { label: 'RDV aujourd\'hui', value: '—', icon: <Calendar className="w-5 h-5" /> },
    { label: 'RDV en attente de confirmation', value: '—', icon: <TrendingUp className="w-5 h-5" /> },
    { label: 'Total patients', value: '—', icon: <Users className="w-5 h-5" /> },
    { label: 'Nouveaux patients (30j)', value: '—', icon: <UserPlus className="w-5 h-5" /> },
  ]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<number, string | null>>({});

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setErrors({});
    try {
      const supabase = createClientBrowser();
      const todayStart = startOfDay(new Date());
      const todayEnd = endOfDay(new Date());
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStart = startOfDay(thirtyDaysAgo);

      const results = await Promise.all([
        supabase.from('rendez_vous').select('*', { count: 'exact', head: true }).gte('date_heure', todayStart).lte('date_heure', todayEnd),
        supabase.from('rendez_vous').select('*', { count: 'exact', head: true }).eq('statut', 'PLANIFIE'),
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('patients').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgoStart),
      ]);

      const newErrors: Record<number, string | null> = {};
      const values = results.map((r, i) => {
        if (r.error) {
          console.error(`[DashboardStats] Carte ${i}:`, r.error);
          newErrors[i] = 'Erreur';
          return '—';
        }
        return String(r.count ?? 0);
      });
      setErrors(newErrors);

      setStats([
        { label: 'RDV aujourd\'hui', value: values[0], icon: <Calendar className="w-5 h-5" /> },
        { label: 'RDV en attente de confirmation', value: values[1], icon: <TrendingUp className="w-5 h-5" /> },
        { label: 'Total patients', value: values[2], icon: <Users className="w-5 h-5" /> },
        { label: 'Nouveaux patients (30j)', value: values[3], icon: <UserPlus className="w-5 h-5" /> },
      ]);
    } catch (err: any) {
      console.error('[DashboardStats]', err);
      setErrors({ 0: 'Erreur', 1: 'Erreur', 2: 'Erreur', 3: 'Erreur' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { stats, loading, errors, refetch: fetchStats };
}

export default function DashboardPage() {
  const { stats, loading: statsLoading, errors: statsErrors } = useDashboardStats();

  // État pour les RDV
  const [rdvs, setRdvs] = useState<DashboardRdv[]>([]);
  const [rdvsLoading, setRdvsLoading] = useState(true);
  const [rdvsError, setRdvsError] = useState<string | null>(null);

  // Filtres
  const [searchFilter, setSearchFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<RendezVous['statut'] | 'ALL'>('ALL');

  const fetchRdvs = useCallback(async () => {
    setRdvsLoading(true);
    setRdvsError(null);
    try {
      const supabase = createClientBrowser();
      const now = new Date();
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);

      let query = supabase
        .from('rendez_vous')
        .select('*, patients(id, nom, prenom, telephone)')
        .gte('date_heure', now.toISOString())
        .lte('date_heure', future.toISOString())
        .order('date_heure', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      const mapped: DashboardRdv[] = (data || []).map((r: any) => ({
        id: r.id,
        date_heure: r.date_heure,
        duree: r.duree ?? 30,
        statut: r.statut,
        motif: r.motif,
        patient_nom: r.patients?.nom ?? null,
        patient_prenom: r.patients?.prenom ?? null,
        nom_minimal: r.nom_minimal,
        prenom_minimal: r.prenom_minimal,
        patient_id: r.patient_id,
      }));

      setRdvs(mapped);
    } catch (err: any) {
      console.error('[DashboardRdvs]', err);
      setRdvsError(err.message || 'Erreur');
    } finally {
      setRdvsLoading(false);
    }
  }, []);

  useEffect(() => { fetchRdvs(); }, [fetchRdvs]);

  // Filtrage
  const filteredRdvs = rdvs.filter((rdv) => {
    if (statusFilter !== 'ALL' && rdv.statut !== statusFilter) return false;
    if (dateFilter) {
      const rdvDate = rdv.date_heure.slice(0, 10);
      if (rdvDate !== dateFilter) return false;
    }
    if (searchFilter.trim()) {
      const q = searchFilter.trim().toLowerCase();
      const displayName = getPatientDisplayName(rdv).toLowerCase();
      if (!displayName.includes(q)) return false;
    }
    return true;
  });
  return (
    <>
      {/* Header */}
      <header className="h-14 sm:h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 pl-10 lg:pl-0">Dashboard</h2>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/dashboard/patients/new"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau Patient</span>
          </Link>
          <Link
            href="/dashboard/agenda"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau RDV</span>
          </Link>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6"
        >
          {stats.map((stat, idx) => (
            <StatCard key={idx} stat={stat} loading={statsLoading} error={statsErrors[idx]} />
          ))}
        </motion.div>

        {/* Filtres */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
              {/* Filtre texte */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher un patient..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
                {searchFilter && (
                  <button onClick={() => setSearchFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filtre date */}
              <input
                type="date"
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />

              {/* Filtre statut */}
              <select
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as RendezVous['statut'] | 'ALL')}
              >
                {STATUT_FILTERS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Appointments Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Prochains Rendez-vous</h3>
            <Link href="/dashboard/agenda" className="text-blue-600 text-xs sm:text-sm font-semibold hover:underline">
              Voir tout l&apos;agenda
            </Link>
          </div>

          {rdvsLoading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm text-slate-500">Chargement des rendez-vous...</p>
              </div>
            </div>
          ) : rdvsError ? (
            <div className="p-8 text-center">
              <p className="text-sm text-rose-600 font-medium">{rdvsError}</p>
            </div>
          ) : filteredRdvs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">Aucun rendez-vous à venir.</p>
            </div>
          ) : (
            <>
              {/* Mobile: cards layout */}
              <div className="block sm:hidden divide-y divide-slate-100">
                {filteredRdvs.map((apt) => (
                  <div key={apt.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">{formatHeure(apt.date_heure)}</span>
                      <StatusBadge statut={apt.statut} />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                        {(getPatientDisplayName(apt).charAt(0) || '?')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{getPatientDisplayName(apt)}</p>
                        <p className="text-xs text-slate-500">{apt.motif || '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: table layout */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date &amp; Heure</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Motif</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRdvs.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {formatHeure(apt.date_heure)}
                          <span className="block text-xs text-slate-400">{formatDate(apt.date_heure)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                              {(getPatientDisplayName(apt).charAt(0) || '?')}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-slate-700">{getPatientDisplayName(apt)}</span>
                              {!apt.patient_id && (
                                <span className="block text-[10px] text-amber-600 font-medium">Nouveau</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{apt.motif || '—'}</td>
                        <td className="px-6 py-4"><StatusBadge statut={apt.statut} /></td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/dashboard/agenda`}
                            className="inline-flex items-center gap-1 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </>
  );
}
