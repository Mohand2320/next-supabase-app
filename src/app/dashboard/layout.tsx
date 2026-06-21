"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Calendar, CalendarCheck, Wallet, Settings, Stethoscope,
  Menu, X, User
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { getCurrentUserProfile } from '@/services/user.service';
import { createClientBrowser } from '@/lib/supabase/client';

function UserProfileDisplay() {
  const [name, setName] = useState('Chargement...');
  const [role, setRole] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await getCurrentUserProfile();
      if (data) {
        setName(`${data.data.prenom} ${data.data.nom}`);
        setRole(data.role === 'dentiste' ? 'Chirurgien-dentiste' : 'Assistant(e)');
      } else {
        const supabase = createClientBrowser();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setName(user.email || 'Mon Compte');
          setRole('Profil à configurer');
        } else {
          setName('Non connecté');
        }
      }
    }
    load();
  }, []);

  return (
    <>
      <p className="text-sm font-semibold truncate text-slate-900">{name}</p>
      <p className="text-xs text-slate-500 truncate">{role}</p>
    </>
  );
}

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/dashboard/patients', icon: Users, label: 'Patients' },
  { href: '/dashboard/agenda', icon: Calendar, label: 'Agenda' },
  { href: '/dashboard/rendez-vous', icon: CalendarCheck, label: 'Rendez-vous' },
  { href: '/dashboard/finances', icon: Wallet, label: 'Finances' },
  { href: '/dashboard/profile', icon: User, label: 'Mon Profil' },
  { href: '/dashboard/settings', icon: Settings, label: 'Paramètres' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
          <Stethoscope className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-slate-900 font-bold text-base leading-tight">Mon Cabinet</h1>
          <p className="text-slate-500 text-xs">Gestion Dentaire</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </a>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-100">
        <a href="/dashboard/profile" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white bg-blue-100 shadow-sm">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <UserProfileDisplay />
          </div>
        </a>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-slate-200 bg-white flex-col shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-3.5 left-4 z-50 p-2 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-600 hover:bg-slate-50 transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white z-50 flex flex-col shadow-2xl"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
