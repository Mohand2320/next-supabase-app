'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type {
  PatientCreationPreset,
  PatientGenderFilter,
  PatientListFilters,
  PatientSortOption,
} from '@/types/patient';
import { patientListQuerySchema } from '@/lib/validations/patient';

const DEFAULT_FILTERS: PatientListFilters = {
  search: '',
  gender: 'all',
  createdPreset: 'all',
  createdFrom: '',
  createdTo: '',
  birthFrom: '',
  birthTo: '',
  sort: 'newest',
  page: 1,
  limit: 20,
};

function readFiltersFromSearchParams(searchParams: ReturnType<typeof useSearchParams>): PatientListFilters {
  const raw = {
    search: searchParams.get('search') || '',
    gender:
      (searchParams.get('gender') === 'male' || searchParams.get('gender') === 'M'
        ? 'male'
        : searchParams.get('gender') === 'female' || searchParams.get('gender') === 'F'
          ? 'female'
          : 'all') as PatientGenderFilter,
    createdPreset: (searchParams.get('createdPreset') || 'all') as PatientCreationPreset,
    createdFrom: searchParams.get('createdFrom') || '',
    createdTo: searchParams.get('createdTo') || '',
    birthFrom: searchParams.get('birthFrom') || '',
    birthTo: searchParams.get('birthTo') || '',
    sort: (() => {
      const sort = searchParams.get('sort') || '';
      if (sort === 'name_asc' || sort === 'name_desc' || sort === 'oldest' || sort === 'newest') {
        return sort as PatientSortOption;
      }

      const sortBy = searchParams.get('sortBy');
      const sortOrder = searchParams.get('sortOrder');
      if (sortBy === 'last_name') return sortOrder === 'desc' ? 'name_desc' : 'name_asc';
      if (sortBy === 'created_at') return sortOrder === 'asc' ? 'oldest' : 'newest';
      return 'newest';
    })(),
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '20',
  };

  const parsed = patientListQuerySchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_FILTERS;
}

export function usePatientFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const parsedFromUrl = useMemo(() => readFiltersFromSearchParams(searchParams), [searchParams]);
  const [filters, setFilters] = useState<PatientListFilters>(parsedFromUrl);
  const [searchInput, setSearchInput] = useState(parsedFromUrl.search);

  useEffect(() => {
    setFilters(parsedFromUrl);
    setSearchInput(parsedFromUrl.search);
  }, [parsedFromUrl]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters((current) => {
        if (current.search === searchInput) {
          return current;
        }

        return {
          ...current,
          search: searchInput,
          page: 1,
        };
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams.toString());
    const nextParams = new URLSearchParams();

    if (filters.search.trim()) nextParams.set('search', filters.search.trim());
    if (filters.gender !== 'all') nextParams.set('gender', filters.gender);
    if (filters.createdPreset !== 'all') nextParams.set('createdPreset', filters.createdPreset);
    if (filters.createdPreset === 'custom') {
      if (filters.createdFrom) nextParams.set('createdFrom', filters.createdFrom);
      if (filters.createdTo) nextParams.set('createdTo', filters.createdTo);
    }
    if (filters.birthFrom) nextParams.set('birthFrom', filters.birthFrom);
    if (filters.birthTo) nextParams.set('birthTo', filters.birthTo);
    if (filters.sort !== 'newest') nextParams.set('sort', filters.sort);
    if (filters.page > 1) nextParams.set('page', String(filters.page));
    if (filters.limit !== DEFAULT_FILTERS.limit) nextParams.set('limit', String(filters.limit));

    const currentString = currentParams.toString();
    const nextString = nextParams.toString();

    if (currentString !== nextString) {
      router.replace(nextString ? `${pathname}?${nextString}` : pathname, { scroll: false });
    }
  }, [filters, pathname, router, searchParams]);

  const setGender = useCallback((gender: PatientGenderFilter) => {
    setFilters((current) => ({ ...current, gender, page: 1 }));
  }, []);

  const setCreatedPreset = useCallback((createdPreset: PatientCreationPreset) => {
    setFilters((current) => ({
      ...current,
      createdPreset,
      createdFrom: createdPreset === 'custom' ? current.createdFrom : '',
      createdTo: createdPreset === 'custom' ? current.createdTo : '',
      page: 1,
    }));
  }, []);

  const setCreatedRange = useCallback((createdFrom: string, createdTo: string) => {
    setFilters((current) => ({ ...current, createdFrom, createdTo, page: 1, createdPreset: 'custom' }));
  }, []);

  const setBirthRange = useCallback((birthFrom: string, birthTo: string) => {
    setFilters((current) => ({ ...current, birthFrom, birthTo, page: 1 }));
  }, []);

  const setSort = useCallback((sort: PatientSortOption) => {
    setFilters((current) => ({ ...current, sort, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((current) => ({ ...current, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setFilters((current) => ({ ...current, limit, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchInput('');
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.gender !== 'all' ||
    filters.createdPreset !== 'all' ||
    Boolean(filters.createdFrom) ||
    Boolean(filters.createdTo) ||
    Boolean(filters.birthFrom) ||
    Boolean(filters.birthTo) ||
    filters.sort !== 'newest' ||
    filters.page !== 1 ||
    filters.limit !== DEFAULT_FILTERS.limit;

  return {
    filters,
    searchInput,
    setSearchInput,
    setGender,
    setCreatedPreset,
    setCreatedRange,
    setBirthRange,
    setSort,
    setPage,
    setLimit,
    resetFilters,
    hasActiveFilters,
  };
}
