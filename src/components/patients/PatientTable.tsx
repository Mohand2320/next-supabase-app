'use client';

import { Loader2, Mail, Phone, Eye, Edit2, Trash2, Users } from 'lucide-react';
import type { Patient } from '@/types/patient';
import { RowActions } from '@/components/ui/row-actions';

interface PatientTableProps {
  patients: Patient[];
  loading: boolean;
  deletingId: string | null;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}

function getGenderLabel(value: string | null | undefined) {
  if (value === 'M') return 'Homme';
  if (value === 'F') return 'Femme';
  return '—';
}

export function PatientTable({
  patients,
  loading,
  deletingId,
  onView,
  onEdit,
  onDelete,
  onReset,
  hasActiveFilters,
}: PatientTableProps) {
  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span>Chargement des patients...</span>
        </div>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Users className="h-8 w-8" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Aucun patient trouvé</h3>
          <p className="mt-1 text-sm text-slate-500">
            Essayez de modifier vos critères de recherche ou de réinitialiser les filtres.
          </p>
        </div>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Réinitialiser les filtres
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full divide-y divide-slate-100 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Patient</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Sexe</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Date de naissance</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Téléphone</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Email</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Date de création</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((patient) => (
              <tr key={patient.id} className="transition hover:bg-slate-50/70">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{patient.last_name} {patient.first_name}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{getGenderLabel(patient.gender)}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{formatDate(patient.date_of_birth)}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{patient.phone || '—'}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{patient.email || '—'}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{formatDate(patient.created_at)}</td>
                <td className="px-6 py-4 text-right">
                  <RowActions
                    forceInline
                    actions={[
                      { icon: Eye, label: 'Voir le patient', onClick: () => onView(patient.id) },
                      { icon: Edit2, label: 'Modifier le patient', onClick: () => onEdit(patient.id) },
                      { icon: Trash2, label: 'Supprimer le patient', onClick: () => onDelete(patient.id), variant: 'destructive', loading: deletingId === patient.id },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
        {patients.map((patient) => (
          <article key={patient.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Users className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">{patient.last_name} {patient.first_name}</h3>
                <div className="mt-1 flex flex-col gap-0.5 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">{getGenderLabel(patient.gender)}</span>
                  <span>Né(e) le : {formatDate(patient.date_of_birth)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <Phone className="h-5 w-5 text-slate-400" />
                <span className="font-medium">{patient.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <Mail className="h-5 w-5 text-slate-400" />
                <span className="truncate font-medium">{patient.email || '—'}</span>
              </div>
            </div>

            <div className="mt-4 text-xs font-medium text-slate-500">
              Créé le {formatDate(patient.created_at)}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <RowActions
                forceInline
                actions={[
                  { icon: Eye, label: 'Voir le patient', onClick: () => onView(patient.id) },
                  { icon: Edit2, label: 'Modifier le patient', onClick: () => onEdit(patient.id) },
                  { icon: Trash2, label: 'Supprimer le patient', onClick: () => onDelete(patient.id), variant: 'destructive', loading: deletingId === patient.id },
                ]}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
