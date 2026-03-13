"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import type { PatientInsert } from '@/types/patient';

export default function NewPatientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<PatientInsert>({
    first_name: '', last_name: '', date_of_birth: null, gender: null,
    phone: null, email: null, address: null, allergies: null,
    medical_history: null, internal_notes: null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value || null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.first_name.trim() || !form.last_name.trim()) { setError('Le nom et le prénom sont obligatoires.'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/patients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const json = await res.json(); throw new Error(json.error || 'Erreur lors de la création'); }
      router.push('/dashboard/patients');
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const inputClass = "w-full px-3 sm:px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <>
      <header className="h-14 sm:h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center px-4 sm:px-8 sticky top-0 z-10">
        <div className="flex items-center gap-3 pl-10 lg:pl-0">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Nouveau Patient</h2>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="p-4 sm:p-6 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4 sm:mb-5">
              <UserPlus className="w-5 h-5 text-blue-600" /> Identité du patient
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className={labelClass}>Nom <span className="text-rose-500">*</span></label>
                <input name="last_name" value={form.last_name} onChange={handleChange} className={inputClass} placeholder="Dupont" required />
              </div>
              <div>
                <label className={labelClass}>Prénom <span className="text-rose-500">*</span></label>
                <input name="first_name" value={form.first_name} onChange={handleChange} className={inputClass} placeholder="Jean" required />
              </div>
              <div>
                <label className={labelClass}>Date de naissance</label>
                <input name="date_of_birth" type="date" value={form.date_of_birth || ''} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Sexe</label>
                <select name="gender" value={form.gender || ''} onChange={handleChange} className={inputClass}>
                  <option value="">— Sélectionner —</option>
                  <option value="M">Homme</option>
                  <option value="F">Femme</option>
                  <option value="Other">Autre</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-4 sm:mb-5">Coordonnées</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className={labelClass}>Téléphone</label>
                <input name="phone" value={form.phone || ''} onChange={handleChange} className={inputClass} placeholder="06 12 34 56 78" />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input name="email" type="email" value={form.email || ''} onChange={handleChange} className={inputClass} placeholder="jean.dupont@email.com" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Adresse</label>
                <input name="address" value={form.address || ''} onChange={handleChange} className={inputClass} placeholder="12 Rue de la Paix, 75000 Paris" />
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-4 sm:mb-5">Informations médicales</h3>
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className={labelClass}>Allergies</label>
                <textarea name="allergies" value={form.allergies || ''} onChange={handleChange} className={inputClass + " min-h-[80px] resize-y"} placeholder="Pénicilline, Latex..." />
              </div>
              <div>
                <label className={labelClass}>Antécédents médicaux</label>
                <textarea name="medical_history" value={form.medical_history || ''} onChange={handleChange} className={inputClass + " min-h-[80px] resize-y"} placeholder="Diabète, hypertension..." />
              </div>
              <div>
                <label className={labelClass}>Notes médicales</label>
                <textarea name="internal_notes" value={form.internal_notes || ''} onChange={handleChange} className={inputClass + " min-h-[80px] resize-y"} placeholder="Remarques internes..." />
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50">
            {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}
            <div className="flex items-center gap-3 ml-auto w-full sm:w-auto">
              <button type="button" onClick={() => router.back()} className="flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-white transition-colors">Annuler</button>
              <button type="submit" disabled={saving} className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-100 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Enregistrer
              </button>
            </div>
          </div>
        </motion.form>
      </div>
    </>
  );
}
