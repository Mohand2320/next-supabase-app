'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PatientListMeta } from '@/types/patient';

interface PatientPaginationProps {
  meta: PatientListMeta;
  onPageChange: (page: number) => void;
}

export function PatientPagination({ meta, onPageChange }: PatientPaginationProps) {
  if (meta.totalPages <= 1) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
        <span>
          {meta.total} résultat{meta.total > 1 ? 's' : ''}
        </span>
        <span>Page {meta.page} / {meta.totalPages || 1}</span>
      </div>
    );
  }

  const start = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-slate-500">
        Affichage de <span className="font-semibold text-slate-900">{start}</span> à <span className="font-semibold text-slate-900">{end}</span> sur <span className="font-semibold text-slate-900">{meta.total}</span> patients
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(meta.page - 1)}
          disabled={meta.page <= 1}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Précédent
        </button>
        <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
          Page {meta.page} / {meta.totalPages}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(meta.page + 1)}
          disabled={meta.page >= meta.totalPages}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Suivant
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
