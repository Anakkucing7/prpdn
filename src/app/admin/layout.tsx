import { AppShell } from "@/components/app-shell";
import { sessionUser, HttpError } from '@/server/access';
import { db } from '@/server/db';
import { redirect } from 'next/navigation';
import type { Permissions } from '@/lib/permissions';
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let profile;let branding:{name:string;description:string};
  try {
    const user = await sessionUser();
    profile = { name: user.name, role: user.role.name, roleId: user.roleId, permissions: user.role.permissions as Permissions };
    const settings=await db().systemSetting.findUniqueOrThrow({where:{id:'general'},select:{name:true,description:true}});
    branding=settings;
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) redirect('/login/?next=%2Fadmin%2Fdashboard%2F');
    throw error;
  }
  return <AppShell profile={profile} branding={branding}>{children}</AppShell>;
}
