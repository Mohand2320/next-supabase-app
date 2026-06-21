'use client';

import React, { useMemo } from 'react';
import type { RendezVous, CalendarView } from '@/types/rdv';
import { isSameDay } from '@/types/rdv';
import RdvBlock from './RdvBlock';

interface AgendaCalendarProps {
  currentDate: Date;
  view: CalendarView;
  rdvs: RendezVous[];
  loading: boolean;
  onRdvClick: (rdv: RendezVous) => void;
  onSlotClick: (date: Date) => void;
}

// --- Constantes ---
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7h → 20h
const SLOT_HEIGHT = 60; // px per hour

// ============================================================
// Vue JOUR
// ============================================================
function DayView({
  date,
  rdvs,
  onRdvClick,
  onSlotClick,
}: {
  date: Date;
  rdvs: RendezVous[];
  onRdvClick: (rdv: RendezVous) => void;
  onSlotClick: (date: Date) => void;
}) {
  const dayRdvs = useMemo(() =>
    rdvs.filter(r => isSameDay(new Date(r.date_heure), date)),
    [rdvs, date]
  );

  return (
    <div className="flex flex-1 overflow-auto">
      {/* Time gutter */}
      <div className="w-16 sm:w-20 shrink-0 border-r border-slate-200 bg-slate-50/50">
        {HOURS.map(h => (
          <div
            key={h}
            className="flex items-start justify-end pr-3 text-xs text-slate-400 font-medium"
            style={{ height: SLOT_HEIGHT }}
          >
            <span className="relative -top-2">{`${String(h).padStart(2, '0')}:00`}</span>
          </div>
        ))}
      </div>

      {/* Day column */}
      <div className="flex-1 relative">
        {/* Hour lines */}
        {HOURS.map(h => (
          <div
            key={h}
            className="border-b border-slate-100"
            style={{ height: SLOT_HEIGHT }}
          />
        ))}

        {/* Current time indicator */}
        <CurrentTimeIndicator date={date} />

        {/* RDV blocks */}
        {dayRdvs.map(rdv => {
          const pos = getRdvPosition(rdv);
          return (
            <div
              key={rdv.id}
              className="absolute left-1 right-2"
              style={{
                top: pos.top,
                height: Math.max(pos.height, 28),
              }}
            >
              <RdvBlock rdv={rdv} onClick={onRdvClick} style={{ height: '100%' }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Vue SEMAINE
// ============================================================
function WeekView({
  date,
  rdvs,
  onRdvClick,
  onSlotClick,
}: {
  date: Date;
  rdvs: RendezVous[];
  onRdvClick: (rdv: RendezVous) => void;
  onSlotClick: (date: Date) => void;
}) {
  const weekDays = useMemo(() => getWeekDays(date), [date]);
  const today = new Date();

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Day headers */}
      <div className="flex border-b border-slate-200 bg-white sticky top-0 z-5">
        <div className="w-16 sm:w-20 shrink-0" />
        {weekDays.map((d, i) => {
          const isToday = isSameDay(d, today);
          return (
            <div
              key={i}
              className={`flex-1 text-center py-2.5 border-l border-slate-100 ${isToday ? 'bg-blue-50/50' : ''}`}
            >
              <div className="text-xs text-slate-400 font-medium uppercase">
                {d.toLocaleDateString('fr-FR', { weekday: 'short' })}
              </div>
              <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-slate-900'}`}>
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex flex-1 overflow-auto">
        {/* Time gutter */}
        <div className="w-16 sm:w-20 shrink-0 border-r border-slate-200 bg-slate-50/50">
          {HOURS.map(h => (
            <div
              key={h}
              className="flex items-start justify-end pr-3 text-xs text-slate-400 font-medium"
              style={{ height: SLOT_HEIGHT }}
            >
              <span className="relative -top-2">{`${String(h).padStart(2, '0')}:00`}</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map((d, i) => {
          const dayRdvs = rdvs.filter(r => isSameDay(new Date(r.date_heure), d));
          const isToday = isSameDay(d, today);

          return (
            <div
              key={i}
              className={`flex-1 relative border-l border-slate-100 ${isToday ? 'bg-blue-50/20' : ''}`}
            >
              {HOURS.map(h => (
                <div
                  key={h}
                  className="border-b border-slate-50"
                  style={{ height: SLOT_HEIGHT }}
                />
              ))}

              {isToday && <CurrentTimeIndicator date={d} />}

              {dayRdvs.map(rdv => {
                const pos = getRdvPosition(rdv);
                return (
                  <div
                    key={rdv.id}
                    className="absolute left-0.5 right-0.5"
                    style={{
                      top: pos.top,
                      height: Math.max(pos.height, 24),
                    }}
                  >
                    <RdvBlock rdv={rdv} onClick={onRdvClick} style={{ height: '100%' }} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Vue MOIS
// ============================================================
function MonthView({
  date,
  rdvs,
  onRdvClick,
  onSlotClick,
}: {
  date: Date;
  rdvs: RendezVous[];
  onRdvClick: (rdv: RendezVous) => void;
  onSlotClick: (date: Date) => void;
}) {
  const weeks = useMemo(() => getMonthWeeks(date), [date]);
  const today = new Date();

  return (
    <div className="flex-1 overflow-auto">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
          <div key={d} className="text-center py-2 text-xs font-semibold text-slate-500 uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-slate-100">
          {week.map((d, di) => {
            const isCurrentMonth = d.getMonth() === date.getMonth();
            const isToday = isSameDay(d, today);
            const dayRdvs = rdvs.filter(r => isSameDay(new Date(r.date_heure), d));

            return (
              <div
                key={di}
                className={`min-h-24 sm:min-h-28 p-1 border-l border-slate-100 ${
                  !isCurrentMonth ? 'bg-slate-50/50' : ''
                }`}
              >
                <div className={`
                  text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full
                  ${isToday ? 'bg-blue-600 text-white' : isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}
                `}>
                  {d.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayRdvs.slice(0, 3).map(rdv => (
                    <RdvBlock
                      key={rdv.id}
                      rdv={rdv}
                      onClick={(e) => {
                        onRdvClick(e);
                      }}
                      compact
                    />
                  ))}
                  {dayRdvs.length > 3 && (
                    <div className="text-[10px] text-slate-400 font-medium pl-1">
                      +{dayRdvs.length - 3} autres
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Indicateur de l'heure actuelle
// ============================================================
function CurrentTimeIndicator({ date }: { date: Date }) {
  const now = new Date();
  if (!isSameDay(date, now)) return null;

  const minutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = 7 * 60;
  const top = ((minutes - startMinutes) / 60) * SLOT_HEIGHT;

  if (top < 0 || top > HOURS.length * SLOT_HEIGHT) return null;

  return (
    <div
      className="absolute left-0 right-0 z-10 pointer-events-none"
      style={{ top }}
    >
      <div className="flex items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1 shadow-sm" />
        <div className="flex-1 h-px bg-red-500" />
      </div>
    </div>
  );
}

// ============================================================
// Composant principal
// ============================================================
export default function AgendaCalendar({
  currentDate,
  view,
  rdvs,
  loading,
  onRdvClick,
  onSlotClick,
}: AgendaCalendarProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Chargement de l&apos;agenda...</p>
        </div>
      </div>
    );
  }

  if (view === 'day') {
    return (
      <DayView
        date={currentDate}
        rdvs={rdvs}
        onRdvClick={onRdvClick}
        onSlotClick={onSlotClick}
      />
    );
  }

  if (view === 'week') {
    return (
      <WeekView
        date={currentDate}
        rdvs={rdvs}
        onRdvClick={onRdvClick}
        onSlotClick={onSlotClick}
      />
    );
  }

  return (
    <MonthView
      date={currentDate}
      rdvs={rdvs}
      onRdvClick={onRdvClick}
      onSlotClick={onSlotClick}
    />
  );
}

// ============================================================
// Helpers
// ============================================================

function getRdvPosition(rdv: RendezVous): { top: number; height: number } {
  const d = new Date(rdv.date_heure);
  const minutes = d.getHours() * 60 + d.getMinutes();
  const startMinutes = 7 * 60; // 7h
  const top = ((minutes - startMinutes) / 60) * SLOT_HEIGHT;
  const height = (rdv.duree / 60) * SLOT_HEIGHT;
  return { top: Math.max(top, 0), height };
}

function getWeekDays(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(d);
  monday.setDate(d.getDate() - diff);

  return Array.from({ length: 7 }, (_, i) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    return dayDate;
  });
}

function getMonthWeeks(date: Date): Date[][] {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  // Start from Monday of the first week
  const day = firstDay.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - diff);

  const weeks: Date[][] = [];
  const current = new Date(start);

  while (current <= lastDay || weeks.length < 6) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
    if (current > lastDay && weeks.length >= 5) break;
  }

  return weeks;
}
