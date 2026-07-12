'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { TypeDenture, ToothDetail } from './types';

// Import dynamique pour éviter les erreurs d'hydratation (SSR désactivé)
const Odontogram = dynamic(() => import('react-odontogram'), { ssr: false });
import 'react-odontogram/style.css';

interface OdontogramSelectorProps {
  typeDenture: TypeDenture;
  selectedTeethIds: string[];
  onChange: (teeth: ToothDetail[]) => void;
}

export default function OdontogramSelector({
  typeDenture,
  selectedTeethIds,
  onChange
}: OdontogramSelectorProps) {
  
  // Note: react-odontogram utilise FDI par défaut. 
  // maxTeeth=5 affichera le schéma pédiatrique (51-55, etc) 
  // maxTeeth=8 affichera le schéma adulte (11-18, etc)
  // TODO: Vérifier visuellement en prod si le mode enfant (maxTeeth=5) s'affiche correctement avec FDI.

  return (
    <div className="w-full overflow-x-auto bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <Odontogram 
        notation="FDI"
        showLabels={true}
        defaultSelected={selectedTeethIds}
        maxTeeth={typeDenture === 'ENFANT' ? 5 : 8}
        onChange={onChange}
      />
    </div>
  );
}
