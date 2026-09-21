"use client";

import { useState } from "react";
import { Info, Check, CircleAlert, ExternalLink, Eye, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, RegionDrawer, ConfirmationDialog } from "@/components/ui-patterns";
import { NoteDialog, FormExample } from "@/components/form-example";
import { RegionFilters, RegionExample, defaultRegionFilter } from "@/components/region-example";
import { regions } from "@/data/fixtures";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";

const statuses = [
  { label: "Aktif", tone: "success", description: "Data dapat digunakan." },
  { label: "Nonaktif", tone: "neutral", description: "Data tidak diaktifkan." },
  { label: "Perencanaan", tone: "planning", description: "Target periode mendatang." },
  { label: "Valid", tone: "success", description: "Lolos aturan pemeriksaan." },
  { label: "Perlu diperiksa", tone: "warning", description: "Ada catatan untuk ditinjau." },
  { label: "Error", tone: "error", description: "Memerlukan perbaikan." },
] as const;

function StateExamples() {
  const [recovered, setRecovered] = useState(false);
  const [reset, setReset] = useState(false);
  return <div className="state-grid">
    <Card><CardHeader><CardTitle><h2>Memuat data</h2></CardTitle><CardDescription>Contoh skeleton mengikuti susunan baris.</CardDescription></CardHeader><CardContent><div className="state-demo" role="status" aria-label="Contoh tampilan sedang memuat data"><div aria-hidden="true" className="loading-rows">{[1,2,3,4].map(row => <div key={row}><Skeleton /><Skeleton /><Skeleton /></div>)}</div><p className="muted-note">Pratinjau loading, tidak ada permintaan data aktif.</p></div></CardContent></Card>
    <Card><CardHeader><CardTitle><h2>Hasil pencarian kosong</h2></CardTitle><CardDescription>Berikan penjelasan dan langkah berikutnya.</CardDescription></CardHeader><CardContent><div role="status">{reset ? <div className="state-demo"><Alert className="success-alert"><Check /><AlertDescription>Filter contoh direset. Data dapat ditampilkan kembali.</AlertDescription></Alert><Button variant="outline" onClick={() => setReset(false)}>Tampilkan contoh kosong</Button></div> : <Empty><EmptyHeader><EmptyTitle>Belum ada hasil</EmptyTitle><EmptyDescription>Tidak ada data untuk kombinasi filter ini.</EmptyDescription></EmptyHeader><EmptyContent><Button variant="outline" onClick={() => setReset(true)}><RotateCcw data-icon="inline-start" />Reset filter contoh</Button></EmptyContent></Empty>}</div></CardContent></Card>
    <Card><CardHeader><CardTitle><h2>Gangguan pemuatan</h2></CardTitle><CardDescription>Simulasi kegagalan dan pemulihan.</CardDescription></CardHeader><CardContent><div className="state-demo" role="status"><Alert className={recovered ? "success-alert" : "error-alert"}>{recovered ? <Check /> : <CircleAlert />}<AlertDescription>{recovered ? "Pratinjau berhasil dimuat kembali." : "Data contoh gagal dimuat. Coba kembali untuk melanjutkan."}</AlertDescription></Alert><div><Button variant="outline" onClick={() => setRecovered(!recovered)}>{recovered ? "Tampilkan contoh error" : "Coba lagi"}</Button></div></div></CardContent></Card>
    <Card><CardHeader><CardTitle><h2>Nonaktif & fokus keyboard</h2></CardTitle><CardDescription>Status kontrol tetap mudah dikenali.</CardDescription></CardHeader><CardContent><div className="state-demo"><Button disabled>Simpan data · belum tersedia</Button><p className="muted-note">Gunakan Tab untuk berpindah, Enter untuk memilih, dan Escape untuk menutup dialog. Tombol nonaktif dilewati.</p><RegionDrawer region={regions[1]}><Button variant="outline">Coba fokus pada drawer</Button></RegionDrawer></div></CardContent></Card>
  </div>;
}

