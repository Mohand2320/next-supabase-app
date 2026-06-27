import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/services/user.service';

export default async function UtilisateursLayout({ children }: { children: React.ReactNode }) {
  const { data } = await getCurrentUserProfile();

  if (!data || data.role !== 'admin') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
