"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Search, UserPlus, ChevronLeft, ChevronRight,
  Trash2, Eye, Edit2, Phone, Mail, Loader2,
  ArrowUp, ArrowDown, ChevronsUpDown, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Patient } from '@/types/patient';

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type SortField = 'last_name' | 'created_at' | 'date_of_birth' | '';
type SortOrder = 'asc' | 'desc';

interface Filters {
  gender: string;
  sortBy: SortField;
  sortOrder: SortOrder;
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [genderDropdownOpen, setGenderDropdownOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({ gender: '', sortBy: 'created_at', sortOrder: 'desc' });

  const fetchPatients = useCallback(async (page = 1, searchQuery = '', currentFilters?: Filters) => {
    setLoading(true);
    const f = currentFilters || filters;
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (searchQuery) params.set('search', searchQuery);
      if (f.gender) params.set('gender', f.gender);
      if (f.sortBy) params.set('sortBy', f.sortBy);
      if (f.sortOrder) params.set('sortOrder', f.sortOrder);
      const res = await fetch(`/api/patients?${params}`);
      const json = await res.json();
      setPatients(json.data || []);
      setMeta(json.meta || { total: 0, page: 1, limit: 10, totalPages: 0 });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchPatients(1, '', filters); }, []);
  useEffect(() => {
    const timeout = setTimeout(() => fetchPatients(1, search, filters), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const applyFilters = (nf: Filters) => { setFilters(nf); fetchPatients(1, search, nf); };
  const handleSort = (field: SortField) => {
    const newOrder: SortOrder = filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    applyFilters({ ...filters, sortBy: field, sortOrder: newOrder });
  };
  const handleGenderFilter = (v: string) => { applyFilters({ ...filters, gender: v }); setGenderDropdownOpen(false); };
  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce patient ?')) return;
    setDeleteId(id);
    try { await fetch(`/api/patients/${id}`, { method: 'DELETE' }); fetchPatients(meta.page, search, filters); }
    catch (e) { console.error(e); }
    finally { setDeleteId(null); }
  };

  const getGenderLabel = (g: string | null) => (g === 'M' ? 'Homme' : g === 'F' ? 'Femme' : g || '—');
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const SortIcon = ({ field }: { field: SortField }) => {
    if (filters.sortBy !== field) return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors" />;
    return filters.sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />;
  };

  const genderFilterLabel = filters.gender === 'M' ? 'H' : filters.gender === 'F' ? 'F' : filters.gender === 'Other' ? 'A' : '';

  return (
    <>
      {/* Header */}
      <header className="h-14 sm:h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 pl-10 lg:pl-0">Patients</h2>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher par nom ou téléphone..."
              className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm w-48 lg:w-72 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => router.push('/dashboard/patients/new')}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau Patient</span>
          </button>
        </div>
      </header>

      {/* Mobile search */}
      <div className="md:hidden px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Users className="w-4 h-4" />
            <span><strong className="text-slate-900">{meta.total}</strong> patient{meta.total !== 1 ? 's' : ''}</span>
            {(filters.gender || search) && <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">filtré</span>}
          </div>
        </motion.div>

        {/* Mobile: cards layout */}
        <div className="block sm:hidden space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
          ) : patients.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2" />
              <p className="text-sm font-medium">Aucun patient trouvé</p>
            </div>
          ) : (
            patients.map((p) => (
              <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
                onClick={() => router.push(`/dashboard/patients/${p.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                    {p.first_name?.[0]}{p.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{p.last_name} {p.first_name}</p>
                    <p className="text-xs text-slate-500">{getGenderLabel(p.gender)} • {formatDate(p.date_of_birth)}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/patients/${p.id}/edit`); }} className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md">
                      {deleteId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {(p.phone || p.email) && (
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                    {p.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {p.phone}</span>}
                    {p.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {p.email}</span>}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Desktop: table layout */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="hidden sm:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /><span className="ml-3 text-slate-500 text-sm">Chargement...</span></div>
          ) : patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Users className="w-12 h-12 mb-3" /><p className="text-sm font-medium">Aucun patient trouvé</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3">
                        <button onClick={() => handleSort('last_name')} className="group flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-blue-600 transition-colors">
                          Patient <SortIcon field="last_name" />
                        </button>
                      </th>
                      <th className="px-6 py-3">
                        <div className="relative">
                          <button onClick={() => setGenderDropdownOpen(!genderDropdownOpen)}
                            className={`group flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${filters.gender ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}>
                            Sexe
                            {filters.gender ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">
                                {genderFilterLabel}
                                <X className="w-3 h-3 hover:text-blue-900 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleGenderFilter(''); }} />
                              </span>
                            ) : <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors" />}
                          </button>
                          <AnimatePresence>
                            {genderDropdownOpen && (
                              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 min-w-[140px] py-1">
                                {[{ value: '', label: 'Tous' }, { value: 'M', label: 'Homme' }, { value: 'F', label: 'Femme' }, { value: 'Other', label: 'Autre' }].map((opt) => (
                                  <button key={opt.value} onClick={() => handleGenderFilter(opt.value)}
                                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${filters.gender === opt.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}>
                                    {opt.label}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </th>
                      <th className="px-6 py-3">
                        <button onClick={() => handleSort('date_of_birth')} className="group flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-blue-600 transition-colors">
                          Naissance <SortIcon field="date_of_birth" />
                        </button>
                      </th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3">
                        <button onClick={() => handleSort('created_at')} className="group flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-blue-600 transition-colors">
                          Créé le <SortIcon field="created_at" />
                        </button>
                      </th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <AnimatePresence>
                      {patients.map((p) => (
                        <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">{p.first_name?.[0]}{p.last_name?.[0]}</div>
                              <p className="text-sm font-semibold text-slate-900">{p.last_name} {p.first_name}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">{getGenderLabel(p.gender)}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{formatDate(p.date_of_birth)}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              {p.phone && <span className="flex items-center gap-1.5 text-xs text-slate-500"><Phone className="w-3 h-3" /> {p.phone}</span>}
                              {p.email && <span className="flex items-center gap-1.5 text-xs text-slate-500"><Mail className="w-3 h-3" /> {p.email}</span>}
                              {!p.phone && !p.email && <span className="text-xs text-slate-400">—</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">{formatDate(p.created_at)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => router.push(`/dashboard/patients/${p.id}`)} title="Voir" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Eye className="w-4 h-4" /></button>
                              <button onClick={() => router.push(`/dashboard/patients/${p.id}/edit`)} title="Modifier" className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDelete(p.id)} title="Supprimer" disabled={deleteId === p.id} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50">
                                {deleteId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500">Page <strong>{meta.page}</strong> sur <strong>{meta.totalPages}</strong></p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => fetchPatients(meta.page - 1, search, filters)} disabled={meta.page <= 1} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => fetchPatients(meta.page + 1, search, filters)} disabled={meta.page >= meta.totalPages} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </>
  );
}