export function Foundation() {
  const [filter, setFilter] = useState(defaultRegionFilter);
  const [feedback, setFeedback] = useState("");
  const [demoActive, setDemoActive] = useState(true);
  const [tab, setTab] = useState("components");
  const saveNote = (note: string) => setFeedback(`Catatan sesi: ${note}`);
  const deactivate = () => { setDemoActive(false); setFeedback("Status contoh dinonaktifkan. Data sumber tidak berubah."); };
  const confirmDescription = "Tindakan ini hanya mengubah status contoh di halaman pratinjau. Tidak ada wilayah atau data workbook yang dinonaktifkan.";
  return <>
    <PageHeader title="Fondasi antarmuka" description="Pola tampilan dan interaksi untuk pengelolaan data daerah." actions={<>
      <RegionDrawer region={regions[1]}><Button variant="outline"><Eye data-icon="inline-start" />Lihat detail</Button></RegionDrawer>
      <NoteDialog onSave={saveNote}><Button>Contoh dialog</Button></NoteDialog>
    </>} />
    <Tabs value={tab} onValueChange={setTab} className="page-tabs">
      <TabsList variant="line" aria-label="Pratinjau fondasi"><TabsTrigger value="components">Komponen</TabsTrigger><TabsTrigger value="forms">Form & filter</TabsTrigger><TabsTrigger value="states">Status tampilan</TabsTrigger></TabsList>
      <Alert className="info-alert phase-notice" role="note"><Info /><AlertDescription>Pratinjau fase 1. Interaksi bersifat lokal dan tidak mengubah data sumber.</AlertDescription></Alert>
      <TabsContent value="components"><div className="foundation-grid">
        <div className="panel-stack"><Card><CardHeader><CardTitle><h2>Kontrol & tindakan</h2></CardTitle><CardDescription>Hierarki tindakan yang konsisten.</CardDescription></CardHeader><CardContent>
          <div className="button-examples">
            <div className="button-example"><span className="example-label">Utama</span><NoteDialog onSave={saveNote}><Button>Simpan perubahan</Button></NoteDialog></div>
            <div className="button-example"><span className="example-label">Sekunder</span><Button variant="outline" onClick={() => { setFeedback("Pratinjau dikembalikan ke kondisi awal."); setFilter(defaultRegionFilter); setDemoActive(true); }}>Batal</Button></div>
            <div className="button-example"><span className="example-label">Teks</span><RegionDrawer region={regions[1]}><Button variant="ghost">Lihat rincian</Button></RegionDrawer></div>
            <div className="button-example"><span className="example-label">Destruktif</span><ConfirmationDialog title="Nonaktifkan status contoh?" description={confirmDescription} confirmLabel="Nonaktifkan contoh" onConfirm={deactivate}><Button variant="danger" disabled={!demoActive}>Nonaktifkan</Button></ConfirmationDialog></div>
            <div className="button-example"><span className="example-label">Nonaktif</span><Button disabled>Tidak tersedia</Button></div>
          </div>
          <Separator className="section-divider" /><h3 className="subheading">Filter data</h3><RegionFilters value={filter} onChange={setFilter} />
        </CardContent></Card><RegionExample filter={filter} onReset={() => setFilter(defaultRegionFilter)} /></div>
        <div className="panel-stack"><Card><CardHeader><CardTitle><h2>Status & kategori</h2></CardTitle><CardDescription>Penanda ringkas dengan makna yang jelas.</CardDescription></CardHeader><CardContent>
          <div className="status-list">{statuses.map(status => <div className="status-row" key={status.label}><StatusBadge tone={status.tone}>{status.label}</StatusBadge><span>{status.description}</span></div>)}</div>
          <Separator className="section-divider" /><h3 className="subheading">Informasi ringkas</h3><dl className="facts"><div><dt>Wilayah</dt><dd>DKI Jakarta</dd></div><div><dt>Kode wilayah</dt><dd>31</dd></div><div><dt>Level</dt><dd>Provinsi</dd></div></dl>
          <RegionDrawer region={regions[1]}><Button variant="link"><ExternalLink data-icon="inline-start" />Buka detail wilayah</Button></RegionDrawer>
        </CardContent></Card>
        <Card><CardHeader><CardTitle><h2>Umpan balik</h2></CardTitle></CardHeader><CardContent><div className="feedback-stack">
          <Alert className="info-alert" role="note"><Info /><AlertDescription>Perubahan hanya berlaku selama sesi ini.</AlertDescription></Alert>
          <div className="flex items-center gap-3"><span className="example-label">Status contoh</span><StatusBadge tone={demoActive ? "success" : "neutral"}>{demoActive ? "Aktif" : "Nonaktif"}</StatusBadge></div>
          <ConfirmationDialog title="Nonaktifkan status contoh?" description={confirmDescription} confirmLabel="Nonaktifkan contoh" onConfirm={deactivate}><Button variant="outline" disabled={!demoActive}>Contoh konfirmasi</Button></ConfirmationDialog>
          {!demoActive ? <Button variant="ghost" onClick={() => { setDemoActive(true); setFeedback("Status contoh diaktifkan kembali."); }}>Aktifkan kembali</Button> : null}
        </div></CardContent></Card></div>
      </div></TabsContent>
      <TabsContent value="forms"><div className="panel-stack"><FormExample /><Card><CardHeader><CardTitle><h2>Filter wilayah</h2></CardTitle><CardDescription>Pencarian dan pilihan level menggunakan sampel yang sama.</CardDescription></CardHeader><CardContent><RegionFilters value={filter} onChange={setFilter} /></CardContent></Card><RegionExample filter={filter} onReset={() => setFilter(defaultRegionFilter)} /></div></TabsContent>
      <TabsContent value="states"><StateExamples /></TabsContent>
    </Tabs>
    <p className="session-feedback" role="status" aria-live="polite">{feedback}</p>
  </>;
}
