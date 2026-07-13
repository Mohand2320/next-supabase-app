'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'motion/react';
import { X, Eye, CircleDot } from 'lucide-react';
import type { Treatment } from '@/types/patient';
import { determinerDentureInitiale } from '@/components/seance-form/types';
import 'react-odontogram/style.css';

const Odontogram = dynamic(() => import('react-odontogram'), { ssr: false });

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
  const { typeDenture, odontogramConditions, legendItems } = useMemo(() => {
    const latestByTooth = new Map<string, { treatmentType: string; color: string }>();

    treatments
      .slice()
      .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())
      .forEach((treatment) => {
        const color = colorForTreatmentType(treatment.treatment_type);
        parseToothNumbers(treatment.tooth_number).forEach((tooth) => {
          latestByTooth.set(tooth, { treatmentType: treatment.treatment_type, color });
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

    const legendItems = Array.from(conditionGroups.values()).sort((left, right) =>
      left.label.localeCompare(right.label, 'fr')
    );

    return {
      typeDenture: determinerDentureInitiale(patientBirthDate),
      odontogramConditions: Array.from(conditionGroups.values()),
      legendItems,
    };
  }, [patientBirthDate, treatments]);

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
              <div className="mb-3 flex flex-wrap gap-2">
                {legendItems.map((item) => (
                  <div key={`${item.label}-${item.fillColor}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fillColor }} />
                    <span className="truncate max-w-[14rem]">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="pointer-events-none select-none overflow-x-auto rounded-xl border border-slate-100 bg-white p-2 sm:p-4">
                <Odontogram
                  notation="FDI"
                  showLabels={false}
                  readOnly
                  defaultSelected={[]}
                  maxTeeth={typeDenture === 'ENFANT' ? 5 : 8}
                  colors={{ lightBlue: '#0EA5E9', darkBlue: '#0EA5E9' }}
                  teethConditions={odontogramConditions}
                  tooltip={undefined}
                  showTooltip={false}
                  className="w-full"
                />
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <CircleDot className="w-3.5 h-3.5" />
                Mode lecture seule
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}