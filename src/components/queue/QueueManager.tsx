'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Users } from 'lucide-react';
import { queueService } from '@/services/queue.service';
import type { FileAttente, StatutQueue } from '@/types/queue';
import QueueList from './QueueList';
import QueueAddDialog from './QueueAddDialog';

export default function QueueManager() {
  const [items, setItems] = useState<FileAttente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isAddDialogOpen, setAddDialogOpen] = useState(false);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await queueService.getTodayQueue();
      setItems(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de la file');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleStatusChange = async (id: string, newStatus: StatutQueue) => {
    try {
      await queueService.updateStatus(id, { statut: newStatus });
      setItems((prev) => prev.map(item => item.id === id ? { ...item, statut: newStatus } : item));
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    const temp = newItems[index - 1].position;
    newItems[index - 1].position = newItems[index].position;
    newItems[index].position = temp;
    
    const sorted = newItems.sort((a, b) => a.position - b.position);
    setItems(sorted);

    try {
      await queueService.reorder({
        items: [
          { id: sorted[index - 1].id, position: sorted[index - 1].position },
          { id: sorted[index].id, position: sorted[index].position }
        ]
      });
    } catch (err: any) {
      alert('Erreur lors du réordonnancement');
      loadQueue();
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index + 1].position;
    newItems[index + 1].position = newItems[index].position;
    newItems[index].position = temp;
    
    const sorted = newItems.sort((a, b) => a.position - b.position);
    setItems(sorted);

    try {
      await queueService.reorder({
        items: [
          { id: sorted[index].id, position: sorted[index].position },
          { id: sorted[index + 1].id, position: sorted[index + 1].position }
        ]
      });
    } catch (err: any) {
      alert('Erreur lors du réordonnancement');
      loadQueue();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center gap-3">
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
          onClick={() => setAddDialogOpen(true)}
        >
          <CalendarIcon className="h-4 w-4" />
          Ajouter depuis RDV
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors"
          onClick={() => setAddDialogOpen(true)}
        >
          <Users className="h-4 w-4" />
          Patient existant
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Ajouter Urgence (Walk-in)
        </button>
      </div>

      {/* Main Content */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-600" />
            <p>Chargement de la file d'attente...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-900">Aucun patient en attente</h3>
            <p className="mt-1 text-sm text-slate-500">La file d'attente d'aujourd'hui est vide.</p>
          </div>
        ) : (
          <QueueList 
            items={items} 
            onStatusChange={handleStatusChange} 
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
        )}
      </div>

      <QueueAddDialog
        isOpen={isAddDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSuccess={loadQueue}
      />
    </div>
  );
}

// Temporary icon to avoid import error if Calendar is not used from lucide
function CalendarIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}
