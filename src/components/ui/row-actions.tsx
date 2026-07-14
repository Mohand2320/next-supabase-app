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
              className="inline-flex items-center justify-center rounded-lg p-3 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Actions"
              title="Actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {open && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
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
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-slate-700 hover:bg-slate-100'
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

function ActionButton({ icon: Icon, label, onClick, variant, disabled, loading }: RowAction) {
  const isDestructive = variant === 'destructive';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      title={label}
      aria-label={label}
      className={`inline-flex items-center justify-center rounded-lg p-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${
        isDestructive
          ? 'text-red-500 hover:bg-red-50 hover:text-red-600'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
    </button>
  );
}
