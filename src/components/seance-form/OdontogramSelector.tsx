'use client';

import React from 'react';
import type { TypeDenture, ToothDetail } from './types';
import { COULEUR_DEFAUT } from './types';
import OdontogramWrapper from '@/components/patients/OdontogramWrapper';
import 'react-odontogram/style.css';

export interface ToothConditionGroup {
  label: string;
  teeth: string[];
  outlineColor: string;
  fillColor: string;
}

interface OdontogramSelectorProps {
  typeDenture: TypeDenture;
  selectedTeethIds: string[];
  onChange: (teeth: ToothDetail[]) => void;
  acteColor?: string;
  teethConditions?: ToothConditionGroup[];
}

export default function OdontogramSelector({
  typeDenture,
  selectedTeethIds,
  onChange,
  acteColor,
  teethConditions
}: OdontogramSelectorProps) {
  
  const couleurActive = acteColor || COULEUR_DEFAUT;

  return (
    <div className="w-full overflow-x-auto bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <OdontogramWrapper
        typeDenture={typeDenture}
        notation="FDI"
        showLabels={true}
        defaultSelected={selectedTeethIds}
        onChange={onChange}
        colors={{ lightBlue: couleurActive, darkBlue: couleurActive }}
        teethConditions={teethConditions}
      />
    </div>
  );
}
