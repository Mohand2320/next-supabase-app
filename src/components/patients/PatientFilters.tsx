'use client';

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
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

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
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Filtres et tri</h3>
          <p className="text-sm text-slate-500">Tous les filtres sont appliqués côté base de données.</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={!hasActiveFilters}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Réinitialiser les filtres
        </button>
      </div>

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
    </section>
  );
}
