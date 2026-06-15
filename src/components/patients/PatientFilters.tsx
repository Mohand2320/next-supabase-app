'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, X } from 'lucide-react';
import type { PatientCreationPreset, PatientGenderFilter, PatientSortOption } from '@/types/patient';

interface PatientFiltersProps {
  gender: PatientGenderFilter;
  createdPreset: PatientCreationPreset;
  createdFrom: string;
  createdTo: string;
  birthFrom: string;
  birthTo: string;
  sort: PatientSortOption;
  onGenderChange: (value: PatientGenderFilter) => void;
  onCreatedPresetChange: (value: PatientCreationPreset) => void;
  onCreatedRangeChange: (from: string, to: string) => void;
  onBirthRangeChange: (from: string, to: string) => void;
  onSortChange: (value: PatientSortOption) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

const filterSelectClass =
  'w-full min-h-[48px] md:min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 py-3 md:py-2.5 text-base md:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

export function PatientFilters({
  gender,
  createdPreset,
  createdFrom,
  createdTo,
  birthFrom,
  birthTo,
  sort,
  onGenderChange,
  onCreatedPresetChange,
  onCreatedRangeChange,
  onBirthRangeChange,
  onSortChange,
  onReset,
  hasActiveFilters,
}: PatientFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  let activeFiltersCount = 0;
  if (gender !== 'all') activeFiltersCount++;
  if (createdPreset !== 'all') activeFiltersCount++;
  if (sort !== 'newest') activeFiltersCount++;
  if (birthFrom || birthTo) activeFiltersCount++;

  const FiltersContent = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2">
          <span className="block text-sm font-medium text-slate-700">Sexe</span>
          <select value={gender} onChange={(event) => onGenderChange(event.target.value as PatientGenderFilter)} className={filterSelectClass}>
            <option value="all">Tous</option>
            <option value="male">Homme</option>
            <option value="female">Femme</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="block text-sm font-medium text-slate-700">Tri</span>
          <select value={sort} onChange={(event) => onSortChange(event.target.value as PatientSortOption)} className={filterSelectClass}>
            <option value="name_asc">Nom A → Z</option>
            <option value="name_desc">Nom Z → A</option>
            <option value="newest">Plus récent</option>
            <option value="oldest">Plus ancien</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="block text-sm font-medium text-slate-700">Date de création</span>
          <select value={createdPreset} onChange={(event) => onCreatedPresetChange(event.target.value as PatientCreationPreset)} className={filterSelectClass}>
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="custom">Période personnalisée</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="block text-sm font-medium text-slate-700">Date de naissance</span>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={birthFrom} onChange={(event) => onBirthRangeChange(event.target.value, birthTo)} className={filterSelectClass} />
            <input type="date" value={birthTo} onChange={(event) => onBirthRangeChange(birthFrom, event.target.value)} className={filterSelectClass} />
          </div>
        </label>
      </div>

      {createdPreset === 'custom' ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">Créé à partir du</span>
            <input type="date" value={createdFrom} onChange={(event) => onCreatedRangeChange(event.target.value, createdTo)} className={filterSelectClass} />
          </label>
          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">Créé jusqu'au</span>
            <input type="date" value={createdTo} onChange={(event) => onCreatedRangeChange(createdFrom, event.target.value)} className={filterSelectClass} />
          </label>
        </div>
      ) : null}
    </>
  );

  return (
    <>
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
        >
          <Filter className="h-5 w-5 text-slate-500" />
          Filtres et Tri
          {activeFiltersCount > 0 && (
            <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      <section className="hidden md:block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Filtres et tri</h3>
          </div>
          <button
            type="button"
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="min-h-[44px] rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
          >
            Réinitialiser
          </button>
        </div>
        <FiltersContent />
      </section>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col rounded-t-3xl bg-white shadow-2xl md:hidden"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
                <h3 className="text-lg font-bold text-slate-900">Filtres et tri</h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  aria-label="Fermer les filtres"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-6">
                <FiltersContent />
              </div>

              <div className="shrink-0 border-t border-slate-100 p-5 pb-8 sm:pb-5">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { onReset(); setIsOpen(false); }}
                    disabled={!hasActiveFilters}
                    className="min-h-[48px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Effacer tout
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="min-h-[48px] rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700"
                  >
                    Appliquer
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
