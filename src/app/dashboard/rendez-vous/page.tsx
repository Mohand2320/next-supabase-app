'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { CalendarCheck, PlusCircle, Search, X, Loader2, ChevronLeft, ChevronRight, ArrowUpDown, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import RdvCreateModal from '@/components/agenda/RdvCreateModal';
import RdvDrawer from '@/components/agenda/RdvDrawer';
import RdvCancelModal from '@/components/agenda/RdvCancelModal';
import { createRdv, fetchRdv, fetchRdvs as fetchRdvsApi, updateRdvStatus, deleteRdv } from '@/services/rdv.service';
import type { RendezVous, RdvCreatePayload, OrigineAnnulation } from '@/types/rdv';
import { STATUT_LABELS, STATUT_COLORS, formatHeure, formatDate, getDisplayName } from '@/types/rdv';
import { RowActions } from '@/components/ui/row-actions';
import { usePaginatedList } from '@/hooks/use-paginated-list';

type SortOption = 'date_asc' | 'date_desc';

const STATUT_FILTERS: { value: RendezVous['statut'] | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tous' },
  { value: 'PLANIFIE', label: 'Planifié' },
  { value: 'CONFIRME', label: 'Confirmé' },
  { value: 'TERMINE', label: 'Terminé' },
  { value: 'ANNULE', label: 'Annulé' },
];

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
  // Filtres
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<RendezVous['statut'] | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState<SortOption>('date_desc');

  // Modal création
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Drawer détail
  const [drawerRdv, setDrawerRdv] = useState<RendezVous | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Modal annulation
  const [cancelRdvId, setCancelRdvId] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // Build API params from filters
  const apiParams = React.useMemo(() => {
    const end = dateTo ? new Date(dateTo + 'T23:59:59') : new Date();
    const start = dateFrom ? new Date(dateFrom + 'T00:00:00') : new Date();
    if (!dateFrom) start.setFullYear(start.getFullYear() - 1);

    const p: Record<string, string> = {
      date_debut: start.toISOString(),
      date_fin: end.toISOString(),
      sort,
    };
    if (statusFilter !== 'ALL') p.statut = statusFilter;
    if (searchFilter.trim()) p.search = searchFilter.trim();
    return p;
  }, [searchFilter, statusFilter, dateFrom, dateTo, sort]);

  // --- Paginated list via API ---
  const {
    data: rdvs,
    isLoading,
    error,
    totalCount,
    currentPage,
    totalPages,
    setPage,
    nextPage,
    prevPage,
    reload,
  } = usePaginatedList<RendezVous>('/api/rdv', apiParams, {
    defaultLimit: 20,
    deps: [apiParams],
  });

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [apiParams]);

  // --- Création RDV ---
  const handleCreateRdv = useCallback(async (payload: RdvCreatePayload) => {
    await createRdv(payload);
    setCreateModalOpen(false);
    reload();
  }, [reload]);

  // --- Drawer handlers ---
  const openDrawer = useCallback(async (apt: RendezVous) => {
    setDrawerLoading(true);
    setDrawerOpen(true);
    try {
      const full = await fetchRdv(apt.id);
      setDrawerRdv(full);
    } catch {
      setDrawerRdv(null);
    } finally {
      setDrawerLoading(false);
    }
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setDrawerRdv(null);
  }, []);

  const handleConfirmer = useCallback(async (rdvId: string) => {
    await updateRdvStatus(rdvId, { nouveau_statut: 'CONFIRME' });
    closeDrawer();
    reload();
  }, [closeDrawer, reload]);

  const handleTerminer = useCallback(async (rdvId: string) => {
    await updateRdvStatus(rdvId, { nouveau_statut: 'TERMINE' });
    closeDrawer();
    reload();
  }, [closeDrawer, reload]);

  const openCancelModal = useCallback(() => {
    setCancelModalOpen(true);
  }, []);

  const handleAnnuler = useCallback(async (origine: OrigineAnnulation) => {
    if (!cancelRdvId) return;
    await updateRdvStatus(cancelRdvId, { nouveau_statut: 'ANNULE', origine_annulation: origine });
    setCancelModalOpen(false);
    setCancelRdvId(null);
    closeDrawer();
    reload();
  }, [cancelRdvId, closeDrawer, reload]);

  const handleDelete = useCallback(async (rdvId: string) => {
    await deleteRdv(rdvId);
    closeDrawer();
    reload();
  }, [closeDrawer, reload]);

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
              {!isLoading && (
                <span className="text-sm font-normal text-slate-500 ml-2">({totalCount})</span>
              )}
            </h3>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-3 text-sm text-slate-500">Chargement des rendez-vous...</span>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-red-600 font-medium">{error}</p>
              <button onClick={reload} className="mt-3 text-sm text-blue-600 hover:underline">
                Réessayer
              </button>
            </div>
          ) : rdvs.length === 0 ? (
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
                {rdvs.map((apt) => (
                  <div key={apt.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">{formatHeure(apt.date_heure)}</span>
                      <div className="flex items-center gap-2">
                        <StatusBadge statut={apt.statut} />
                        <RowActions
                          actions={[
                            { icon: Eye, label: 'Voir le rendez-vous', onClick: () => openDrawer(apt) },
                          ]}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{formatDate(apt.date_heure)}</span>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                        {(getDisplayName(apt).charAt(0) || '?')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{getDisplayName(apt)}</p>
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
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Date & Heure</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Patient</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Motif</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Statut</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rdvs.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {formatHeure(apt.date_heure)}
                          <span className="block text-xs text-slate-400">{formatDate(apt.date_heure)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                              {(getDisplayName(apt).charAt(0) || '?')}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-slate-700">{getDisplayName(apt)}</span>
                              {!apt.patient_id && (
                                <span className="block text-[10px] text-amber-600 font-medium">Nouveau</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{apt.motif || '—'}</td>
                        <td className="px-6 py-4"><StatusBadge statut={apt.statut} /></td>
                        <td className="px-6 py-4 text-right">
                          <RowActions
                            actions={[
                              { icon: Eye, label: 'Voir le rendez-vous', onClick: () => openDrawer(apt) },
                            ]}
                          />
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
                      <span>{totalCount} résultat{totalCount > 1 ? 's' : ''}</span>
                    ) : (
                      <span>
                        Affichage de <span className="font-semibold text-slate-900">{(currentPage - 1) * 20 + 1}</span> à{' '}
                        <span className="font-semibold text-slate-900">{Math.min(currentPage * 20, totalCount)}</span> sur{' '}
                        <span className="font-semibold text-slate-900">{totalCount}</span> rendez-vous
                      </span>
                    )}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={prevPage}
                        disabled={currentPage <= 1}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Précédent
                      </button>
                      <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                        Page {currentPage} / {totalPages}
                      </div>
                      <button
                        onClick={nextPage}
                        disabled={currentPage >= totalPages}
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

      {/* Drawer détail */}
      <RdvDrawer
        rdv={drawerRdv}
        isOpen={drawerOpen}
        onClose={closeDrawer}
        onConfirmer={handleConfirmer}
        onAnnuler={() => { setCancelRdvId(drawerRdv?.id ?? null); openCancelModal(); }}
        onTerminer={handleTerminer}
        onDelete={handleDelete}
      />

      {/* Modal annulation */}
      {cancelModalOpen && (
        <RdvCancelModal
          isOpen={cancelModalOpen}
          onClose={() => { setCancelModalOpen(false); setCancelRdvId(null); }}
          onConfirm={handleAnnuler}
        />
      )}
    </>
  );
}
