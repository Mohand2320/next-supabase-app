import { ProfileSettings } from '@/components/profile/ProfileSettings';

export const metadata = {
  title: 'Mon Profil | DentiPro',
  description: 'Consultation de votre profil utilisateur',
};

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Informations du compte</h1>
      </div>

      <ProfileSettings />
    </div>
  );
}
