import { notFound } from "next/navigation";
import { navigation } from "@/lib/navigation";
import AnalyticalPage from "@/components/data/analytical-page";
import UsersPage from "@/components/data/users-page";
import RolesPage from "@/components/data/roles-page";
import ActivityPage from "@/components/data/activity-page";
import SettingsPage from "@/components/data/settings-page";
import analytical from "@/data/analytical.json";
import {readAnalytical} from '@/server/services/analytical-read';
import { authorize } from '@/server/access';
export const dynamic='force-dynamic';
import { type AnalyticalModule } from "@/lib/analytical";
import "@/components/data/data-pages.css";
import "@/components/data/analytical-page.css";
import "@/components/data/master-pages.css";
import "@/components/data/system-pages.css";

export function generateStaticParams() {
  return navigation.flatMap(group => group.items.filter(item => !["dashboard", "regions", "idsd", "indicators", "years", "import", "validation"].includes(item.slug)).map(item => ({ module: item.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  return { title: navigation.flatMap(group => group.items).find(item => item.slug === module)?.label ?? "Halaman tidak ditemukan" };
}

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const group = navigation.find(group => group.items.some(item => item.slug === module));
  const item = group?.items.find(item => item.slug === module);
  if (!item) notFound();
  if (module === 'users') { const actor=await authorize('users','view'); return <UsersPage roleId={actor.roleId} currentUserId={actor.id}/>; }
  if (module === 'roles') return <RolesPage />;
  if (module === 'activity') { await authorize('activity','view'); return <ActivityPage />; }
  if (module === 'settings') return <SettingsPage />;
  if (Object.hasOwn(analytical.modules, module)) {
    const key = module as AnalyticalModule;
    return <AnalyticalPage key={key} module={key} data={await readAnalytical(key)} />;
  }
  notFound();
}
