"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import fixture from "@/data/masters.json";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui-patterns";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { DemoNotice, OriginBadge, MasterField, MasterDialog, MasterForm, MasterDelete, focusInvalid, type DemoOrigin } from "./master-shared";
import { validateYear, optionalNumber, type YearDraft, type Errors } from "@/lib/master-validation";

type YearRecord = { key: string; id: number; year: number; sequence: number | null; sourceRow: number | null; origin: DemoOrigin };
const sourceRecords: YearRecord[] = fixture.years.map(r => ({ key: `source-${r.sourceRow}`, id: r.id_waktu, year: r.tahun, sequence: r.tahun_ke_rpjmd, sourceRow: r.sourceRow, origin: "workbook" }));

function YearForm({ record, records, onSave, onCancel }: { record: YearRecord | null; records: YearRecord[]; onSave: (draft: YearDraft) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<YearDraft>({ year: record ? String(record.year) : "", sequence: String(record?.sequence ?? "") });
  const [errors, setErrors] = useState<Errors<YearDraft>>({});
  return <MasterForm onCancel={onCancel} onSubmit={event => { event.preventDefault(); const next = validateYear(draft, records.filter(r => r.key !== record?.key).map(r => r.year)); setErrors(next); const first = Object.keys(next)[0]; if (first) { focusInvalid(event.currentTarget, first); return; } onSave(draft); }}>
    <MasterField name="year" label="Tahun" required inputMode="numeric" maxLength={4} placeholder="Contoh: 2026" value={draft.year} error={errors.year} onChange={event => { setDraft({ ...draft, year: event.target.value }); setErrors({ ...errors, year: undefined }); }} />
    <MasterField name="sequence" label="Tahun ke-RPJMD" inputMode="numeric" placeholder="Contoh: 1" value={draft.sequence} error={errors.sequence} onChange={event => { setDraft({ ...draft, sequence: event.target.value }); setErrors({ ...errors, sequence: undefined }); }} />
    <p className="muted-note">Urutan tahun RPJMD boleh kosong jika belum diketahui. ID waktu {record ? `${record.id} dipertahankan saat mengubah tahun` : "dibuat otomatis sebagai ID unik dalam demo"}.</p>
  </MasterForm>;
}

function YearDetail({ record }: { record: YearRecord }) {
  const original = sourceRecords.find(r => r.sourceRow === record.sourceRow);
  return <Sheet><SheetTrigger asChild><Button variant="link" aria-label={`Detail tahun ${record.year}`}>Detail</Button></SheetTrigger><SheetContent className="detail-sheet"><SheetHeader><SheetTitle>Tahun {record.year}</SheetTitle><SheetDescription>Master waktu · ID {record.id}</SheetDescription></SheetHeader><div className="detail-body"><div><OriginBadge origin={record.origin} /></div><dl className="facts"><div><dt>ID waktu</dt><dd>{record.id}</dd></div><div><dt>Tahun</dt><dd>{record.year}</dd></div><div><dt>Tahun ke-RPJMD</dt><dd>{record.sequence ?? "Tidak tersedia"}</dd></div></dl><section><h3 className="subheading">Asal data</h3><p className="source-line">{record.sourceRow ? `dim_waktu · baris ${record.sourceRow} · ${fixture.workbook}` : "Ditambahkan dalam demo; tidak memiliki baris sumber workbook."}</p></section>{record.origin === "edited" && original && <section><h3 className="subheading">Nilai asli workbook</h3><p className="muted-note">ID {original.id} · Tahun {original.year} · Tahun ke-RPJMD {original.sequence}</p></section>}<p className="muted-note">Sheet sumber tidak menetapkan tahun aktif/default atau klasifikasi historis/perencanaan. Mengubah master demo tidak mengubah filter tahun pada halaman analitis.</p></div><SheetFooter><SheetClose asChild><Button variant="outline">Tutup detail</Button></SheetClose></SheetFooter></SheetContent></Sheet>;
}

export default function YearsPage() {
  const [records, setRecords] = useState(sourceRecords);
  const [sort, setSort] = useState("asc");
  const [editing, setEditing] = useState<YearRecord | null | undefined>(undefined);
  const [message, setMessage] = useState("");
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  const serial = useRef(0);
  const visible = [...records].sort((a, b) => (sort === "asc" ? 1 : -1) * (a.year - b.year));
  function open(record: YearRecord | null, target: HTMLElement) { setOpener(target); setEditing(record); }
  function save(draft: YearDraft) {
    const year = Number(draft.year);
    const id = editing?.id ?? (records.some(r => r.id === year) ? Math.max(year, ...records.map(r => r.id)) + 1 : year);
    const record: YearRecord = { key: editing?.key ?? `demo-${++serial.current}`, id, year, sequence: optionalNumber(draft.sequence), sourceRow: editing?.sourceRow ?? null, origin: editing?.sourceRow ? "edited" : "new" };
    setRecords(editing ? records.map(r => r.key === editing.key ? record : r) : [...records, record]);
    setMessage(`Tahun ${year} ${editing ? "diubah" : "ditambahkan"} dalam demo. Tidak disimpan ke workbook.`); setEditing(undefined);
  }
  return <div className="data-page master-page"><PageHeader title="Master Tahun" parent="Master Data" description="Kelola daftar tahun dan urutan tahun RPJMD dari master waktu." actions={<Button onClick={event => open(null, event.currentTarget)}><Plus />Tambah tahun</Button>} /><DemoNotice />
    <p className="master-feedback" role="status">{message}</p><section className="data-panel"><div className="data-panel-heading"><div><h2 id="master-table-title" tabIndex={-1}>Daftar tahun</h2><p>{records.length} tahun · {sourceRecords.length} berasal dari workbook awal</p></div><div className="data-sort-field"><SelectField label="Urutkan tahun" value={sort} onValueChange={setSort} options={[{ value: "asc", label: "Terlama dahulu" }, { value: "desc", label: "Terbaru dahulu" }]} /></div></div>
    {visible.length ? <div className="table-scroll" tabIndex={0} role="region" aria-label="Tabel master tahun, dapat digulir horizontal"><table className="data-table master-year-table"><caption className="sr-only">Master tahun dari dim_waktu</caption><thead><tr><th scope="col">ID waktu</th><th scope="col" aria-sort={sort === "asc" ? "ascending" : "descending"}>Tahun</th><th scope="col">Tahun ke-RPJMD</th><th scope="col">Asal data</th><th scope="col">Tindakan</th></tr></thead><tbody>{visible.map(r => <tr key={r.key}><td className="numeric">{r.id}</td><td className="table-primary">{r.year}</td><td>{r.sequence ?? "Tidak tersedia"}</td><td><OriginBadge origin={r.origin} /><span className="table-secondary">{r.sourceRow ? `Baris sumber ${r.sourceRow}` : "Tanpa baris workbook"}</span></td><td><div className="master-row-actions"><YearDetail record={r} /><Button variant="link" aria-label={`Ubah tahun ${r.year}`} onClick={event => open(r, event.currentTarget)}>Ubah</Button><MasterDelete label={`tahun ${r.year}`} onDelete={() => { setRecords(records.filter(item => item.key !== r.key)); setMessage(`Tahun ${r.year} dihapus dari demo. Workbook tidak berubah.`); }} /></div></td></tr>)}</tbody></table></div> : <div className="data-empty"><h3>Daftar tahun demo kosong</h3><p>Tambahkan tahun atau muat ulang halaman untuk mengembalikan data workbook.</p><Button onClick={event => open(null, event.currentTarget)}>Tambah tahun</Button></div>}
    <div className="master-table-footer" role="status">{records.length} tahun ditampilkan</div></section><p className="data-source">Sumber: dim_waktu · {fixture.workbook}. Tahun aktif/default dan status perencanaan tidak tersedia pada sumber.</p>
    {editing !== undefined && <MasterDialog title={editing ? "Ubah tahun" : "Tambah tahun"} onClose={() => setEditing(undefined)} opener={opener}><YearForm record={editing} records={records} onSave={save} onCancel={() => setEditing(undefined)} /></MasterDialog>}
  </div>;
}
