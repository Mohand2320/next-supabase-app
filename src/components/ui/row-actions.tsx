'use client';

import { MoreVertical, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface RowAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  loading?: boolean;
}

interface RowActionsProps {
  actions: RowAction[];
}

export function RowActions({ actions }: RowActionsProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const showKebabOnMobile = actions.length > 2;

  return (
    <>
      {/* Desktop: always inline */}
      <div className="hidden sm:inline-flex items-center gap-1">
        {actions.map((action) => (
          <ActionButton key={action.label} {...action} />
        ))}
      </div>

      {/* Mobile */}
      <div className="sm:hidden">
        {showKebabOnMobile ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="inline-flex items-center justify-center rounded-lg p-3 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:focus-visible:ring-blue-400"
              aria-label="Actions"
              title="Actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {open && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/50">
                {actions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => {
                        action.onClick();
                        setOpen(false);
                      }}
                      disabled={action.disabled}
                      className={`flex w-full min-h-[44px] items-center gap-3 px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        action.variant === 'destructive'
                          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="inline-flex items-center gap-1">
            {actions.map((action) => (
              <ActionButton key={action.label} {...action} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ActionButton(action: RowAction) {
  const Icon = action.icon;
  const isDestructive = action.variant === 'destructive';
  
  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled || action.loading}
      className={`inline-flex items-center justify-center rounded-lg min-h-[44px] min-w-[44px] p-2.5 sm:p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${
        isDestructive
          ? 'text-red-600 hover:bg-red-50 hover:text-red-700 focus-visible:ring-red-500 dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:text-red-300'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
      }`}
      aria-label={action.label}
      title={action.label}
    >
      {action.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
    </button>
  );
}
