import type { Patient, PatientListFilters, PatientListResponse } from '@/types/patient';

function appendIfPresent(params: URLSearchParams, key: string, value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return;
  params.set(key, String(value));
}

export function buildPatientQueryString(filters: PatientListFilters): string {
  const params = new URLSearchParams();

  appendIfPresent(params, 'search', filters.search.trim());
  appendIfPresent(params, 'gender', filters.gender);
  appendIfPresent(params, 'createdPreset', filters.createdPreset);
  appendIfPresent(params, 'createdFrom', filters.createdFrom);
  appendIfPresent(params, 'createdTo', filters.createdTo);
  appendIfPresent(params, 'birthFrom', filters.birthFrom);
  appendIfPresent(params, 'birthTo', filters.birthTo);
  appendIfPresent(params, 'sort', filters.sort);
  appendIfPresent(params, 'page', filters.page);
  appendIfPresent(params, 'limit', filters.limit);

  return params.toString();
}

export async function fetchPatients(filters: PatientListFilters, signal?: AbortSignal): Promise<PatientListResponse> {
  const queryString = buildPatientQueryString(filters);
  const response = await fetch(`/api/patients${queryString ? `?${queryString}` : ''}`, {
    method: 'GET',
    signal,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || 'Erreur lors du chargement des patients');
  }

  return payload as PatientListResponse;
}

export async function deletePatient(id: string): Promise<void> {
  const response = await fetch(`/api/patients/${id}`, { method: 'DELETE' });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || 'Erreur lors de la suppression du patient');
  }
}

export function sortPatientsByName(patients: Patient[]) {
  return [...patients].sort((left, right) => {
    const leftValue = `${left.last_name} ${left.first_name}`.toLowerCase();
    const rightValue = `${right.last_name} ${right.first_name}`.toLowerCase();
    return leftValue.localeCompare(rightValue, 'fr');
  });
}
