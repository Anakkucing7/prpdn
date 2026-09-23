"use client";

import { useRef, useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import fixture from "@/data/masters.json";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui-patterns";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Pagination, NoResults } from "./data-controls";
import { DemoNotice, OriginBadge, MasterField, MasterDialog, MasterForm, MasterDelete, focusInvalid, type DemoOrigin } from "./master-shared";
import { optionalNumber, validateIndicator, type IndicatorDraft, type Errors } from "@/lib/master-validation";

type Indicator = { key: string; id: number; name: string; groupCode: string; groupName: string; unit: string; baseline: number | null; target: number | null; period: string; start: number | null; end: number | null; sourceRow: number | null; origin: DemoOrigin };
const sourceRecords: Indicator[] = fixture.indicators.map(r => ({ key: `source-${r.sourceRow}`, id: r.id_indikator_rpjmd, name: r.nama_indikator, groupCode: r.kode_sasaran, groupName: r.nama_sasaran, unit: r.satuan, baseline: r.kondisi_awal, target: r.target_akhir, period: r.nama_periode, start: r.tahun_mulai, end: r.tahun_selesai, sourceRow: r.sourceRow, origin: "workbook" }));
const numberText = (value: number | null) => value === null ? "Tidak tersedia" : value.toLocaleString("id-ID", { maximumFractionDigits: 10 });
const PAGE_SIZE = 5;

function IndicatorForm({ record, records, onSave, onCancel }: { record: Indicator | null; records: Indicator[]; onSave: (draft: IndicatorDraft) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<IndicatorDraft>({ id: String(record?.id ?? Math.max(0, ...records.map(r => r.id)) + 1), name: record?.name ?? "", groupCode: record?.groupCode ?? "", groupName: record?.groupName ?? "", unit: record?.unit ?? "", baseline: String(record?.baseline ?? ""), target: String(record?.target ?? ""), period: record?.period ?? "", start: String(record?.start ?? ""), end: String(record?.end ?? "") });
  const [errors, setErrors] = useState<Errors<IndicatorDraft>>({});
  function field(key: keyof IndicatorDraft) { return { name: key, value: draft[key], error: errors[key], onChange: (event: React.ChangeEvent<HTMLInputElement>) => { setDraft({ ...draft, [key]: event.target.value }); setErrors({ ...errors, [key]: undefined }); } }; }
  return <MasterForm onCancel={onCancel} onSubmit={event => { event.preventDefault(); const next = validateIndicator(draft, records.filter(r => r.key !== record?.key).map(r => r.id)); setErrors(next); const first = Object.keys(next)[0]; if (first) { focusInvalid(event.currentTarget, first); return; } onSave(draft); }}>
    <MasterField label="ID indikator" required inputMode="numeric" {...field("id")} />
    <MasterField label="Nama indikator" required maxLength={300} {...field("name")} />
    <div className="master-form-pair"><MasterField label="Kode sasaran" required maxLength={50} {...field("groupCode")} /><MasterField label="Satuan" required maxLength={80} {...field("unit")} /></div>
    <MasterField label="Nama sasaran" required maxLength={300} {...field("groupName")} />
    <div className="master-form-pair"><MasterField label="Kondisi awal" inputMode="decimal" {...field("baseline")} /><MasterField label="Target akhir" inputMode="decimal" {...field("target")} /></div>
    <MasterField label="Nama periode" maxLength={200} {...field("period")} />
    <div className="master-form-pair"><MasterField label="Tahun mulai" inputMode="numeric" maxLength={4} {...field("start")} /><MasterField label="Tahun selesai" inputMode="numeric" maxLength={4} {...field("end")} /></div>
    <p className="muted-note">Kondisi awal, target, dan periode boleh kosong. Jika satu tahun periode diisi, isi kedua tahun.</p>
  </MasterForm>;
}

function IndicatorDetail({ record }: { record: Indicator }) {
  const original = sourceRecords.find(r => r.sourceRow === record.sourceRow);
  return <Sheet><SheetTrigger asChild><Button variant="link" aria-label={`Detail ${record.name}`}>Detail</Button></SheetTrigger><SheetContent className="detail-sheet"><SheetHeader><SheetTitle>{record.name}</SheetTitle><SheetDescription>Indikator RPJMD · ID {record.id}</SheetDescription></SheetHeader><div className="detail-body"><div><OriginBadge origin={record.origin} /></div><dl className="facts"><div><dt>Kode sasaran</dt><dd>{record.groupCode}</dd></div><div><dt>Sasaran</dt><dd>{record.groupName}</dd></div><div><dt>Satuan</dt><dd>{record.unit}</dd></div><div><dt>Kondisi awal</dt><dd>{numberText(record.baseline)}</dd></div><div><dt>Target akhir</dt><dd>{numberText(record.target)}</dd></div><div><dt>Periode</dt><dd>{record.period || "Tidak tersedia"}</dd></div><div><dt>Tahun</dt><dd>{record.start === null ? "Tidak tersedia" : `${record.start}–${record.end}`}</dd></div></dl>
    <section><h3 className="subheading">Asal data</h3><p className="source-line">{record.sourceRow ? `dim_indikator_rpjmd · baris ${record.sourceRow} · ${fixture.workbook}` : "Ditambahkan dalam demo; tidak memiliki baris sumber workbook."}</p></section>
    {record.origin === "edited" && original && <section><h3 className="subheading">Nilai asli workbook</h3><dl className="facts"><div><dt>ID / indikator</dt><dd>{original.id} · {original.name}</dd></div><div><dt>Sasaran</dt><dd>{original.groupCode} · {original.groupName}</dd></div><div><dt>Satuan</dt><dd>{original.unit}</dd></div><div><dt>Awal / target</dt><dd>{numberText(original.baseline)} / {numberText(original.target)}</dd></div><div><dt>Periode</dt><dd>{original.period} ({original.start}–{original.end})</dd></div></dl></section>}
    <p className="muted-note">Status aktif, arah indikator, dan instansi sumber tidak tercantum pada sheet ini.</p>
  </div><SheetFooter><SheetClose asChild><Button variant="outline">Tutup detail</Button></SheetClose></SheetFooter></SheetContent></Sheet>;
}

export default function IndicatorsPage() {
  const [records, setRecords] = useState(sourceRecords);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [period, setPeriod] = useState("all");
  const [sort, setSort] = useState("id");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Indicator | null | undefined>(undefined);
  const [message, setMessage] = useState("");
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  const serial = useRef(0);
  const filtered = records.filter(r => `${r.id} ${r.name} ${r.groupCode} ${r.groupName}`.toLocaleLowerCase("id").includes(query.trim().toLocaleLowerCase("id")) && (group === "all" || r.groupCode === group) && (period === "all" || r.period === period)).sort((a, b) => sort === "id" ? a.id - b.id : (sort === "name-desc" ? -1 : 1) * a.name.localeCompare(b.name, "id"));
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  function reset() { setQuery(""); setGroup("all"); setPeriod("all"); setPage(1); }
  function open(record: Indicator | null, target: HTMLElement) { setOpener(target); setEditing(record); }
  function save(draft: IndicatorDraft) {
    const record: Indicator = { key: editing?.key ?? `demo-${++serial.current}`, id: Number(draft.id), name: draft.name.trim(), groupCode: draft.groupCode.trim(), groupName: draft.groupName.trim(), unit: draft.unit.trim(), baseline: optionalNumber(draft.baseline), target: optionalNumber(draft.target), period: draft.period.trim(), start: optionalNumber(draft.start), end: optionalNumber(draft.end), sourceRow: editing?.sourceRow ?? null, origin: editing?.sourceRow ? "edited" : "new" };
    setRecords(editing ? records.map(r => r.key === editing.key ? record : r) : [...records, record]);
    setMessage(`${record.name} ${editing ? "diubah" : "ditambahkan"} dalam demo. Filter direset agar hasil dapat ditemukan.`);
    reset(); setEditing(undefined);
  }
  return <div className="data-page master-page"><PageHeader title="Master Indikator" parent="Master Data" description="Kelola definisi indikator RPJMD, sasaran, satuan, dan periode pengukuran." actions={<Button onClick={event => open(null, event.currentTarget)}><Plus />Tambah indikator</Button>} /><DemoNotice />
    <section className="data-filter-section master-filters" aria-label="Filter indikator"><MasterField label="Cari indikator" type="search" placeholder="ID, nama indikator, atau sasaran" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} /><SelectField label="Sasaran" value={group} onValueChange={value => { setGroup(value); setPage(1); }} options={[{ value: "all", label: "Semua sasaran" }, ...Array.from(new Map(records.map(r => [r.groupCode, `${r.groupCode} · ${r.groupName}`]))).map(([value, label]) => ({ value, label }))]} /><SelectField label="Periode" value={period} onValueChange={value => { setPeriod(value); setPage(1); }} options={[{ value: "all", label: "Semua periode" }, ...Array.from(new Set(records.map(r => r.period).filter(Boolean))).map(value => ({ value, label: value }))]} /><Button variant="ghost" onClick={reset}><RotateCcw />Reset filter</Button></section>
    <p className="master-feedback" role="status">{message}</p>
    <section className="data-panel"><div className="data-panel-heading"><div><h2 id="master-table-title" tabIndex={-1}>Daftar indikator</h2><p>{filtered.length} dari {records.length} indikator · {sourceRecords.length} berasal dari workbook awal</p></div><div className="data-sort-field"><SelectField label="Urutkan" value={sort} onValueChange={value => { setSort(value); setPage(1); }} options={[{ value: "id", label: "ID terkecil" }, { value: "name", label: "Nama A–Z" }, { value: "name-desc", label: "Nama Z–A" }]} /></div></div>
    {visible.length ? <div className="table-scroll" tabIndex={0} role="region" aria-label="Tabel master indikator, dapat digulir horizontal"><table className="data-table master-indicator-table"><caption className="sr-only">Master indikator RPJMD</caption><thead><tr><th scope="col" aria-sort={sort === "id" ? "ascending" : "none"}>ID</th><th scope="col" aria-sort={sort === "name" ? "ascending" : sort === "name-desc" ? "descending" : "none"}>Indikator / sasaran</th><th scope="col">Satuan</th><th scope="col">Periode</th><th scope="col">Asal data</th><th scope="col">Tindakan</th></tr></thead><tbody>{visible.map(r => <tr key={r.key}><td className="numeric">{r.id}</td><td><span className="table-primary">{r.name}</span><span className="table-secondary">{r.groupCode} · {r.groupName}</span></td><td>{r.unit}</td><td>{r.period || "Tidak tersedia"}<span className="table-secondary">{r.start !== null ? `${r.start}–${r.end}` : "Tahun tidak tersedia"}</span></td><td><OriginBadge origin={r.origin} /><span className="table-secondary">{r.sourceRow ? `Baris sumber ${r.sourceRow}` : "Tanpa baris workbook"}</span></td><td><div className="master-row-actions"><IndicatorDetail record={r} /><Button variant="link" aria-label={`Ubah ${r.name}`} onClick={event => open(r, event.currentTarget)}>Ubah</Button><MasterDelete label={r.name} onDelete={() => { setRecords(records.filter(item => item.key !== r.key)); setMessage(`${r.name} dihapus dari demo. Workbook tidak berubah.`); }} /></div></td></tr>)}</tbody></table></div> : <NoResults onReset={reset} />}
    <Pagination page={currentPage} size={PAGE_SIZE} total={filtered.length} onPage={setPage} /></section><p className="data-source">Sumber: dim_indikator_rpjmd · {fixture.workbook}. ID indikator berbeda dari kode sasaran. Tidak ada indikator tambahan yang dihasilkan untuk mengisi tabel.</p>
    {editing !== undefined && <MasterDialog title={editing ? "Ubah indikator" : "Tambah indikator"} onClose={() => setEditing(undefined)} opener={opener}><IndicatorForm record={editing} records={records} onSave={save} onCancel={() => setEditing(undefined)} /></MasterDialog>}
  </div>;
}
