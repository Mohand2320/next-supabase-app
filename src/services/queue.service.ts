import type { FileAttente, AddToQueueDTO, UpdateQueueStatusDTO, ReorderQueueDTO } from '@/types/queue';

const API_BASE_URL = '/api/queue';

export const queueService = {
  /**
   * Récupère la file d'attente du jour actuel.
   */
  async getTodayQueue(): Promise<FileAttente[]> {
    const res = await fetch(API_BASE_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erreur lors de la récupération de la file d\'attente');
    }
    
    return res.json();
  },

  /**
   * Ajoute une nouvelle entrée à la file d'attente.
   */
  async addToQueue(data: AddToQueueDTO): Promise<FileAttente> {
    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erreur lors de l\'ajout à la file d\'attente');
    }

    return res.json();
  },

  /**
   * Met à jour le statut d'une entrée.
   */
  async updateStatus(id: string, data: UpdateQueueStatusDTO): Promise<FileAttente> {
    const res = await fetch(`${API_BASE_URL}/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erreur lors de la mise à jour du statut');
    }

    return res.json();
  },

  /**
   * Réorganise les positions dans la file d'attente.
   */
  async reorder(data: ReorderQueueDTO): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE_URL}/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erreur lors de la réorganisation de la file');
    }

    return res.json();
  }
};
