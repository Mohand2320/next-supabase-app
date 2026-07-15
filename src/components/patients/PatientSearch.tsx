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
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="w-full lg:max-w-xl">
        <label htmlFor="patient-search" className="mb-2 block text-sm font-semibold text-slate-700">
          Recherche globale
        </label>
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            id="patient-search"
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Rechercher un patient..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          {value ? (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Effacer la recherche"
            >
              <X className="w-4 h-4" />
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
