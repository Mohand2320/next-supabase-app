'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getUsersList, toggleUserStatus, deleteUser } from '@/services/admin.service';
import type { AdminUserListItem } from '@/services/admin.service';
import { Search, Plus, Shield, User, Loader2, Power, Pencil, Trash2 } from 'lucide-react';
import { RowActions } from '@/components/ui/row-actions';
import CreateUserModal from '@/components/admin/CreateUserModal';
import EditUserModal from '@/components/admin/EditUserModal';
import { createClientBrowser } from '@/lib/supabase/client';

export function UsersManagement() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchFilter, setSearchFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<AdminUserListItem | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await getUsersList();
    if (error) {
      setError(error);
    } else if (data) {
      setUsers(data);
    }
    
    const supabase = createClientBrowser();
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    if (userId === currentUserId) return; // Un admin ne peut se desactiver
    if (!confirm(`Voulez-vous vraiment ${currentStatus ? 'désactiver' : 'activer'} cet utilisateur ?`)) return;

    const { success, error: toggleError } = await toggleUserStatus(userId, currentStatus);
    if (success) {
      // Mettre à jour l'état local
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
    } else {
      alert(toggleError);
    }
  };

  const handleDelete = async (userId: string) => {
    if (userId === currentUserId) return;
    if (!confirm(`ATTENTION : Voulez-vous vraiment supprimer définitivement cet utilisateur ?\nCette action est irréversible, bien que son historique médical (rendez-vous, actes) sera conservé.`)) return;

    const { success, error: delError } = await deleteUser(userId);
    if (success) {
      setUsers(users.filter(u => u.id !== userId));
    } else {
      alert(delError);
    }
  };

  const openEditModal = (user: AdminUserListItem) => {
    setUserToEdit(user);
    setIsEditModalOpen(true);
  };

  const filteredUsers = useMemo(() => {
    if (!searchFilter.trim()) return users;
    const q = searchFilter.toLowerCase();
    return users.filter(u => 
      u.email.toLowerCase().includes(q) || 
      (u.nom && u.nom.toLowerCase().includes(q)) ||
      (u.prenom && u.prenom.toLowerCase().includes(q))
    );
  }, [users, searchFilter]);

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header & Filtres */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            </div>
            <input
              type="text"
              className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:text-slate-100"
              placeholder="Rechercher par nom ou email..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Ajouter un utilisateur
          </button>
        </div>

        {/* Contenu */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="flex h-64 items-center justify-center p-6 text-center">
              <p className="text-rose-600 font-medium">{error}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col h-64 items-center justify-center text-slate-500 dark:text-slate-400">
              <User className="h-12 w-12 mb-3 text-slate-300 dark:text-slate-600" />
              <p className="font-medium">Aucun utilisateur trouvé.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Utilisateur</th>
                    <th className="px-6 py-4 font-semibold">Rôle</th>
                    <th className="px-6 py-4 font-semibold">Statut</th>
                    <th className="px-6 py-4 font-semibold">Date d'inscription</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((u) => {
                    const fullName = u.prenom && u.nom ? `${u.prenom} ${u.nom}` : u.nom || 'Utilisateur inconnu';
                    const initiales = fullName.substring(0, 2).toUpperCase();
                    const isMe = u.id === currentUserId;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold text-xs">
                              {initiales}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                {fullName}
                                {isMe && <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-[10px] uppercase font-bold tracking-wider">Moi</span>}
                              </p>
                              <p className="text-slate-500 dark:text-slate-400 text-xs">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            u.role === 'admin' 
                              ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' 
                              : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          }`}>
                            {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                            {u.role === 'admin' ? 'Admin' : u.role === 'dentiste' ? 'Dentiste' : 'Assistant'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Inactif
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {new Date(u.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <RowActions
                            actions={[
                              { icon: Pencil, label: "Modifier l'utilisateur", onClick: () => openEditModal(u), disabled: isMe },
                              { icon: Power, label: u.is_active ? 'Désactiver' : 'Activer', onClick: () => handleToggleStatus(u.id, u.is_active), disabled: isMe },
                              { icon: Trash2, label: 'Supprimer définitivement', onClick: () => handleDelete(u.id), disabled: isMe, variant: 'destructive' },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchUsers();
        }}
      />

      {userToEdit && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setUserToEdit(null);
          }}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setUserToEdit(null);
            fetchUsers();
          }}
          user={userToEdit}
        />
      )}
    </>
  );
}
