import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';
import { requireRoles } from '@/lib/auth/guards';

export async function GET(request: Request) {
  try {
    // Only admins and dentistes can see finances
    const supabase = await createClientServer();
    const { isAuthorized, error: authError } = await requireRoles(['admin', 'dentiste']);
    if (!isAuthorized) {
      return NextResponse.json({ error: authError || 'Accès refusé' }, { status: 403 });
    }

    // Today's date info
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    
    // First day of current month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
    
    // First day of 6 months ago (for trend)
    const sixMonthsAgoDate = new Date(currentYear, currentMonth - 5, 1);
    const sixMonthsAgo = sixMonthsAgoDate.toISOString();

    // 1. Current month stats (Revenue, Count, Avg Basket > 0)
    const { data: currentMonthSeances, error: seancesError } = await supabase
      .from('seances')
      .select('prix')
      .gte('date_heure', firstDayOfMonth);

    if (seancesError) throw seancesError;

    let recettesMois = 0;
    let nbSeances = 0;
    let sumPrixForAvg = 0;
    let countPrixForAvg = 0;

    if (currentMonthSeances) {
      nbSeances = currentMonthSeances.length;
      for (const s of currentMonthSeances) {
        recettesMois += Number(s.prix || 0);
        if (Number(s.prix) > 0) {
          sumPrixForAvg += Number(s.prix);
          countPrixForAvg++;
        }
      }
    }
    const panierMoyen = countPrixForAvg > 0 ? (sumPrixForAvg / countPrixForAvg) : 0;

    // 2. Trend for the last 6 months
    const { data: trendSeances, error: trendError } = await supabase
      .from('seances')
      .select('prix, date_heure')
      .gte('date_heure', sixMonthsAgo);

    if (trendError) throw trendError;

    // Initialize trend array with 0s for the last 6 months
    const months = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
    const trendMap = new Map();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${months[d.getMonth()]} ${d.getFullYear()}`;
      trendMap.set(key, { name: label, total: 0 });
    }

    if (trendSeances) {
      for (const s of trendSeances) {
        const d = new Date(s.date_heure);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (trendMap.has(key)) {
          trendMap.get(key).total += Number(s.prix || 0);
        }
      }
    }
    const trend = Array.from(trendMap.values());

    // 3. Category breakdown
    // We need to query seances -> seance_actes -> actes_medicaux
    // Since Supabase JS client doesn't support complex aggregations easily, we'll fetch flat and aggregate
    const { data: categoryData, error: catError } = await supabase
      .from('seances')
      .select(`
        date_heure,
        seance_actes (
          prix_applique,
          quantite,
          actes_medicaux (
            categorie
          )
        )
      `)
      .gte('date_heure', firstDayOfMonth); // Just for current month for breakdown

    if (catError) throw catError;

    const categoriesMap = new Map<string, number>();
    const ALL_CATEGORIES = ['CONSERVATEUR', 'ENDODONTIE', 'PROTHESE', 'PARODONTOLOGIE', 'CHIRURGIE', 'ESTHETIQUE', 'CONSULTATION', 'AUTRE'];
    ALL_CATEGORIES.forEach(cat => categoriesMap.set(cat, 0));

    if (categoryData) {
      for (const s of categoryData) {
        const actes = Array.isArray(s.seance_actes) ? s.seance_actes : [];
        for (const sa of actes) {
          const acteMed = Array.isArray(sa.actes_medicaux) ? sa.actes_medicaux[0] : sa.actes_medicaux;
          const cat = acteMed?.categorie || 'AUTRE';
          const ca = Number(sa.prix_applique || 0) * Number(sa.quantite || 1);
          categoriesMap.set(cat, (categoriesMap.get(cat) || 0) + ca);
        }
      }
    }
    
    // Calculate total for percentage later
    const totalCategories = Array.from(categoriesMap.values()).reduce((sum, val) => sum + val, 0);

    const repartition = Array.from(categoriesMap.entries()).map(([name, value]) => ({

      name,
      value
    })).sort((a, b) => b.value - a.value);

    return NextResponse.json({
      recettesMois,
      nbSeances,
      panierMoyen,
      trend,
      repartition
    });

  } catch (error: any) {
    console.error('[API_ERROR] GET /api/finance/dashboard:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
