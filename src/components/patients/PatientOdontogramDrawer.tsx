'use client';

import React, { useMemo, useState, startTransition } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'motion/react';
import { X, Eye, CalendarDays, FileText, DollarSign, Sparkles } from 'lucide-react';
import type { Treatment } from '@/types/patient';
import { determinerDentureInitiale } from '@/components/seance-form/types';
import 'react-odontogram/style.css';

import Odontogram from '@/components/patients/OdontogramWrapper';

type ToothDetail = {
  id: string;
  label: string;
  treatmentType: string;
  color: string;
  date: string;
  description: string | null;
  cost: number;
  rawTooth: string;
};

interface ToothConditionGroup {
  label: string;
  teeth: string[];
  outlineColor: string;
  fillColor: string;
}

interface PatientOdontogramDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientBirthDate: string | null;
  treatments: Treatment[];
}

const COLOR_PALETTE = [
  '#2563EB',
  '#0F766E',
  '#D97706',
  '#BE185D',
  '#7C3AED',
  '#059669',
  '#DC2626',
  '#0EA5E9',
  '#4F46E5',
  '#9333EA',
];

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function colorForTreatmentType(treatmentType: string) {
  return COLOR_PALETTE[hashString(treatmentType.trim().toLowerCase()) % COLOR_PALETTE.length];
}

function expandToothToken(token: string) {
  const compact = token.trim();
  if (!compact) return [] as string[];

  const rangeMatch = compact.match(/^(\d{2})-(\d{2})$/);
  if (rangeMatch) {
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);
    const sameTens = Math.floor(start / 10) === Math.floor(end / 10);
    if (sameTens && end >= start) {
      return Array.from({ length: end - start + 1 }, (_, index) => String(start + index));
    }
  }

  const exactMatch = compact.match(/^\d{1,2}$/);
  if (exactMatch) return [exactMatch[0]];

  const fallbackMatches = compact.match(/\d{1,2}/g);
  return fallbackMatches ?? [];
}

function parseToothNumbers(value: string | null) {
  if (!value) return [] as string[];

  const normalized = value
    .split(/[,;/\s]+/)
    .flatMap((token) => expandToothToken(token))
    .filter(Boolean)
    .map((tooth) => `teeth-${tooth}`);

  return Array.from(new Set(normalized));
}

