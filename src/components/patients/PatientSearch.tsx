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
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="w-full lg:max-w-xl">
        <label htmlFor="patient-search" className="mb-2 block text-sm font-semibold text-slate-700">
          Recherche globale
        </label>
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3.5 h-5 w-5 text-slate-400" />
          <input
            id="patient-search"
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Rechercher un patient..."
            className="w-full min-h-[48px] rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-12 text-base sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
          />
          {value ? (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-1 flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              aria-label="Effacer la recherche"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm text-slate-500 lg:items-end">
        <span className="font-medium text-slate-700">
          {loading ? 'Chargement...' : `${resultCount} résultat${resultCount > 1 ? 's' : ''}`}
        </span>
      </div>
    </div>
  );
}
