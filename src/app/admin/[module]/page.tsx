import Link from "next/link";
import { notFound } from "next/navigation";
import { navigation } from "@/lib/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";

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
  return <>
    <PageHeader title={item.label} description="Ruang kerja pengelolaan data pembangunan daerah." parent={group?.label} />
    <Empty className="pending-page">
      <EmptyHeader>
        <item.icon aria-hidden="true" className="pending-icon" />
        <EmptyTitle>Disiapkan untuk fase {item.phase}</EmptyTitle>
        <EmptyDescription>Navigasi halaman sudah tersedia. Konten {item.label} akan dibuat pada tahap berikutnya setelah persetujuan.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent><Button asChild variant="outline"><Link href="/admin/foundation">Lihat fondasi antarmuka</Link></Button></EmptyContent>
    </Empty>
  </>;
}
