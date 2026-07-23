'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Users } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';

import { queueService } from '@/services/queue.service';
import type { FileAttente, StatutQueue } from '@/types/queue';
import QueueList from './QueueList';
import QueueAddDialog from './QueueAddDialog';

function stripSortablePrefix(raw: string): string {
  return raw.replace(/^(mobile-|desktop-)/, '');
}

export default function QueueManager() {
  const [items, setItems] = useState<FileAttente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isAddDialogOpen, setAddDialogOpen] = useState(false);

  const loadQueue = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  const handleStatusChange = async (id: string, newStatus: StatutQueue) => {
    try {
      await queueService.updateStatus(id, { statut: newStatus });
      setItems((prev) => prev.map(item => item.id === id ? { ...item, statut: newStatus } : item));
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour');
    }
  };

  const persistOrder = async (ordered: FileAttente[]) => {
    try {
      await queueService.reorder({
        items: ordered.map((item, i) => ({ id: item.id, position: i + 1 })),
      });
    } catch {
      alert('Erreur lors du réordonnancement');
      loadQueue();
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    const [removed] = newItems.splice(index, 1);
    newItems.splice(index - 1, 0, removed);
    setItems(newItems);
    await persistOrder(newItems);
  };

  const handleMoveDown = async (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    const [removed] = newItems.splice(index, 1);
    newItems.splice(index + 1, 0, removed);
    setItems(newItems);
    await persistOrder(newItems);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = stripSortablePrefix(String(active.id));
    const overId = stripSortablePrefix(String(over.id));

    const oldIndex = items.findIndex((i) => i.id === activeId);
    const newIndex = items.findIndex((i) => i.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = [...items];
    const [removed] = newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, removed);
    setItems(newItems);

    await persistOrder(newItems);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Ajouter un patient
        </button>
      </div>

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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <QueueList
              items={items}
              onStatusChange={handleStatusChange}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          </DndContext>
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