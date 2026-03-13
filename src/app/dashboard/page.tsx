"use client";

import React, { useState } from 'react';
import {
  Calendar, Wallet, Search, UserPlus, PlusCircle,
  TrendingUp, Edit2, MoreVertical
} from 'lucide-react';
import { motion } from 'motion/react';

// --- Types ---

interface Appointment {
  id: string;
  time: string;
  patientName: string;
  patientAvatar: string;
  treatment: string;
  status: 'Confirmed' | 'Pending' | 'Arrived';
}

interface Stat {
  label: string;
  value: string;
  trend: number;
  icon: React.ReactNode;
}

// --- Mock Data ---

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: '1', time: '09:00', patientName: 'Jean Dupont', patientAvatar: 'https://picsum.photos/seed/jean/100/100', treatment: 'Détartrage complet', status: 'Confirmed' },
  { id: '2', time: '10:30', patientName: 'Marie Martin', patientAvatar: 'https://picsum.photos/seed/marie/100/100', treatment: 'Extraction dent de sagesse', status: 'Pending' },
  { id: '3', time: '11:15', patientName: 'Luc Lefebvre', patientAvatar: 'https://picsum.photos/seed/luc/100/100', treatment: 'Consultation annuelle', status: 'Arrived' },
  { id: '4', time: '14:00', patientName: 'Sophie Petit', patientAvatar: 'https://picsum.photos/seed/sophie/100/100', treatment: 'Pose de couronne céramique', status: 'Confirmed' },
];

const MOCK_STATS: Stat[] = [
  { label: 'RDV du jour', value: '12', trend: 2, icon: <Calendar className="w-5 h-5" /> },
  { label: 'Nouveaux patients', value: '3', trend: -1, icon: <UserPlus className="w-5 h-5" /> },
  { label: 'CA du jour', value: '1 450 €', trend: 15, icon: <Wallet className="w-5 h-5" /> },
  { label: 'En attente', value: '890 €', trend: 5, icon: <TrendingUp className="w-5 h-5" /> },
];

// --- Components ---

const StatCard = ({ stat }: { stat: Stat }) => (
  <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex justify-between items-start mb-3 sm:mb-4">
      <span className="text-slate-500 text-xs sm:text-sm font-medium">{stat.label}</span>
      <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg text-blue-600">{stat.icon}</div>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-xl sm:text-2xl font-bold text-slate-900">{stat.value}</span>
      <span className={`text-xs font-bold ${stat.trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
        {stat.trend > 0 ? '+' : ''}{stat.trend}%
      </span>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: Appointment['status'] }) => {
  const styles = { Confirmed: 'bg-emerald-100 text-emerald-800', Pending: 'bg-amber-100 text-amber-800', Arrived: 'bg-blue-100 text-blue-800' };
  const labels = { Confirmed: 'Confirmé', Pending: 'En attente', Arrived: 'Arrivé' };
  return (
    <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      {/* Header */}
      <header className="h-14 sm:h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 pl-10 lg:pl-0">Dashboard</h2>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un patient..."
              className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm w-48 lg:w-64 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors">
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau Patient</span>
          </button>
          <button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau RDV</span>
          </button>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6"
        >
          {MOCK_STATS.map((stat, idx) => (
            <StatCard key={idx} stat={stat} />
          ))}
        </motion.div>

        {/* Appointments Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Prochains Rendez-vous</h3>
            <button className="text-blue-600 text-xs sm:text-sm font-semibold hover:underline">Voir tout l&apos;agenda</button>
          </div>

          {/* Mobile: cards layout */}
          <div className="block sm:hidden divide-y divide-slate-100">
            {MOCK_APPOINTMENTS.map((apt) => (
              <div key={apt.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">{apt.time}</span>
                  <StatusBadge status={apt.status} />
                </div>
                <div className="flex items-center gap-3">
                  <img src={apt.patientAvatar} alt={apt.patientName} className="w-8 h-8 rounded-full bg-slate-100 border border-white shadow-sm" referrerPolicy="no-referrer" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{apt.patientName}</p>
                    <p className="text-xs text-slate-500">{apt.treatment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Heure</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Traitement</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_APPOINTMENTS.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{apt.time}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={apt.patientAvatar} alt={apt.patientName} className="w-8 h-8 rounded-full bg-slate-100 border border-white shadow-sm" referrerPolicy="no-referrer" />
                        <span className="text-sm font-medium text-slate-700">{apt.patientName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{apt.treatment}</td>
                    <td className="px-6 py-4"><StatusBadge status={apt.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"><MoreVertical className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </>
  );
}
