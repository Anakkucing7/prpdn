"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowDownAZ, MapPin, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SelectField, StatusBadge } from "@/components/ui-patterns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose, SheetTrigger } from "@/components/ui/sheet";
import { regions, provinces, regionByCode, provinceOptions, spatialStatus, spatialLabels, matchesQuery, levelName, type RegionRecord } from "@/lib/regions";
import { DataFilters, Pagination, NoResults } from "./data-controls";

const RegionMap = dynamic(() => import("./region-map"), { ssr: false, loading: () => <div className="region-map region-map-state" role="status">Memuat peta…</div> });
const PAGE_SIZE = 10;

function SpatialBadge({ region }: { region: RegionRecord }) {
  const status = spatialStatus(region);
  return <StatusBadge tone={status === "boundary" ? "success" : status === "point" ? "warning" : "neutral"}>{spatialLabels[status]}</StatusBadge>;
}

function RegionDetail({ region, children }: { region: RegionRecord; children: React.ReactNode }) {
  return <Sheet><SheetTrigger asChild>{children}</SheetTrigger><SheetContent className="detail-sheet"><SheetHeader><SheetTitle>{region.name}</SheetTitle><SheetDescription>{levelName(region.level)} · Kode {region.code}</SheetDescription></SheetHeader><div className="detail-body"><SpatialBadge region={region} /><dl className="facts">
    <div><dt>Provinsi</dt><dd>{regionByCode.get(region.provinceCode)?.name ?? region.province}</dd></div><div><dt>Pulau / region</dt><dd>{region.island}</dd></div><div><dt>Status master</dt><dd>{region.active ? "Aktif" : "Nonaktif"}</dd></div><div><dt>Longitude</dt><dd>{region.longitude ?? "Tidak tersedia"}</dd></div><div><dt>Latitude</dt><dd>{region.latitude ?? "Tidak tersedia"}</dd></div><div><dt>Luas / penduduk</dt><dd>Tidak tersedia pada sheet sumber</dd></div></dl>
    <section><h3 className="subheading">Catatan spasial</h3><p className="muted-note">{region.boundary ? "Batas dapat dibaca untuk pratinjau. Topologi dan pemekaran belum diverifikasi." : "Path batas tidak dapat digunakan. Pratinjau memakai titik lokasi jika tersedia."}{region.omittedRings > 0 ? ` ${region.omittedRings} ring kurang dari empat posisi tidak ditampilkan.` : ""}</p></section>
    <section><h3 className="subheading">Sumber master wilayah</h3><p className="source-line">dim_wilayah · baris {region.sourceRow}<br />Dataset Dashboard 040526.xlsx</p></section>
    <section><h3 className="subheading">Referensi dim_wilayah_ol</h3>{region.legacy.length ? region.legacy.map(item => <p key={item.sourceRow} className="source-line">{item.name} · kode {item.code}<br />Baris {item.sourceRow} · {item.match === "code" ? "Kode dan nama sesuai" : "Dicocokkan berdasarkan nama; kode berbeda"}</p>) : <p className="muted-note">Tidak ada pasangan nama dan kode yang dapat dipastikan pada sheet ini.</p>}</section>
  </div><SheetFooter><SheetClose asChild><Button variant="outline">Tutup detail</Button></SheetClose></SheetFooter></SheetContent></Sheet>;
}

