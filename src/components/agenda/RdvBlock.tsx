'use client';

import React from 'react';
import { User, Phone, Clock } from 'lucide-react';
import type { RendezVous, CalendarView } from '@/types/rdv';
import { STATUT_COLORS, STATUT_LABELS, getDisplayName, formatHeure } from '@/types/rdv';

interface RdvBlockProps {
  rdv: RendezVous;
  onClick: (rdv: RendezVous) => void;
  /** Height in pixels (for time-grid views) */
  style?: React.CSSProperties;
  compact?: boolean;
  view?: CalendarView;
}

export default function RdvBlock({ rdv, onClick, style, compact = false, view }: RdvBlockProps) {
  const displayName = getDisplayName(rdv);
  const heureDebut = formatHeure(rdv.date_heure);
  const isMinimal = !rdv.patient_id;
  const colors = STATUT_COLORS[rdv.statut];

  return (
    <button
      onClick={() => onClick(rdv)}
      style={{
        borderLeftColor: rdv.couleur || '#378ADD',
        ...style,
      }}
      className={`
        w-full text-left rounded-lg border-l-4 px-2.5 py-1.5
        transition-all duration-200 cursor-pointer group
        hover:shadow-md hover:scale-[1.01] overflow-hidden
        ${colors.bg} ${colors.border}
        ${rdv.statut === 'ANNULE' ? 'opacity-50' : ''}
      `}
      title={`${displayName} — ${STATUT_LABELS[rdv.statut]}`}
    >
      {compact || view === 'month' ? (
        // Compact mode (month view)
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{heureDebut}</span>
          <span className="text-xs text-slate-600 truncate">{displayName}</span>
        </div>
      ) : view === 'day' ? (
        // Day view (Horizontal, fits in small height)
        <div className="flex items-center gap-2 overflow-hidden h-full">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            {heureDebut}
          </span>
          <span className={`text-xs font-medium truncate shrink ${isMinimal ? 'text-amber-700 italic' : 'text-slate-700'}`}>
            {displayName} {isMinimal && '(nouveau)'}
          </span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${colors.bg} ${colors.text}`}>
            {STATUT_LABELS[rdv.statut]}
          </span>
          {rdv.motif && (
            <span className="text-xs text-slate-500 truncate hidden sm:inline-block shrink-0">
              — {rdv.motif}
            </span>
          )}
        </div>
      ) : (
        // Full mode (week view)
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between gap-1 mb-0.5 shrink-0">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1 truncate">
              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
              {heureDebut}
            </span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${colors.bg} ${colors.text}`}>
              {STATUT_LABELS[rdv.statut]}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <User className="w-3 h-3 text-slate-400 shrink-0" />
            <span className={`text-xs font-medium truncate ${isMinimal ? 'text-amber-700 italic' : 'text-slate-700'}`}>
              {displayName}
              {isMinimal && ' (nouveau)'}
            </span>
          </div>
          {rdv.motif && (
            <p className="text-[10px] text-slate-500 truncate mt-0.5 shrink-0">{rdv.motif}</p>
          )}
          {rdv.telephone_minimal && isMinimal && (
            <div className="flex items-center gap-1 mt-0.5 shrink-0">
              <Phone className="w-2.5 h-2.5 text-slate-400" />
              <span className="text-[10px] text-slate-500">{rdv.telephone_minimal}</span>
            </div>
          )}
        </div>
      )}
    </button>
  );
}
