'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

interface UsePaginatedListOptions {
  /** Defaults to 20 */
  defaultLimit?: number;
  /** Re-fetch when these change (e.g. search, filters) */
  deps?: unknown[];
  /** Skip initial fetch */
  enabled?: boolean;
}

export function usePaginatedList<T>(
  endpoint: string,
  params?: Record<string, string>,
  options: UsePaginatedListOptions = {}
) {
  const { defaultLimit = 20, deps = [], enabled = true } = options;
  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: defaultLimit, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const buildUrl = useCallback(
    (page: number) => {
      const url = new URL(endpoint, window.location.origin);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value) url.searchParams.set(key, value);
        });
      }
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', String(defaultLimit));
      return url.toString();
    },
    [endpoint, params, defaultLimit]
  );

  const fetchPage = useCallback(
    async (page: number) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(buildUrl(page), { signal: controller.signal });
        const json: PaginatedResponse<T> = await res.json();
        if (!res.ok) throw new Error((json as any).error || 'Erreur de chargement');
        setData(json.data);
        setMeta(json.meta);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Erreur de chargement');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [buildUrl]
  );

  useEffect(() => {
    if (!enabled) return;
    fetchPage(1);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  const setPage = useCallback(
    (page: number) => {
      if (page < 1 || (meta.totalPages > 0 && page > meta.totalPages)) return;
      fetchPage(page);
    },
    [fetchPage, meta.totalPages]
  );

  const nextPage = useCallback(() => {
    if (meta.page < meta.totalPages) setPage(meta.page + 1);
  }, [meta.page, meta.totalPages, setPage]);

  const prevPage = useCallback(() => {
    if (meta.page > 1) setPage(meta.page - 1);
  }, [meta.page, setPage]);

  const reload = useCallback(() => {
    fetchPage(meta.page);
  }, [fetchPage, meta.page]);

  return {
    data,
    meta,
    isLoading,
    error,
    setPage,
    nextPage,
    prevPage,
    reload,
    currentPage: meta.page,
    totalPages: meta.totalPages,
    totalCount: meta.total,
  };
}
