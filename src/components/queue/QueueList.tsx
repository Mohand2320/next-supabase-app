'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Clock, User, AlertCircle, GripVertical, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FileAttente, StatutQueue } from '@/types/queue';

interface QueueListProps {
  items: FileAttente[];
  onStatusChange: (id: string, newStatus: StatutQueue) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (id: string) => void;
}

const statusColors: Record<StatutQueue, { bg: string; text: string }> = {
  EN_ATTENTE: { bg: 'bg-amber-50', text: 'text-amber-700' },
  APPELE: { bg: 'bg-blue-50', text: 'text-blue-700' },
  EN_CONSULTATION: { bg: 'bg-purple-50', text: 'text-purple-700' },
  TERMINE: { bg: 'bg-green-50', text: 'text-green-700' },
  ANNULE: { bg: 'bg-slate-100', text: 'text-slate-700' },
  ABSENT: { bg: 'bg-red-50', text: 'text-red-700' },
};

const statusLabels: Record<StatutQueue, string> = {
  EN_ATTENTE: 'En attente',
  APPELE: 'Appelé',
  EN_CONSULTATION: 'En consultation',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
  ABSENT: 'Absent',
};

function getItemDisplay(item: FileAttente) {
  const isWalkIn = !item.patient_id && !item.rdv_id;
  const displayName = item.patient
    ? `${item.patient.nom} ${item.patient.prenom}`
    : (item.nom_minimal ? `${item.nom_minimal} ${item.prenom_minimal || ''}` : 'Inconnu');
  const displayMotif = item.rendez_vous?.motif || item.motif || '-';
  const { bg, text } = statusColors[item.statut];
  return { isWalkIn, displayName, displayMotif, bg, text };
}

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getWaitInfo(heureArrivee: string): { minutes: number; className: string; label: string } {
  const now = Date.now();
  const arrival = new Date(heureArrivee).getTime();
  const diffMs = now - arrival;
  const minutes = Math.floor(diffMs / 60000);

  let className: string;
  if (minutes < 15) {
    className = 'text-emerald-600';
  } else if (minutes < 30) {
    className = 'text-amber-600';
  } else {
    className = 'text-red-600';
  }

  const label = minutes < 1 ? "À l'instant" : `en attente depuis ${minutes} min`;
  return { minutes, className, label };
}

// ─── Desktop variant: renders <tr> only ────────────────────────────

