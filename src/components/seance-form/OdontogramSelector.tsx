'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { TypeDenture, ToothDetail } from './types';
import { COULEUR_DEFAUT } from './types';

// Import dynamique pour éviter les erreurs d'hydratation (SSR désactivé)
const Odontogram = dynamic(() => import('react-odontogram'), { ssr: false });
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
  
  // Note: react-odontogram utilise FDI par défaut. 
  // maxTeeth=5 affichera le schéma pédiatrique (51-55, etc) 
  // maxTeeth=8 affichera le schéma adulte (11-18, etc)

  // La couleur de l'acte sélectionné est passée via la prop officielle `colors`.
  // lightBlue = couleur de remplissage (fill) des dents sélectionnées
  // darkBlue  = couleur de contour/surbrillance des dents sélectionnées
  // On doit passer les deux pour un rendu cohérent.
  const couleurActive = acteColor || COULEUR_DEFAUT;

  return (
    <div className="w-full overflow-x-auto bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <Odontogram 
        notation="FDI"
        showLabels={true}
        defaultSelected={selectedTeethIds}
        maxTeeth={typeDenture === 'ENFANT' ? 5 : 8}
        onChange={onChange}
        colors={{ lightBlue: couleurActive, darkBlue: couleurActive }}
        teethConditions={teethConditions}
      />
    </div>
  );
}
