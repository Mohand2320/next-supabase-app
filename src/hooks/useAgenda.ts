'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  RendezVous,
  CalendarView,
  StatutRDV,
  OrigineAnnulation,
  RdvCreatePayload,
  RdvConvertPatientPayload,
} from '@/types/rdv';
import {
  fetchRdvs,
  createRdv,
  updateRdvStatus,
  deleteRdv,
  convertMinimalToPatient,
} from '@/services/rdv.service';

// ============================================================
// Hook — useAgenda
// Gère l'état global du module Agenda : date, vue, RDV, modales
// ============================================================

export interface UseAgendaReturn {
  // State
  currentDate: Date;
  view: CalendarView;
  rdvs: RendezVous[];
  loading: boolean;
  error: string | null;

  // Selected RDV
  selectedRdv: RendezVous | null;
  drawerOpen: boolean;

  // Modals
  createModalOpen: boolean;
  cancelModalOpen: boolean;
  terminerFlowOpen: boolean;
  conversionData: {
    rdv: RendezVous;
    candidats: Array<{ id: string; nom: string; prenom: string; telephone: string | null }>;
  } | null;

  // Actions navigation
  setView: (view: CalendarView) => void;
  goToDate: (date: Date) => void;
  goToday: () => void;
  goPrev: () => void;
  goNext: () => void;

  // Actions modales
  openCreateModal: (prefilledDate?: Date) => void;
  closeCreateModal: () => void;
  openDrawer: (rdv: RendezVous) => void;
  closeDrawer: () => void;
  openCancelModal: () => void;
  closeCancelModal: () => void;

  // Actions RDV
  handleCreateRdv: (payload: RdvCreatePayload) => Promise<void>;
  handleConfirmer: (rdvId: string) => Promise<void>;
  handleTerminer: (rdvId: string) => Promise<void>;
  handleAnnuler: (rdvId: string, origine: OrigineAnnulation) => Promise<void>;
  handleDelete: (rdvId: string) => Promise<void>;
  handleConvertPatient: (rdvId: string, payload: RdvConvertPatientPayload) => Promise<void>;
  closeConversion: () => void;

  // Prefilled date for create modal
  prefilledDate: Date | null;

  // Reload
  reload: () => void;
}

function getDateRange(date: Date, view: CalendarView): { start: string; end: string } {
  const d = new Date(date);

  if (view === 'day') {
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  if (view === 'week') {
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1; // Start from Monday
    const monday = new Date(d);
    monday.setDate(d.getDate() - diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const start = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0);
    const end = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), 23, 59, 59);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  // month
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function useAgenda(): UseAgendaReturn {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('week');
  const [rdvs, setRdvs] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedRdv, setSelectedRdv] = useState<RendezVous | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [terminerFlowOpen, setTerminerFlowOpen] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<Date | null>(null);
  const [conversionData, setConversionData] = useState<UseAgendaReturn['conversionData']>(null);

  const abortRef = useRef<AbortController | null>(null);

  // --- Chargement des RDV ---
  const loadRdvs = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const { start, end } = getDateRange(currentDate, view);
      const result = await fetchRdvs(
        { date_debut: start, date_fin: end },
        controller.signal
      );
      setRdvs(result.data);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Erreur de chargement');
      }
    } finally {
      setLoading(false);
    }
  }, [currentDate, view]);

  useEffect(() => {
    loadRdvs();
    return () => abortRef.current?.abort();
  }, [loadRdvs]);

  // --- Navigation ---
  const goToDate = useCallback((date: Date) => setCurrentDate(date), []);
  const goToday = useCallback(() => setCurrentDate(new Date()), []);

  const goPrev = useCallback(() => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (view === 'day') d.setDate(d.getDate() - 1);
      else if (view === 'week') d.setDate(d.getDate() - 7);
      else d.setMonth(d.getMonth() - 1);
      return d;
    });
  }, [view]);

  const goNext = useCallback(() => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (view === 'day') d.setDate(d.getDate() + 1);
      else if (view === 'week') d.setDate(d.getDate() + 7);
      else d.setMonth(d.getMonth() + 1);
      return d;
    });
  }, [view]);

  // --- Modales ---
  const openCreateModal = useCallback((date?: Date) => {
    setPrefilledDate(date ?? null);
    setCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setCreateModalOpen(false);
    setPrefilledDate(null);
  }, []);

  const openDrawer = useCallback((rdv: RendezVous) => {
    setSelectedRdv(rdv);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedRdv(null);
  }, []);

  const openCancelModal = useCallback(() => setCancelModalOpen(true), []);
  const closeCancelModal = useCallback(() => setCancelModalOpen(false), []);

  // --- Actions RDV ---
  const handleCreateRdv = useCallback(async (payload: RdvCreatePayload) => {
    await createRdv(payload);
    closeCreateModal();
    await loadRdvs();
  }, [closeCreateModal, loadRdvs]);

  const handleConfirmer = useCallback(async (rdvId: string) => {
    const result = await updateRdvStatus(rdvId, { nouveau_statut: 'CONFIRME' });
    setSelectedRdv(result.rdv);
    await loadRdvs();
  }, [loadRdvs]);

  const handleTerminer = useCallback(async (rdvId: string) => {
    const result = await updateRdvStatus(rdvId, { nouveau_statut: 'TERMINE' });
    setSelectedRdv(result.rdv);

    if (result.conversion_proposee && result.candidats_patients) {
      setConversionData({
        rdv: result.rdv,
        candidats: result.candidats_patients,
      });
    }

    await loadRdvs();
  }, [loadRdvs]);

  const handleAnnuler = useCallback(async (rdvId: string, origine: OrigineAnnulation) => {
    const result = await updateRdvStatus(rdvId, {
      nouveau_statut: 'ANNULE',
      origine_annulation: origine,
    });
    setSelectedRdv(result.rdv);
    setCancelModalOpen(false);
    await loadRdvs();
  }, [loadRdvs]);

  const handleDelete = useCallback(async (rdvId: string) => {
    await deleteRdv(rdvId);
    closeDrawer();
    await loadRdvs();
  }, [closeDrawer, loadRdvs]);

  const handleConvertPatient = useCallback(async (
    rdvId: string,
    payload: RdvConvertPatientPayload
  ) => {
    await convertMinimalToPatient(rdvId, payload);
    setConversionData(null);
    await loadRdvs();
  }, [loadRdvs]);

  const closeConversion = useCallback(() => setConversionData(null), []);

  return {
    currentDate,
    view,
    rdvs,
    loading,
    error,
    selectedRdv,
    drawerOpen,
    createModalOpen,
    cancelModalOpen,
    terminerFlowOpen,
    conversionData,
    setView,
    goToDate,
    goToday,
    goPrev,
    goNext,
    openCreateModal,
    closeCreateModal,
    openDrawer,
    closeDrawer,
    openCancelModal,
    closeCancelModal,
    handleCreateRdv,
    handleConfirmer,
    handleTerminer,
    handleAnnuler,
    handleDelete,
    handleConvertPatient,
    closeConversion,
    prefilledDate,
    reload: loadRdvs,
  };
}
