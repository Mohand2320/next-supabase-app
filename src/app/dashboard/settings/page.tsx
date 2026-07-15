"use client";

import React from 'react';
import { Palette } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Paramètres</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Gérez vos préférences de l'application.
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Apparence</h2>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white">Thème de l'interface</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Basculez entre le mode clair et le mode sombre.</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
