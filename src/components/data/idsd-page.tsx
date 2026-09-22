"use client";

import { useState } from "react";
import { ArrowDownWideNarrow, Info } from "lucide-react";
import fixture from "@/data/idsd.json";
import { PageHeader } from "@/components/page-header";
import { SelectField, StatusBadge } from "@/components/ui-patterns";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose, SheetTrigger } from "@/components/ui/sheet";
import { regions, regionByCode, provinceOptions, matchesQuery, scoreFormat } from "@/lib/regions";
import { DataFilters, Pagination, NoResults } from "./data-controls";

type Observation = typeof fixture.records[number];
type Pillar = { id: number; value: number | null; rows: number[]; conflict: boolean; mapped: boolean };
const pillarSets: Record<string, Pillar[]> = fixture.pillars;
const PAGE_SIZE = 15;

function RecordDetail({ record }: { record: Observation }) {
  const region = record.code ? regionByCode.get(record.code) : null;
  const pillars = record.code ? pillarSets[`${record.code}:${record.year}`] ?? [] : [];
  const sheet = record.level === "PROV" ? "fact_skor_pilar" : "fact_skor_pilar_kabkota";
  return <Sheet><SheetTrigger asChild><Button variant="link" aria-label={`Detail IDSD ${record.name}`}>Detail</Button></SheetTrigger><SheetContent className="detail-sheet idsd-detail"><SheetHeader><SheetTitle>{record.name}</SheetTitle><SheetDescription>IDSD {record.year} · {record.level === "PROV" ? "Provinsi" : "Kabupaten / kota"}</SheetDescription></SheetHeader><div className="detail-body">
    <div className="idsd-score"><span>Skor IDSD</span><strong>{scoreFormat(record.value)}<small> / 5</small></strong><p>Kategori tidak tersedia pada sumber.</p></div>
    {record.match !== "code" && <div className="data-notice"><Info aria-hidden="true" /><p>{record.match === "name" ? `Nama dicocokkan dengan master saat ini. Kode sumber ${record.sourceCode} berbeda dari kode master ${record.code}; pasangan perlu ditinjau.` : "Kode dan nama belum dapat dipasangkan dengan master saat ini. Skor ditampilkan sesuai baris sumber."}</p></div>}
    {record.value === 0 && <p className="muted-note">Nilai 0 tercatat pada sumber. Maknanya perlu dikonfirmasi; tidak diubah menjadi data kosong.</p>}
    <dl className="facts"><div><dt>Kode sumber</dt><dd>{record.sourceCode}</dd></div><div><dt>Kode master</dt><dd>{record.code ?? "Belum dipadankan"}</dd></div><div><dt>Provinsi saat ini</dt><dd>{region ? regionByCode.get(region.provinceCode)?.name ?? region.province : "Belum dipadankan"}</dd></div><div><dt>Level sumber</dt><dd>{record.sourceLevel ?? "Tidak terisi; ditampilkan dalam kabupaten/kota berdasarkan nama"}</dd></div><div><dt>Sumber skor</dt><dd>fact_total_idsd · baris {record.id}</dd></div></dl>
    <section><h3 className="subheading">Profil 12 pilar</h3><p className="muted-note">{pillars.filter(p => p.value !== null).length} dari 12 pilar memiliki nilai · skala 0–5.</p><div className="idsd-pillars">{fixture.definitions.map(definition => { const p = pillars.find(p => p.id === definition.id); return <div key={definition.id} className="idsd-pillar"><span title={definition.group}>{definition.id}. {definition.name}</span><strong>{scoreFormat(p?.value ?? null)}</strong><div className="idsd-pillar-track" aria-hidden="true"><i style={{ width: `${Math.max(0, Math.min(5, p?.value ?? 0)) / 5 * 100}%` }} /></div></div>; })}</div>
    <details className="pillar-provenance"><summary>Sumber dan catatan pilar</summary><p>{sheet}</p>{pillars.length ? pillars.map(p => <p key={p.id}>Pilar {p.id}: baris {p.rows.join(", ")}{p.rows.length > 1 ? " · duplikat identik digabung" : ""}{p.mapped ? " · pasangan berdasarkan nama" : ""}{p.conflict ? " · nilai konflik tidak diringkas" : ""}</p>) : <p>Belum ada pasangan pilar untuk wilayah dan tahun ini.</p>}</details></section>
    <p className="source-line">Dataset Dashboard 040526.xlsx. Kategori dan nama instansi sumber tidak tercantum pada sheet fakta.</p>
  </div><SheetFooter><SheetClose asChild><Button variant="outline">Tutup detail</Button></SheetClose></SheetFooter></SheetContent></Sheet>;
}

