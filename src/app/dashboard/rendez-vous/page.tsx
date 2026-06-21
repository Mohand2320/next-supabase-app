'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CalendarCheck, PlusCircle, Search, X, Loader2, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { createClientBrowser } from '@/lib/supabase/client';
import RdvCreateModal from '@/components/agenda/RdvCreateModal';
import { createRdv } from '@/services/rdv.service';
import type { RendezVous, RdvCreatePayload } from '@/types/rdv';
import { STATUT_LABELS, STATUT_COLORS, formatHeure, formatDate } from '@/types/rdv';

// --- Types ---

interface RdvRow {
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

type SortOption = 'date_asc' | 'date_desc';

const STATUT_FILTERS: { value: RendezVous['statut'] | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tous' },
  { value: 'PLANIFIE', label: 'Planifié' },
  { value: 'CONFIRME', label: 'Confirmé' },
  { value: 'TERMINE', label: 'Terminé' },
  { value: 'ANNULE', label: 'Annulé' },
];

// --- Helpers ---

function getPatientDisplayName(rdv: RdvRow): string {
  if (rdv.patient_nom && rdv.patient_prenom) return `${rdv.patient_prenom} ${rdv.patient_nom}`;
  if (rdv.prenom_minimal && rdv.nom_minimal) return `${rdv.prenom_minimal} ${rdv.nom_minimal}`;
  return rdv.nom_minimal || 'Patient inconnu';
}

const ITEMS_PER_PAGE = 20;

// --- Status badge ---

function StatusBadge({ statut }: { statut: RendezVous['statut'] }) {
  const c = STATUT_COLORS[statut];
  return (
    <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {STATUT_LABELS[statut]}
    </span>
  );
}

// ============================================================
// Page principale
// ============================================================

export default function RendezVousPage() {
  const [rdvs, setRdvs] = useState<RdvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<RendezVous['statut'] | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState<SortOption>('date_desc');

  // Pagination
  const [page, setPage] = useState(1);

  // Modal création
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // --- Fetch ---
  const fetchRdvs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClientBrowser();
      const { data, error: err } = await supabase
        .from('rendez_vous')
        .select('*, patients(id, nom, prenom, telephone)')
        .order('date_heure', { ascending: false })
        .limit(500);

      if (err) throw err;

      const mapped: RdvRow[] = (data || []).map((r: any) => ({
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
      console.error('[RendezVousPage]', err);
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRdvs(); }, [fetchRdvs]);

  // --- Filtrage client ---
  const filteredRdvs = useMemo(() => {
    let result = rdvs;

    if (statusFilter !== 'ALL') {
      result = result.filter((r) => r.statut === statusFilter);
    }

    if (dateFrom) {
      result = result.filter((r) => r.date_heure.slice(0, 10) >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((r) => r.date_heure.slice(0, 10) <= dateTo);
    }

    if (searchFilter.trim()) {
      const q = searchFilter.trim().toLowerCase();
      result = result.filter((r) => getPatientDisplayName(r).toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      const cmp = a.date_heure.localeCompare(b.date_heure);
      return sort === 'date_asc' ? cmp : -cmp;
    });

    return result;
  }, [rdvs, statusFilter, dateFrom, dateTo, searchFilter, sort]);

  // --- Pagination ---
  const totalPages = Math.max(1, Math.ceil(filteredRdvs.length / ITEMS_PER_PAGE));
  const paginatedRdvs = useMemo(
    () => filteredRdvs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [filteredRdvs, page]
  );

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [searchFilter, statusFilter, dateFrom, dateTo, sort]);

  // --- Création RDV ---
  const handleCreateRdv = useCallback(async (payload: RdvCreatePayload) => {
    await createRdv(payload);
    setCreateModalOpen(false);
    await fetchRdvs();
  }, [fetchRdvs]);

  // --- Computed ---
  const hasActiveFilters = statusFilter !== 'ALL' || dateFrom !== '' || dateTo !== '' || sort !== 'date_desc' || searchFilter.trim() !== '';

  const resetFilters = () => {
    setSearchFilter('');
    setStatusFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setSort('date_desc');
  };

  // --- Render ---
  return (
    <>
      {/* Header */}
      <header className="h-14 sm:h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10">
        <div className="flex items-center gap-3 pl-10 lg:pl-0">
          <CalendarCheck className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Rendez-vous</h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau rendez-vous</span>
          </button>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Filtres */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6"
        >
          <div className="flex flex-col gap-4">
            {/* Ligne supérieure : recherche + tri */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2 sm:gap-3 items-center flex-1">
                {/* Recherche */}
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

                {/* Statut */}
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

              {/* Tri */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-slate-400" />
                <select
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                >
                  <option value="date_desc">Plus récent</option>
                  <option value="date_asc">Plus ancien</option>
                </select>
              </div>
            </div>

            {/* Ligne inférieure : date range */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-slate-500">Période</span>
              <input
                type="date"
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="Du"
              />
              <span className="text-xs text-slate-400">au</span>
              <input
                type="date"
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="Au"
              />
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-blue-600 hover:underline font-medium ml-auto sm:ml-0"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Tous les rendez-vous
              {!loading && (
                <span className="text-sm font-normal text-slate-500 ml-2">({filteredRdvs.length})</span>
              )}
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-3 text-sm text-slate-500">Chargement des rendez-vous...</span>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-red-600 font-medium">{error}</p>
              <button onClick={fetchRdvs} className="mt-3 text-sm text-blue-600 hover:underline">
                Réessayer
              </button>
            </div>
          ) : filteredRdvs.length === 0 ? (
            <div className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <CalendarCheck className="w-12 h-12 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-900">Aucun rendez-vous trouvé</p>
              <p className="text-xs text-slate-500 mt-1">
                {hasActiveFilters ? 'Essayez de modifier les filtres.' : 'Aucun rendez-vous pour le moment.'}
              </p>
              {hasActiveFilters && (
                <button onClick={resetFilters} className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="block sm:hidden divide-y divide-slate-100">
                {paginatedRdvs.map((apt) => (
                  <div key={apt.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">{formatHeure(apt.date_heure)}</span>
                      <StatusBadge statut={apt.statut} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{formatDate(apt.date_heure)}</span>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
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

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Date & Heure</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Patient</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Motif</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Statut</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedRdvs.map((apt) => (
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
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 sm:px-6 py-4 border-t border-slate-100">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-500">
                    {totalPages <= 1 ? (
                      <span>{filteredRdvs.length} résultat{filteredRdvs.length > 1 ? 's' : ''}</span>
                    ) : (
                      <span>
                        Affichage de <span className="font-semibold text-slate-900">{(page - 1) * ITEMS_PER_PAGE + 1}</span> à{' '}
                        <span className="font-semibold text-slate-900">{Math.min(page * ITEMS_PER_PAGE, filteredRdvs.length)}</span> sur{' '}
                        <span className="font-semibold text-slate-900">{filteredRdvs.length}</span> rendez-vous
                      </span>
                    )}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Précédent
                      </button>
                      <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                        Page {page} / {totalPages}
                      </div>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Suivant
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Modal création */}
      {createModalOpen && (
        <RdvCreateModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateRdv}
          prefilledDate={null}
        />
      )}
    </>
  );
}