export default function PatientOdontogramDrawer({
  isOpen,
  onClose,
  patientName,
  patientBirthDate,
  treatments,
}: PatientOdontogramDrawerProps) {
  const [activeToothId, setActiveToothId] = useState<string | null>(null);

  const { typeDenture, odontogramConditions, toothDetails, activeTooth } = useMemo(() => {
    const latestByTooth = new Map<string, ToothDetail>();

    treatments
      .slice()
      .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())
      .forEach((treatment) => {
        const color = colorForTreatmentType(treatment.treatment_type);
        parseToothNumbers(treatment.tooth_number).forEach((tooth) => {
          latestByTooth.set(tooth, {
            id: tooth,
            label: tooth.replace('teeth-', ''),
            treatmentType: treatment.treatment_type,
            color,
            date: treatment.date,
            description: treatment.description,
            cost: treatment.cost,
            rawTooth: treatment.tooth_number || '',
          });
        });
      });

    const conditionGroups = new Map<string, ToothConditionGroup>();

    latestByTooth.forEach(({ treatmentType, color }, tooth) => {
      const key = `${treatmentType.trim().toLowerCase()}-${color}`;
      const existing = conditionGroups.get(key);
      if (existing) {
        existing.teeth.push(tooth);
        return;
      }

      conditionGroups.set(key, {
        label: treatmentType,
        teeth: [tooth],
        outlineColor: color,
        fillColor: color,
      });
    });

    const toothDetails = Array.from(latestByTooth.values()).sort((left, right) =>
      Number(left.label) - Number(right.label)
    );

    const activeTooth = activeToothId ? latestByTooth.get(activeToothId) ?? null : null;

    return {
      typeDenture: determinerDentureInitiale(patientBirthDate),
      odontogramConditions: Array.from(conditionGroups.values()),
      toothDetails,
      activeTooth,
    };
  }, [activeToothId, patientBirthDate, treatments]);

  const activeTooltip = useMemo(() => {
    return ({ id, notations, type }: any) => {
      const tooth = toothDetails.find((item) => item.id === id) ?? toothDetails.find((item) => item.label === notations?.fdi) ?? null;
      if (!tooth) {
        return <div className="max-w-[220px] rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-xl">Aucun traitement enregistré</div>;
      }

      return (
        <div className="max-w-[260px] rounded-xl bg-slate-900 px-3 py-3 text-white shadow-xl border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: tooth.color }} />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">Dent {tooth.label}</p>
              <p className="text-[11px] text-slate-300 truncate">{type || notations?.fdi}</p>
            </div>
          </div>
          <p className="text-xs font-semibold text-white">{tooth.treatmentType}</p>
          <p className="mt-1 text-[11px] text-slate-300 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />{new Date(tooth.date).toLocaleDateString('fr-FR')}</p>
          <p className="mt-1 text-[11px] text-slate-300 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" />{Number(tooth.cost).toFixed(2)} DA</p>
          <p className="mt-2 text-[11px] text-slate-400">Cliquez pour ouvrir le détail de cette dent.</p>
        </div>
      );
    };
  }, [toothDetails]);

  const activeToothHistory = useMemo(() => {
    if (!activeTooth) return [];

    const toothNumber = activeTooth.id.replace('teeth-', '');
    return treatments
      .filter((treatment) => parseToothNumbers(treatment.tooth_number).includes(activeTooth.id))
      .slice()
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
      .map((treatment) => ({
        treatmentType: treatment.treatment_type,
        color: colorForTreatmentType(treatment.treatment_type),
        date: treatment.date,
        description: treatment.description,
        cost: treatment.cost,
        toothNumber,
      }));
  }, [activeTooth, treatments]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:max-w-2xl bg-slate-50 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4 border-b border-slate-200 bg-white">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
                  <Eye className="w-4 h-4" />
                  Odontogramme
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{patientName}</h2>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shrink-0"
                aria-label="Fermer l'odontogramme"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                {activeTooth ? (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: activeTooth.color }} />
                        <h3 className="text-sm font-bold text-slate-900 truncate">Dent {activeTooth.label}</h3>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{activeTooth.treatmentType}</p>
                    </div>
                    <button
                      onClick={() => setActiveToothId(null)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Fermer
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Sparkles className="w-4 h-4" />
                    Survolez une dent pour voir le dernier acte, cliquez pour ouvrir le détail.
                  </div>
                )}

                {activeTooth && activeToothHistory.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {activeToothHistory.map((item) => (
                      <div key={`${item.date}-${item.treatmentType}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <p className="text-sm font-semibold text-slate-900">{item.treatmentType}</p>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />{new Date(item.date).toLocaleDateString('fr-FR')}</p>
                        <p className="mt-1 text-xs text-slate-500 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" />{Number(item.cost).toFixed(2)} DA</p>
                        {item.description && <p className="mt-2 text-xs text-slate-600">{item.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white p-2 sm:p-4">
                <Odontogram
                  notation="FDI"
                  showLabels={false}
                  readOnly={false}
                  singleSelect
                  defaultSelected={activeToothId ? [activeToothId] : []}
                  maxTeeth={typeDenture === 'ENFANT' ? 5 : 8}
                  colors={{ lightBlue: '#0EA5E9', darkBlue: '#0EA5E9' }}
                  teethConditions={odontogramConditions}
                  tooltip={{
                    placement: 'top',
                    margin: 12,
                    content: activeTooltip,
                  }}
                  showTooltip
                  onChange={(selectedTeeth: Array<{ id: string }>) => {
                    const nextSelected = selectedTeeth?.[0]?.id ?? null;
                    startTransition(() => {
                      setActiveToothId(nextSelected);
                    });
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}