"use client";

import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Activity, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';
import { formatMontant } from '@/components/seance-form/types';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface FinanceData {
  recettesMois: number;
  nbSeances: number;
  panierMoyen: number;
  trend: { name: string; total: number }[];
  repartition: { name: string; value: number }[];
}

export default function FinancesPage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFinances() {
      try {
        const res = await fetch('/api/finance/dashboard');
        if (!res.ok) {
          if (res.status === 403) throw new Error("Accès refusé. Vous n'avez pas l'autorisation de voir cette page.");
          throw new Error('Erreur lors du chargement des données financières');
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchFinances();
  }, []);

  const handleExportCSV = async () => {
    if (!data) return;
    
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'DentiPro';
      workbook.created = new Date();

      // Style constants
      const headerFill: ExcelJS.Fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' } // slate-100
      };
      const headerFont: ExcelJS.Font = { bold: true };
      const numberFormat = '#,##0.00 "DA"';

      // --- Feuille 1: Répartition par catégorie ---
      const sheet1 = workbook.addWorksheet('Répartition par catégorie');
      sheet1.columns = [
        { header: 'Catégorie', key: 'categorie', width: 30 },
        { header: 'Montant généré (DA)', key: 'montant', width: 25, style: { numFmt: numberFormat } },
        { header: 'Part (%)', key: 'part', width: 15, style: { numFmt: '0.00%' } }
      ];

      // Style header
      sheet1.getRow(1).font = headerFont;
      sheet1.getRow(1).fill = headerFill;

      // Add data
      const totalRepart = data.repartition.reduce((sum, item) => sum + item.value, 0);
      data.repartition.forEach(item => {
        sheet1.addRow({
          categorie: item.name,
          montant: item.value,
          part: totalRepart > 0 ? item.value / totalRepart : 0
        });
      });

      // --- Feuille 2: Évolution mensuelle ---
      const sheet2 = workbook.addWorksheet('Évolution mensuelle');
      sheet2.columns = [
        { header: 'Mois', key: 'mois', width: 20 },
        { header: 'Total (DA)', key: 'total', width: 25, style: { numFmt: numberFormat } }
      ];

      // Style header
      sheet2.getRow(1).font = headerFont;
      sheet2.getRow(1).fill = headerFill;

      // Add data
      data.trend.forEach(item => {
        sheet2.addRow({
          mois: item.name,
          total: item.total
        });
      });

      // Add total row at the bottom of sheet2 for consistency with dashboard
      const totalTrend = data.trend.reduce((sum, item) => sum + item.total, 0);
      sheet2.addRow([]); // empty row
      const totalRow = sheet2.addRow({
        mois: 'TOTAL',
        total: totalTrend
      });
      totalRow.font = headerFont;

      // Generate and save file
      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `finance-${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName);
      
    } catch (err) {
      console.error('Erreur lors de la génération Excel', err);
      alert('Erreur lors de la génération du fichier export.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col h-[calc(100vh-200px)] items-center justify-center text-center px-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Erreur d'accès</h2>
        <p className="text-slate-500 max-w-md">{error || "Erreur inconnue"}</p>
      </div>
    );
  }

  const maxTrend = Math.max(...data.trend.map(t => t.total), 1); // Avoid division by zero
  const maxRep = Math.max(...data.repartition.map(r => r.value), 1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord financier</h1>
          <p className="mt-1 text-sm text-slate-500">
            Vue d'ensemble de l'activité du cabinet
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Exporter Excel
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-slate-600">Recettes du mois</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-4">{formatMontant(data.recettesMois)}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-slate-600">Séances du mois</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-4">{data.nbSeances}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-slate-600">Panier moyen (actes payants)</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-4">{formatMontant(data.panierMoyen)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tendance 6 mois */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Évolution des recettes (6 mois)</h3>
          <div className="space-y-4">
            {data.trend.map((item, index) => {
              const width = (item.total / maxTrend) * 100;
              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-slate-500 font-medium shrink-0">{item.name}</div>
                  <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <div className="w-28 text-sm font-semibold text-right text-slate-700">
                    {formatMontant(item.total)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Répartition par catégorie */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Répartition par actes (Mois en cours)</h3>
          {data.repartition.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-slate-500 italic">
              Aucune donnée pour ce mois.
            </div>
          ) : (
            <div className="space-y-4">
              {data.repartition.map((item, index) => {
                const width = (item.value / maxRep) * 100;
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-32 text-sm text-slate-500 font-medium shrink-0 truncate">{item.name}</div>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <div className="w-28 text-sm font-semibold text-right text-slate-700">
                      {formatMontant(item.value)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