function SortableDesktopRow({ item, index, items, onStatusChange, onMoveUp, onMoveDown, onRemove }: {
  item: FileAttente;
  index: number;
  items: FileAttente[];
  onStatusChange: (id: string, newStatus: StatutQueue) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `desktop-${item.id}` });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { isWalkIn, displayName, displayMotif } = getItemDisplay(item);
  const { bg, text } = statusColors[item.statut];
  const waitInfo = getWaitInfo(item.heure_arrivee);

  return (
    <tr ref={setNodeRef} style={style} className="odd:bg-white even:bg-slate-100 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <button className="text-slate-400 hover:text-slate-600 touch-none cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
            <GripVertical className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-slate-700 w-6 text-center">
            #{item.position}
          </span>
          <div className="flex flex-col">
            <button
              disabled={index === 0}
              onClick={() => onMoveUp(index)}
              className="text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              disabled={index === items.length - 1}
              onClick={() => onMoveDown(index)}
              className="text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="flex items-center text-sm text-slate-600">
            <Clock className="mr-2 h-4 w-4 text-slate-400" />
            {formatTime(item.heure_arrivee)}
          </div>
          {(item.statut === 'EN_ATTENTE' || item.statut === 'APPELE') && (
            <div className={`text-xs font-medium mt-0.5 ${waitInfo.className}`}>
              {waitInfo.label}
            </div>
          )}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-slate-500" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
              {displayName}
              {isWalkIn && (
                <span title="Urgence / Sans dossier" className="text-amber-500">
                  <AlertCircle className="w-4 h-4" />
                </span>
              )}
            </div>
            {(item.patient?.telephone || item.telephone_minimal) && (
              <div className="text-xs text-slate-500">
                {item.patient?.telephone || item.telephone_minimal}
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-slate-900">{displayMotif}</div>
        <div className="text-xs text-slate-500">
          {item.rendez_vous ? 'RDV programmé' : (isWalkIn ? 'Walk-in (Urgence)' : 'Patient existant')}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <select
          value={item.statut}
          onChange={(e) => onStatusChange(item.id, e.target.value as StatutQueue)}
          className={`text-xs font-semibold rounded-full px-3 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-blue-600 ${bg} ${text}`}
        >
          {Object.entries(statusLabels).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={() => onRemove(item.id)}
          className="text-slate-400 hover:text-red-600 transition-colors p-1"
          title="Retirer de la file"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

// ─── Mobile variant: renders <div> card only ──────────────────────

function SortableMobileCard({ item, index, items, onStatusChange, onMoveUp, onMoveDown, onRemove }: {
  item: FileAttente;
  index: number;
  items: FileAttente[];
  onStatusChange: (id: string, newStatus: StatutQueue) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `mobile-${item.id}` });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { isWalkIn, displayName, displayMotif } = getItemDisplay(item);
  const { bg, text } = statusColors[item.statut];
  const waitInfo = getWaitInfo(item.heure_arrivee);

  return (
    <div ref={setNodeRef} style={style} className="p-4 space-y-4 odd:bg-white even:bg-slate-100">
      {/* Ligne 1 : Ordre, Flèches, Heure, Suppression */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="text-slate-400 hover:text-slate-600 touch-none cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
            <GripVertical className="w-4 h-4" />
          </button>
          <span className="flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full bg-slate-800 text-white text-xs font-bold">
            {item.position}
          </span>
          <div className="flex gap-1">
            <button
              disabled={index === 0}
              onClick={() => onMoveUp(index)}
              className="text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors p-1"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              disabled={index === items.length - 1}
              onClick={() => onMoveDown(index)}
              className="text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors p-1"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="text-slate-500">
              <Clock className="mr-1 h-3.5 w-3.5 inline" />
              {formatTime(item.heure_arrivee)}
            </span>
            {(item.statut === 'EN_ATTENTE' || item.statut === 'APPELE') && (
              <span className={waitInfo.className}>
                {waitInfo.label}
              </span>
            )}
          </div>
          <button
            onClick={() => onRemove(item.id)}
            className="text-slate-400 hover:text-red-600 transition-colors p-1"
            title="Retirer de la file"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ligne 2 : Info patient */}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
          <User className="h-5 w-5 text-slate-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
            <span className="truncate">{displayName}</span>
            {isWalkIn && (
              <span title="Urgence / Sans dossier" className="text-amber-500 shrink-0">
                <AlertCircle className="w-4 h-4" />
              </span>
            )}
          </div>
          {(item.patient?.telephone || item.telephone_minimal) && (
            <div className="text-xs text-slate-500 truncate">
              {item.patient?.telephone || item.telephone_minimal}
            </div>
          )}
        </div>
      </div>

      {/* Ligne 3 : Motif */}
      <div>
        <div className="text-sm text-slate-900">{displayMotif}</div>
        <div className="text-xs text-slate-500">
          {item.rendez_vous ? 'RDV programmé' : (isWalkIn ? 'Walk-in (Urgence)' : 'Patient existant')}
        </div>
      </div>

      {/* Ligne 4 : Statut (Séparé) */}
      <div className="pt-1">
        <select
          value={item.statut}
          onChange={(e) => onStatusChange(item.id, e.target.value as StatutQueue)}
          className={`w-full text-sm font-semibold rounded-lg px-3 py-2 border-0 ring-1 ring-inset ring-slate-200 cursor-pointer focus:ring-2 focus:ring-inset focus:ring-blue-600 ${bg} ${text}`}
        >
          {Object.entries(statusLabels).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── Main exported component ───────────────────────────────────────

export default function QueueList({ items, onStatusChange, onMoveUp, onMoveDown, onRemove }: QueueListProps) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Mobile cards */}
      <div className="block sm:hidden divide-y divide-slate-100">
        <SortableContext items={items.map(i => `mobile-${i.id}`)} strategy={verticalListSortingStrategy}>
          {items.map((item, index) => (
            <SortableMobileCard
              key={item.id}
              item={item}
              index={index}
              items={items}
              onStatusChange={onStatusChange}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onRemove={onRemove}
            />
          ))}
        </SortableContext>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <SortableContext items={items.map(i => `desktop-${i.id}`)} strategy={verticalListSortingStrategy}>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">
                  Ordre
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Arrivée
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Patient
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Motif / Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Statut
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {items.map((item, index) => (
                <SortableDesktopRow
                  key={item.id}
                  item={item}
                  index={index}
                  items={items}
                  onStatusChange={onStatusChange}
                  onMoveUp={onMoveUp}
                  onMoveDown={onMoveDown}
                  onRemove={onRemove}
                />
              ))}
            </tbody>
          </table>
        </SortableContext>
      </div>
    </>
  );
}