export default function RegionsPage() {
  const [level, setLevel] = useState("PROV");
  const [province, setProvince] = useState("all");
  const [spatial, setSpatial] = useState("all");
  const [query, setQuery] = useState("");
  const [descending, setDescending] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const filtered = regions.filter(r => (level === "PROV" ? r.level === "PROV" : r.level !== "PROV") && (province === "all" || r.provinceCode === province) && (spatial === "all" || spatialStatus(r) === spatial) && matchesQuery(query, r.name, r.code, r.province)).sort((a, b) => (descending ? -1 : 1) * a.code.localeCompare(b.code));
  const selected = filtered.find(r => r.code === selectedCode) ?? null;
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  function reset() { setProvince("all"); setSpatial("all"); setQuery(""); setPage(1); setSelectedCode(null); }
  function filter(action: () => void) { action(); setPage(1); setSelectedCode(null); }
  function selectFromMap(code: string) { const index = filtered.findIndex(r => r.code === code); if (index >= 0) { setSelectedCode(code); setPage(Math.floor(index / PAGE_SIZE) + 1); } }

  return <div className="data-page regions-page"><PageHeader title="Data Wilayah" parent="Kelola Data" description="Telusuri master wilayah, hubungan administratif, dan ketersediaan data spasial." />
    <div className="data-overview"><div><strong>{provinces.length}</strong><span>Provinsi</span></div><div><strong>{regions.length - provinces.length}</strong><span>Kabupaten / kota</span></div><div><strong>{regions.filter(r => r.boundary).length}<small> / {regions.length}</small></strong><span>Batas terbaca untuk pratinjau</span></div></div>
    <Tabs value={level} onValueChange={value => { setLevel(value); reset(); }} className="page-tabs"><TabsList variant="line" aria-label="Level wilayah"><TabsTrigger value="PROV">Provinsi</TabsTrigger><TabsTrigger value="KABKOTA">Kabupaten / kota</TabsTrigger></TabsList><TabsContent value={level}>
    <DataFilters query={query} onQuery={value => filter(() => setQuery(value))} onReset={reset} summary={`${level === "PROV" ? "Provinsi" : "Kabupaten / kota"} · ${province === "all" ? "Seluruh Indonesia" : regionByCode.get(province)?.name} · ${spatial === "all" ? "Semua status spasial" : spatialLabels[spatial]}`}>
      <SelectField label="Provinsi" value={province} onValueChange={value => filter(() => setProvince(value))} options={provinceOptions} />
      <SelectField label="Status spasial" value={spatial} onValueChange={value => filter(() => setSpatial(value))} options={[{ value: "all", label: "Semua status" }, ...Object.entries(spatialLabels).map(([value, label]) => ({ value, label }))]} />
    </DataFilters>
    <div className="regions-workspace"><section className="data-panel"><div className="data-panel-heading"><div><h2>Daftar wilayah</h2><p>Pilih nama wilayah untuk menyorot pratinjau.</p></div><span className="data-count">{filtered.length} wilayah</span></div>
      {filtered.length ? <div className="table-scroll" role="region" tabIndex={0} aria-label="Tabel wilayah, dapat digulir horizontal"><table className="data-table region-table"><caption className="sr-only">Master wilayah dari dim_wilayah</caption><thead><tr><th scope="col" aria-sort={descending ? "descending" : "ascending"}><button className="table-sort" onClick={() => { setDescending(!descending); setPage(1); }}>Kode <ArrowDownAZ aria-hidden="true" /></button></th><th scope="col">Nama wilayah</th><th scope="col">Status spasial</th><th scope="col">Detail</th></tr></thead><tbody>{visible.map(r => <tr key={r.code} data-selected={selected?.code === r.code}><td className="numeric">{r.code}</td><td><button className="region-name" aria-pressed={selected?.code === r.code} onClick={() => setSelectedCode(r.code)}>{r.name}</button><span className="table-secondary">{r.level === "PROV" ? r.island : `${levelName(r.level)} · ${regionByCode.get(r.provinceCode)?.name ?? r.province}`}</span></td><td><SpatialBadge region={r} /></td><td><RegionDetail region={r}><Button variant="link" aria-label={`Detail ${r.name}`}>Detail</Button></RegionDetail></td></tr>)}</tbody></table></div> : <NoResults onReset={reset} />}
      <Pagination page={currentPage} total={filtered.length} size={PAGE_SIZE} onPage={setPage} />
    </section><section className="data-panel region-preview" aria-label="Pratinjau wilayah"><div className="data-panel-heading"><div><h2>Pratinjau spasial</h2><p>{selected ? selected.name : `${filtered.length} wilayah sesuai filter`}</p></div><MapPin aria-hidden="true" /></div>
      <RegionMap regions={filtered} selected={selected?.code ?? null} onSelect={selectFromMap} />
      <div className="region-preview-body">{selected ? <><div className="selection-heading"><h3>{selected.name}</h3><Button variant="ghost" size="icon" aria-label="Hapus pilihan wilayah" onClick={() => setSelectedCode(null)}><X /></Button></div><SpatialBadge region={selected} /><dl className="facts"><div><dt>Kode / level</dt><dd>{selected.code} · {levelName(selected.level)}</dd></div><div><dt>Provinsi</dt><dd>{regionByCode.get(selected.provinceCode)?.name ?? selected.province}</dd></div></dl><RegionDetail region={selected}><Button variant="outline">Lihat detail wilayah</Button></RegionDetail></> : <><h3>{filtered.length ? "Pilih wilayah untuk melihat batas" : "Tidak ada wilayah pada filter ini"}</h3><p>Titik mewakili lokasi dari workbook. Pilih titik pada peta atau nama di tabel.</p></>}
      <p className="spatial-disclaimer">Batas terbaca menunjukkan ketersediaan pratinjau, bukan hasil validasi geometri. Wilayah dengan path tidak terbaca memakai titik lokasi.</p></div>
    </section></div><p className="data-source">Sumber: dim_wilayah dan dim_wilayah_ol · Dataset Dashboard 040526.xlsx. Hubungan provinsi mengikuti kode master saat ini.</p>
    </TabsContent></Tabs>
  </div>;
}
