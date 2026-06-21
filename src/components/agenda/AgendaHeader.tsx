'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, PlusCircle, Calendar as CalIcon } from 'lucide-react';
import type { CalendarView } from '@/types/rdv';

interface AgendaHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onNewRdv: () => void;
}

const VIEW_LABELS: Record<CalendarView, string> = {
  day: 'Jour',
  week: 'Semaine',
  month: 'Mois',
};

function formatTitle(date: Date, view: CalendarView): string {
  if (view === 'day') {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  if (view === 'week') {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(d);
    monday.setDate(d.getDate() - diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const mStr = monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const sStr = sunday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${mStr} — ${sStr}`;
  }
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export default function AgendaHeader({
  currentDate,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onNewRdv,
}: AgendaHeaderProps) {
  return (
    <header className="h-14 sm:h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10">
      {/* Left: Navigation */}
      <div className="flex items-center gap-2 sm:gap-4 pl-10 lg:pl-0">
        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Précédent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={onNext}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Suivant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={onToday}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <CalIcon className="w-4 h-4" />
          Aujourd&apos;hui
        </button>

        <h2 className="text-base sm:text-lg font-bold text-slate-900 capitalize">
          {formatTitle(currentDate, view)}
        </h2>
      </div>

      {/* Right: View Switcher + New RDV */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* View switcher */}
        <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-0.5">
          {(['day', 'week', 'month'] as CalendarView[]).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                view === v
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>

        {/* Mobile view switcher */}
        <select
          value={view}
          onChange={(e) => onViewChange(e.target.value as CalendarView)}
          className="sm:hidden px-2 py-1.5 text-sm bg-slate-100 rounded-lg border-none outline-none"
        >
          {(['day', 'week', 'month'] as CalendarView[]).map((v) => (
            <option key={v} value={v}>{VIEW_LABELS[v]}</option>
          ))}
        </select>

        <button
          onClick={onNewRdv}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Nouveau RDV</span>
        </button>
      </div>
    </header>
  );
}
