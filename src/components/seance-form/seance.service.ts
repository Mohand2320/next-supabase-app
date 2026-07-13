import type { SupabaseClient } from '@supabase/supabase-js';
import type { CatalogueActeItem, NouvelleSeanceInput } from './types';
import { COULEUR_DEFAUT } from './types';

/**
 * Récupère le catalogue d'actes pour un dentiste spécifique.
 * Si le dentiste n'a pas personnalisé un acte, on utilise le prix par défaut (prix_defaut).
 * Inclut désormais la couleur de chaque acte.
 */
export async function getCatalogueActes(
  supabase: SupabaseClient<any, "public", any>,
  dentisteId: string
): Promise<CatalogueActeItem[]> {
  // 1. Récupérer tous les actes de base (incluant couleur)
  const { data: actesBase, error: errBase } = await supabase
    .from('actes_medicaux')
    .select('*');

  if (errBase) throw errBase;

  // 2. Tenter de récupérer le catalogue personnalisé du dentiste
  const { data: catalogue, error: errCat } = await supabase
    .from('catalogues_actes')
    .select('id')
    .eq('dentiste_id', dentisteId)
    .maybeSingle();

  if (errCat) throw errCat;

  let itemsPersonnalises: any[] = [];
  if (catalogue) {
    // 3. Récupérer les items du catalogue personnalisé
    const { data: items, error: errItems } = await supabase
      .from('catalogue_actes_items')
      .select('acte_id, prix_personnalise')
      .eq('catalogue_id', catalogue.id);
    
    if (errItems) throw errItems;
    itemsPersonnalises = items || [];
  }

  // 4. Fusionner les deux — inclure la couleur
  const allActs = (actesBase || []).map((acte: any) => {
    const custom = itemsPersonnalises.find(i => i.acte_id === acte.id);
    return {
      acteId: acte.id,
      libelle: acte.libelle,
      prix: custom?.prix_personnalise !== undefined && custom?.prix_personnalise !== null
        ? Number(custom.prix_personnalise)
        : Number(acte.prix_defaut),
      couleur: acte.couleur || COULEUR_DEFAUT
    };
  });

  // 5. Dédupliquer par libellé (pour éviter les doublons/triplons signalés)
  const uniqueActs: CatalogueActeItem[] = [];
  const seen = new Set<string>();
  for (const acte of allActs) {
    const key = acte.libelle.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueActs.push(acte);
    }
  }

  return uniqueActs.sort((a, b) => a.libelle.localeCompare(b.libelle));
}

/**
 * Enregistre ou met à jour la séance et ses actes via un appel RPC atomique.
 */
export async function enregistrerFeuilleDeSoins(
  supabase: SupabaseClient<any, "public", any>,
  input: NouvelleSeanceInput
): Promise<string> {
  // Construire le tableau global de localisation (deduplication) pour la séance
  const allDents = input.actes.flatMap(a => a.dentsFdi);
  const localisationGlobale = Array.from(new Set(allDents));

  // Préparer le format attendu par la fonction RPC
  const payloadActes = input.actes.map(acte => ({
    acte_id: acte.acteId,
    quantite: acte.quantite,
    prix_applique: acte.prixApplique,
    localisation: acte.dentsFdi
  }));

  const { data: seanceId, error } = await supabase.rpc('enregistrer_feuille_de_soins', {
    p_seance_id: input.seanceId || null,
    p_patient_id: input.patientId,
    p_dentiste_id: input.dentisteId,
    p_date_heure: input.dateHeure,
    p_observations: input.observations,
    p_type_denture: input.typeDenture,
    p_localisation: localisationGlobale,
    p_actes: payloadActes
  });

  if (error) {
    console.error("Erreur RPC enregistrer_feuille_de_soins:", error);
    throw error;
  }

  return seanceId;
}
