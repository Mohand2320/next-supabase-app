'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, User, Shield, Loader2, Briefcase, Key, Lock } from 'lucide-react';
import { inviteUser } from '@/services/admin.service';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'dentiste' | 'assistant'>('assistant');
  const [specialiteOrLogin, setSpecialiteOrLogin] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('Cabinet2026!');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nom.trim() || !prenom.trim() || !email.trim() || !password.trim()) {
      setError("Le nom, le prénom, l'email et le mot de passe sont obligatoires.");
      return;
    }

    setLoading(true);
    const { success, error: submitError } = await inviteUser(email, nom, prenom, role, specialiteOrLogin, isAdmin, password);
    setLoading(false);

    if (success) {
      setNom('');
      setPrenom('');
      setEmail('');
      setRole('assistant');
      setSpecialiteOrLogin('');
      setIsAdmin(false);
      setPassword('Cabinet2026!');
      onSuccess();
    } else {
      setError(submitError || "Une erreur est survenue.");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white z-10">
            <h2 className="text-lg font-bold text-slate-900">Inviter un utilisateur</h2>
            <button
              onClick={onClose}
              type="button"
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-800 border border-rose-100">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">Nom</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="Dupont"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">Prénom</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="Jean"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Adresse email</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="jean.dupont@cabinet.fr"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Mot de passe temporaire</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="Mot de passe par défaut"
                />
              </div>
              <p className="text-[11px] text-slate-500">L'utilisateur pourra s'authentifier immédiatement avec ce mot de passe sans validation d'e-mail.</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Rôle métier</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Briefcase className="h-5 w-5 text-slate-400" />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'dentiste' | 'assistant')}
                  className="block w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none bg-white"
                >
                  <option value="assistant">Assistant(e)</option>
                  <option value="dentiste">Chirurgien-dentiste</option>
                </select>
              </div>
            </div>

            {role === 'dentiste' ? (
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">Spécialité (Optionnel)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={specialiteOrLogin}
                    onChange={(e) => setSpecialiteOrLogin(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="Orthodontie, Implantologie..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">Identifiant (Optionnel)</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Key className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={specialiteOrLogin}
                    onChange={(e) => setSpecialiteOrLogin(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="jdupont"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
              <input
                type="checkbox"
                id="isAdmin"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
              <div className="flex flex-col">
                <label htmlFor="isAdmin" className="text-sm font-semibold text-slate-900 select-none cursor-pointer">
                  Accès administrateur
                </label>
                <span className="text-xs text-slate-500">
                  Permet de gérer les utilisateurs et les paramètres du cabinet.
                </span>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex justify-center items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-md shadow-blue-500/20"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Inviter'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
