'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClientBrowser } from '@/lib/supabase/client';
import { Loader2, Plus, Trash2, CheckCircle2, Info } from 'lucide-react';
import OdontogramSelector from './OdontogramSelector';
import { enregistrerFeuilleDeSoins } from './seance.service';
import {
  formatMontant,
  determinerDentureInitiale,
  calculerAge,
  SEUIL_AGE_ENFANT,
} from './types';
import type { 
  TypeDenture, 
  CatalogueActeItem, 
  LigneActeSaisie, 
  ToothDetail,
  PatientSeanceInfo
} from './types';

interface NouvelleSeanceFormProps {
  patientId: string;
  dentisteId: string;
  seanceId?: string;
  catalogueActes: CatalogueActeItem[];
  patient: PatientSeanceInfo;
}

export default function NouvelleSeanceForm({
  patientId,
  dentisteId,
  seanceId,
  catalogueActes,
  patient
}: NouvelleSeanceFormProps) {
  const router = useRouter();
  const supabase = createClientBrowser();

  // === TÂCHE 4 : Denture auto ===
  const dentureInitiale = determinerDentureInitiale(patient.dateNaissance);
  const agePatient = calculerAge(patient.dateNaissance);

  // === ETATS GLOBAUX SEANCE ===
  const [typeDenture, setTypeDenture] = useState<TypeDenture>(dentureInitiale);
  const [observations, setObservations] = useState('');
  const [dateHeure, setDateHeure] = useState(new Date().toISOString().slice(0, 16));
  
  // === ETATS LIGNES ===
  const [dentsSelectionnees, setDentsSelectionnees] = useState<ToothDetail[]>([]);
  const [lignes, setLignes] = useState<LigneActeSaisie[]>([]);
  
  // === ETATS FORMULAIRE D'AJOUT (Ligne en cours) ===
  const [acteChoisiId, setActeChoisiId] = useState<string>('');
  const [quantite, setQuantite] = useState<number>(1);
  const [prixUnitaire, setPrixUnitaire] = useState<number>(0);

  // === ETATS SOUMISSION ===
  const [isSaving, setIsSaving] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // === Couleur de l'acte sélectionné ===
  const acteSelectionne = catalogueActes.find(a => a.acteId === acteChoisiId);

  // === CALCULS ===
  const totalSeance = useMemo(() => {
    return lignes.reduce((acc, ligne) => acc + (ligne.prixApplique * ligne.quantite), 0);
  }, [lignes]);

  // === HANDLERS ===
  const handleActeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setActeChoisiId(id);
    if (id) {
      const acte = catalogueActes.find(a => a.acteId === id);
      if (acte) {
        setPrixUnitaire(acte.prix);
        setQuantite(1);
      }
    } else {
      setPrixUnitaire(0);
    }
  };

  const handleAjouterLigne = () => {
    if (!acteChoisiId) return;

    const acte = catalogueActes.find(a => a.acteId === acteChoisiId);
    if (!acte) return;

    const nouvelleLigne: LigneActeSaisie = {
      cleTemporaire: crypto.randomUUID(),
      acteId: acte.acteId,
      libelle: acte.libelle,
      quantite,
      prixApplique: prixUnitaire,
      dentsFdi: dentsSelectionnees.map(d => d.id),
      couleur: acte.couleur
    };

    setLignes([...lignes, nouvelleLigne]);

    // Reset du formulaire d'ajout
    setActeChoisiId('');
    setPrixUnitaire(0);
    setQuantite(1);
    setDentsSelectionnees([]);
  };

  const handleSupprimerLigne = (cle: string) => {
    setLignes(lignes.filter(l => l.cleTemporaire !== cle));
  };

  const handleSauvegarder = async () => {
    if (lignes.length === 0) {
      setErreur("Vous devez ajouter au moins un acte médical.");
      return;
    }
    
    setIsSaving(true);
    setErreur(null);
    
    try {
      await enregistrerFeuilleDeSoins(supabase, {
        seanceId,
        patientId,
        dentisteId,
        dateHeure: new Date(dateHeure).toISOString(),
        observations,
        typeDenture,
        actes: lignes
      });
      
      router.push(`/dashboard/patients/${patientId}`);
      router.refresh();
    } catch (err: any) {
      setErreur(err.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setIsSaving(false);
    }
  };

  // Styles Tailwind partagés
  const inputClass = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      
      {/* GAUCHE: Odontogramme & Observations (col-span-3) */}
      <div className="lg:col-span-3 space-y-6">

        {/* ── TÂCHE 4 : Toggle Denture avec indication ── */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-700">Denture :</span>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              type="button"
              onClick={() => setTypeDenture('ADULTE')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${typeDenture === 'ADULTE' ? 'bg-white shadow-sm text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Adulte
            </button>
            <button 
              type="button"
              onClick={() => setTypeDenture('ENFANT')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${typeDenture === 'ENFANT' ? 'bg-white shadow-sm text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Enfant
            </button>
          </div>
          {agePatient === null && (
            <span className="flex items-center gap-1 text-xs text-amber-600" title={`Valeur par défaut. Ajoutez la date de naissance du patient pour un calcul automatique (seuil : ${SEUIL_AGE_ENFANT} ans).`}>
              <Info className="w-3.5 h-3.5" /> Par défaut (date de naissance inconnue)
            </span>
          )}
          {agePatient !== null && (
            <span className="text-xs text-slate-400">
              Patient : {agePatient} ans
            </span>
          )}
        </div>

        {/* Composant Odontogramme */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-2 overflow-hidden">
          <OdontogramSelector 
            typeDenture={typeDenture}
            selectedTeethIds={dentsSelectionnees.map(d => d.id)}
            onChange={(teeth) => setDentsSelectionnees(teeth)}
          />
          <div className="mt-3 px-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Dents sélectionnées</h4>
            <div className="flex flex-wrap gap-2 min-h-[32px]">
              {dentsSelectionnees.length === 0 ? (
                <span className="text-sm text-slate-400 italic">Aucune dent sélectionnée</span>
              ) : (
                dentsSelectionnees.map(dent => (
                  <span key={dent.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                    {dent.id}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Observations */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <label className={labelClass}>Observations médicales (Séance)</label>
          <textarea 
            value={observations}
            onChange={e => setObservations(e.target.value)}
            className={`${inputClass} min-h-[100px] resize-y`}
            placeholder="Notes sur la séance, complications éventuelles, prescriptions..."
          />
        </div>

      </div>


      {/* DROITE: Saisie des actes & Total (col-span-2) */}
      <div className="lg:col-span-2 space-y-6 flex flex-col">
        
        {/* Formulaire d'ajout d'un acte */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-teal-500">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-teal-600" /> Ajouter un acte
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Acte médical</label>
              {/* ── TÂCHE 2 : Select sans prix, avec pastille couleur ── */}
              <select 
                value={acteChoisiId} 
                onChange={handleActeChange}
                className={inputClass}
              >
                <option value="">-- Sélectionner un acte --</option>
                {catalogueActes.map(acte => (
                  <option key={acte.acteId} value={acte.acteId}>
                    {acte.libelle}
                  </option>
                ))}
              </select>
              {/* Pastille couleur de l'acte sélectionné */}
              {acteSelectionne && (
                <div className="flex items-center gap-2 mt-1.5">
                  <span 
                    className="w-3 h-3 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: acteSelectionne.couleur }}
                  />
                  <span className="text-xs text-slate-500">
                    {acteSelectionne.libelle}
                  </span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Quantité</label>
                <input 
                  type="number" 
                  min="1" 
                  value={quantite} 
                  onChange={e => setQuantite(parseInt(e.target.value) || 1)}
                  className={inputClass}
                />
              </div>
              <div>
                {/* ── TÂCHE 5 : Devise DA ── */}
                <label className={labelClass}>Prix Appliqué (DA)</label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01"
                  value={prixUnitaire} 
                  onChange={e => setPrixUnitaire(parseFloat(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
            </div>

            <button 
              type="button"
              onClick={handleAjouterLigne}
              disabled={!acteChoisiId}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-800 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Ajouter à la séance
            </button>
          </div>
        </div>

        {/* Liste des actes ajoutés */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col">
          <div className="p-4 border-b border-slate-100 flex-1">
            <h3 className="font-bold text-slate-900 mb-4">Actes réalisés ({lignes.length})</h3>
            
            {lignes.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm italic">
                La séance est vide. Ajoutez des actes ci-dessus.
              </div>
            ) : (
              <ul className="space-y-3">
                {lignes.map(ligne => (
                  <li key={ligne.cleTemporaire} className="p-3 rounded-lg border flex items-start justify-between gap-2 group" style={{ borderLeftWidth: 4, borderLeftColor: ligne.couleur, backgroundColor: `${ligne.couleur}08` }}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate flex items-center gap-2" title={ligne.libelle}>
                        <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: ligne.couleur }} />
                        {ligne.quantite}x {ligne.libelle}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ligne.dentsFdi.length > 0 ? (
                          ligne.dentsFdi.map(d => (
                            <span key={d} className="inline-block px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-600">
                              {d}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400">Général</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end shrink-0 gap-1">
                      {/* ── TÂCHE 5 : formatMontant ── */}
                      <span className="text-sm font-bold" style={{ color: ligne.couleur }}>
                        {formatMontant(ligne.prixApplique * ligne.quantite)}
                      </span>
                      <button 
                        onClick={() => handleSupprimerLigne(ligne.cleTemporaire)}
                        className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Footer Total & Submit */}
          <div className="p-4 bg-slate-50 rounded-b-xl border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Total Séance</span>
              {/* ── TÂCHE 5 : formatMontant ── */}
              <span className="text-2xl font-black text-slate-900">{formatMontant(totalSeance)}</span>
            </div>
            
            {erreur && (
              <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-100">
                {erreur}
              </div>
            )}
            
            <button 
              type="button"
              onClick={handleSauvegarder}
              disabled={isSaving || lignes.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition-all shadow-md shadow-teal-200 disabled:opacity-50"
            >
              {isSaving ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Enregistrement...</>
              ) : (
                <><CheckCircle2 className="w-5 h-5" /> Enregistrer la séance</>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