export default function IdsdPage() {
  const [year, setYear] = useState("2024");
  const [level, setLevel] = useState("PROV");
  const [province, setProvince] = useState("all");
  const [district, setDistrict] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"name" | "high" | "low">("name");
  const districts = regions.filter(r => r.level !== "PROV" && (province === "all" || r.provinceCode === province));
  const filtered = fixture.records.filter(r => r.year === Number(year) && r.level === level && (province === "all" || r.provinceCode === province) && (district === "all" || r.code === district) && matchesQuery(query, r.name, r.code ?? "", r.sourceCode));
  filtered.sort((a, b) => sort === "name" ? a.name.localeCompare(b.name, "id") : a.value === null ? 1 : b.value === null ? -1 : (sort === "high" ? b.value - a.value : a.value - b.value) || a.name.localeCompare(b.name, "id"));
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  function change(action: () => void) { action(); setPage(1); }
  function reset() { setYear("2024"); setLevel("PROV"); setProvince("all"); setDistrict("all"); setQuery(""); setSort("name"); setPage(1); }
  const available = filtered.filter(r => r.value !== null);
  const notes = filtered.filter(r => r.match !== "code" || r.value === 0 || !r.sourceLevel).length;

  return <div className="data-page"><PageHeader title="Data IDSD" parent="Kelola Data" description="Telusuri skor Indeks Daya Saing Daerah beserta sumber dan profil 12 pilar." />
    <DataFilters query={query} onQuery={value => change(() => setQuery(value))} onReset={reset} summary={`${year} · ${level === "PROV" ? "Provinsi" : "Kabupaten / kota"} · ${province === "all" ? "Seluruh Indonesia" : regionByCode.get(province)?.name}`}>
      <SelectField label="Tahun" value={year} onValueChange={value => change(() => setYear(value))} options={[...fixture.years].reverse().map(y => ({ value: String(y), label: `${y}${fixture.records.some(r => r.year === y) ? "" : " · belum ada data"}` }))} />
      <SelectField label="Level wilayah" value={level} onValueChange={value => change(() => { setLevel(value); setDistrict("all"); })} options={[{ value: "PROV", label: "Provinsi" }, { value: "KABKOTA", label: "Kabupaten / kota" }]} />
      <SelectField label="Provinsi" value={province} onValueChange={value => change(() => { setProvince(value); setDistrict("all"); })} options={provinceOptions} />
      {level === "KABKOTA" && <SelectField label="Kabupaten / kota" value={district} onValueChange={value => change(() => setDistrict(value))} options={[{ value: "all", label: "Semua kabupaten / kota" }, ...districts.map(r => ({ value: r.code, label: r.name }))]} />}
    </DataFilters>
    <div className="data-overview"><div><strong>{filtered.length}</strong><span>Baris sesuai filter</span></div><div><strong>{available.length}</strong><span>Skor tersedia</span></div><div><strong>{notes}</strong><span>Baris dengan catatan sumber</span></div></div>
    <div className="data-notice"><Info aria-hidden="true" /><p>Kategori skor tidak tercantum pada workbook. Nilai nol dipertahankan; pasangan berdasarkan nama dan kode lama ditandai untuk ditinjau.</p></div>
    <section className="data-panel"><div className="data-panel-heading"><div><h2>Skor IDSD {year}</h2><p>{level === "PROV" ? "Tingkat provinsi" : "Tingkat kabupaten / kota"} · Skala 0–5</p></div><div className="data-sort-field"><SelectField label="Urutkan" value={sort} onValueChange={value => change(() => setSort(value as typeof sort))} options={[{ value: "name", label: "Nama wilayah A–Z" }, { value: "high", label: "Skor tertinggi" }, { value: "low", label: "Skor terendah" }]} /></div></div>
      {filtered.length ? <div className="table-scroll" role="region" tabIndex={0} aria-label="Tabel IDSD, dapat digulir horizontal"><table className="data-table idsd-table"><caption className="sr-only">Skor IDSD dari fact_total_idsd, tahun {year}</caption><thead><tr><th scope="col">Kode sumber</th><th scope="col">Wilayah</th><th scope="col" className="number-cell" aria-sort={sort === "high" ? "descending" : sort === "low" ? "ascending" : "none"}>Skor <ArrowDownWideNarrow aria-hidden="true" /></th><th scope="col">Kategori</th><th scope="col">Sumber</th><th scope="col">Detail</th></tr></thead><tbody>{visible.map(r => <tr key={r.id}><td className="numeric">{r.sourceCode}</td><td><span className="table-primary">{r.name}</span><span className="table-secondary">{r.provinceCode ? regionByCode.get(r.provinceCode)?.name : "Provinsi belum dipadankan"}</span>{(r.match !== "code" || r.value === 0 || !r.sourceLevel) && <span className="record-note">{r.match === "name" ? `Padanan nama · kode master ${r.code}` : r.match === "unmatched" ? "Belum dipadankan" : r.value === 0 ? "Nilai nol pada sumber" : "Level sumber kosong"}</span>}</td><td className="number-cell score-cell">{scoreFormat(r.value)}</td><td><StatusBadge>Belum tersedia</StatusBadge></td><td><span className="table-source">fact_total_idsd</span><span className="table-secondary">Baris {r.id}</span></td><td><RecordDetail record={r} /></td></tr>)}</tbody></table></div> : <NoResults onReset={reset} />}
      <Pagination page={currentPage} total={filtered.length} size={PAGE_SIZE} onPage={setPage} />
    </section><p className="data-source">Sumber: dim_waktu, dim_wilayah, dim_pilar_idsd, fact_total_idsd, fact_skor_pilar, fact_skor_pilar_kabkota · Dataset Dashboard 040526.xlsx. Filter provinsi mengikuti master saat ini; pemekaran membatasi perbandingan historis.</p>
  </div>;
}
