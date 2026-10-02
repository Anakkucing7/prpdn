import { AppShell } from "@/components/app-shell";
import { sessionUser, HttpError } from '@/server/access';
import { redirect } from 'next/navigation';
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let profile;
  try {
    const user = await sessionUser();
    profile = { name: user.name, role: user.role.name };
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) redirect('/login/?next=%2Fadmin%2Fdashboard%2F');
    throw error;
  }
  return <AppShell profile={profile}>{children}</AppShell>;
}
