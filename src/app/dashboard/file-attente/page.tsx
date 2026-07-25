import React from 'react';
import QueueManager from '@/components/queue/QueueManager';

export const metadata = {
  title: 'File d\'attente - Mon Cabinet',
};

export default function FileAttentePage() {
  return (
    <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">File d'attente</h2>
          <p className="text-slate-500">
            Gérez les patients en attente et l'ordre de passage pour la journée.
          </p>
        </div>
      </div>

      <QueueManager />
    </div>
  );
}
