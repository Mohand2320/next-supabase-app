'use client';

import { Search, X } from 'lucide-react';

interface PatientSearchProps {
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
  resultCount: number;
  loading?: boolean;
}

export function PatientSearch({ value, onChange, onReset, resultCount, loading = false }: PatientSearchProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="w-full lg:max-w-xl">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Recherche globale</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Rechercher un patient..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
          {value ? (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Réinitialiser la recherche"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm text-slate-500 lg:items-end">
        <span className="font-medium text-slate-700">{loading ? 'Chargement...' : `${resultCount} résultat${resultCount > 1 ? 's' : ''}`}</span>
        <span>Recherche insensible à la casse</span>
      </div>
    </div>
  );
}
