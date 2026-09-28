import { AppShell } from "@/components/app-shell";
import {sessionUser,HttpError} from '@/server/access';
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let profile;try{const user=await sessionUser();profile={name:user.name,role:user.role.name};}catch(error){if(!(error instanceof HttpError&&error.status===401))throw error;}
  return <AppShell profile={profile}>{children}</AppShell>;
}
