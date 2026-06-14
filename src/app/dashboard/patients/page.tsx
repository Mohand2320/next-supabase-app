'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { PatientSearch } from '@/components/patients/PatientSearch';
import { PatientFilters } from '@/components/patients/PatientFilters';
import { PatientTable } from '@/components/patients/PatientTable';
import { PatientPagination } from '@/components/patients/PatientPagination';
import { fetchPatients, deletePatient as removePatient } from '@/services/patient.service';
import { usePatientFilters } from '@/hooks/usePatientFilters';
import type { Patient, PatientListMeta } from '@/types/patient';

const EMPTY_META: PatientListMeta = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
};

function PatientsContent() {
  const router = useRouter();
  const {
    filters,
    searchInput,
    setSearchInput,
    setGender,
    setCreatedPreset,
    setCreatedRange,
    setBirthRange,
    setSort,
    setPage,
    resetFilters,
    hasActiveFilters,
  } = usePatientFilters();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [meta, setMeta] = useState<PatientListMeta>(EMPTY_META);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadPatients() {
      setLoading(true);
      setError('');

      try {
        const response = await fetchPatients(filters, controller.signal);
        setPatients(response.data);
        setMeta(response.meta);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          const message = loadError instanceof Error ? loadError.message : 'Erreur lors du chargement des patients';
          setError(message);
          setPatients([]);
          setMeta(EMPTY_META);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadPatients();

    return () => controller.abort();
  }, [filters]);

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce patient ?')) return;

    setDeletingId(id);
    try {
      await removePatient(id);
      const response = await fetchPatients(filters);
      setPatients(response.data);
      setMeta(response.meta);
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Erreur lors de la suppression';
      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md sm:h-16 sm:px-8">
        <div>
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Patients</h2>

        </div>

        <button
          onClick={() => router.push('/dashboard/patients/new')}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 sm:px-4"
          aria-label="Nouveau Patient"
        >
          <UserPlus className="h-5 w-5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Nouveau Patient</span>
        </button>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <PatientSearch
            value={searchInput}
            onChange={setSearchInput}
            onReset={resetFilters}
            resultCount={meta.total}
            loading={loading}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <PatientFilters
            gender={filters.gender}
            createdPreset={filters.createdPreset}
            createdFrom={filters.createdFrom}
            createdTo={filters.createdTo}
            birthFrom={filters.birthFrom}
            birthTo={filters.birthTo}
            sort={filters.sort}
            onGenderChange={setGender}
            onCreatedPresetChange={setCreatedPreset}
            onCreatedRangeChange={setCreatedRange}
            onBirthRangeChange={setBirthRange}
            onSortChange={setSort}
            onReset={resetFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </motion.div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <PatientTable
            patients={patients}
            loading={loading}
            deletingId={deletingId}
            onView={(id) => router.push(`/dashboard/patients/${id}`)}
            onEdit={(id) => router.push(`/dashboard/patients/${id}/edit`)}
            onDelete={handleDelete}
            onReset={resetFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-slate-500">Chargement de la pagination...</span>
            </div>
          ) : (
            <PatientPagination meta={meta} onPageChange={setPage} />
          )}
        </motion.div>
      </div>
    </>
  );
}

export default function PatientsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <PatientsContent />
    </Suspense>
  );
}
