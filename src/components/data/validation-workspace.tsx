"use client";

import { useState } from 'react';
import { Info, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { SelectField, StatusBadge } from '@/components/ui-patterns';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { datasetLabels, fields, fieldLabels, qualityLabels, validateRows, type Finding, type RawRow } from '@/lib/import-validation';
import { references, regionReference, sourceWorkbook, type DemoRow, type Review } from '@/data/import-demo';
import { Pagination, NoResults } from './data-controls';

export const reviewLabels: Record<Review, string> = { pending: 'Belum ditinjau', reviewed: 'Sudah ditinjau', accepted: 'Diterima · demo', rejected: 'Ditolak · demo' };
const displayValue = (value: string) => value && /^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(value) ? new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(Number(value.replace(',', '.'))) : value || 'Kosong';
const tones = { valid: 'success', warning: 'warning', duplicate: 'warning', empty: 'neutral', error: 'error' } as const;
export function findingsFor(rows: DemoRow[]) {
  const findings = new Map<string, Finding>();
  for (const dataset of ['total', 'pillar'] as const) {
    const subset = rows.filter(r => r.dataset === dataset);
    validateRows(subset.map(r => r.raw), dataset, references).forEach((f, i) => findings.set(subset[i].id, f));
  }
  return findings;
}
export function WorkflowNotice() {
  return <div className="data-notice"><Info aria-hidden="true" /><p>Prototipe lokal. Sampel berasal dari workbook; masalah buatan ditandai sebagai skenario demo. File tidak dikirim atau dibaca isinya. Hasil import dan keputusan tinjauan tidak disimpan, tidak mengubah workbook, dan tidak diteruskan ke halaman lain.</p></div>;
}
export function ValidationSummary({ findings }: { findings: Finding[] }) {
  const valid = findings.filter(f => f.status === 'valid').length;
  const review = findings.filter(f => f.status === 'warning' || f.status === 'duplicate').length;
  return <dl className="workflow-summary" aria-label="Ringkasan kualitas data">{[['Total baris', findings.length], ['Valid', valid], ['Perlu tinjau', review], ['Tidak valid / kosong', findings.length - valid - review]].map(([label, count]) => <div key={label}><dt>{label}</dt><dd>{count}</dd></div>)}</dl>;
}
function Detail({ row, finding, allRows, onChange, onReview }: { row: DemoRow; finding: Finding; allRows: DemoRow[]; onChange?: (id: string, raw: RawRow) => void; onReview?: (id: string, review: Review) => void }) {
  const [draft, setDraft] = useState(row.raw);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const canAccept = finding.status === 'valid' || finding.status === 'warning';
  const candidate = allRows.map(r => r.id === row.id ? { ...r, raw: draft } : r);
  const draftFinding = findingsFor(candidate).get(row.id)!;
  return <Sheet onOpenChange={open => { if (open) { setDraft(row.raw); setEditing(false); setMessage(''); } }}><SheetTrigger asChild><Button variant="link" aria-label={`Periksa ${row.id}`}>Periksa</Button></SheetTrigger><SheetContent className="detail-sheet workflow-detail" onCloseAutoFocus={event => { if (!document.querySelector(`[aria-label="Periksa ${row.id}"]`)) { event.preventDefault(); document.getElementById('validation-table-title')?.focus(); } }}>
    <SheetHeader><SheetTitle>Detail baris {row.id}</SheetTitle><SheetDescription>{datasetLabels[row.dataset]} · {regionReference.get(row.raw.code)?.name ?? 'Wilayah belum dikenali'}</SheetDescription></SheetHeader>
    <div className="detail-body"><div className="workflow-badges"><StatusBadge tone={tones[finding.status]}>{qualityLabels[finding.status]}</StatusBadge>{onReview && <StatusBadge>{reviewLabels[row.review]}</StatusBadge>}</div>
      <section><h3 className="subheading">Temuan pemeriksaan</h3><ul className="workflow-findings">{finding.messages.map(m => <li key={m}>{m}</li>)}</ul><p className="muted-note">{finding.status === 'valid' ? 'Lolos pemeriksaan sampel bukan bukti bahwa data sudah tersimpan.' : 'Periksa kembali baris sumber. Tidak ada nilai koreksi yang diterapkan otomatis.'}</p></section>
      <section><h3 className="subheading">Nilai saat ini dan nilai asli</h3><dl className="facts">{fields.map(f => <div key={f}><dt>{fieldLabels[f]}</dt><dd>{row.raw[f] || 'Kosong'}<span className="table-secondary">Workbook: {row.original[f]}</span></dd></div>)}</dl></section>
      <section><h3 className="subheading">Jejak sumber</h3><p className="source-line">{sourceWorkbook}<br />{row.sheet} · baris {row.sourceRow}</p><p className="muted-note">{row.note}</p><p className="muted-note">Template demo: TAHUN, KODE_WILAYAH, INDIKATOR, NILAI. Skor total memakai kode IDSD; skor pilar memakai ID pada dim_pilar_idsd.</p></section>
      {onChange && <section><Button variant="outline" onClick={() => { setEditing(!editing); setDraft(row.raw); }}> {editing ? 'Batalkan koreksi' : 'Koreksi nilai demo'}</Button>{editing && <form className="workflow-edit" onSubmit={event => { event.preventDefault(); onChange(row.id, draft); setEditing(false); setMessage('Koreksi demo diterapkan dan seluruh baris diperiksa ulang. Keputusan tinjauan direset.'); }}>
        {fields.map(f => <Field key={f}><FieldLabel htmlFor={`edit-${row.id}-${f}`}>{fieldLabels[f]} *</FieldLabel><Input id={`edit-${row.id}-${f}`} required maxLength={100} value={draft[f]} onChange={event => setDraft({ ...draft, [f]: event.target.value })} /></Field>)}
        <p className="muted-note" role="status">{qualityLabels[draftFinding.status]}: {draftFinding.messages.join(' ')}</p><Button type="submit">Terapkan koreksi demo</Button></form>}</section>}
      {onReview && <section><h3 className="subheading">Keputusan tinjauan demo</h3><p className="muted-note">Ditinjau tidak mengubah kualitas data. Baris tidak valid, kosong, atau duplikat tidak dapat diterima.</p><div className="workflow-actions">
        <Button variant="outline" onClick={() => { onReview(row.id, 'reviewed'); setMessage('Ditandai sudah ditinjau dalam demo.'); }}>Tandai ditinjau</Button>
        <AlertDialog><AlertDialogTrigger asChild><Button disabled={!canAccept}>Terima demo</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Terima baris dalam demo?</AlertDialogTitle><AlertDialogDescription>{finding.status === 'warning' ? 'Tahun belum ada pada master. Penerimaan ini mengakui peringatan tersebut tanpa mengubah nilai atau master tahun.' : 'Penerimaan hanya mengubah keputusan lokal. Tidak ada data yang disimpan ke server.'}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => { onReview(row.id, 'accepted'); setMessage('Baris diterima dalam demo.'); }}>Terima demo</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        <Button variant="outline" onClick={() => { onReview(row.id, 'rejected'); setMessage('Baris ditolak dalam demo.'); }}>Tolak demo</Button><Button variant="ghost" onClick={() => { onReview(row.id, 'pending'); setMessage('Kembali ke belum ditinjau.'); }}>Kembalikan ke tinjauan</Button>
      </div></section>}<p role="status" className="master-feedback">{message}</p>
    </div><SheetFooter><SheetClose asChild><Button variant="outline">Tutup detail</Button></SheetClose></SheetFooter>
  </SheetContent></Sheet>;
}
export function ValidationWorkspace({ rows, onRows }: { rows: DemoRow[]; onRows?: (rows: DemoRow[]) => void }) {
  const [query, setQuery] = useState(''); const [dataset, setDataset] = useState('all'); const [status, setStatus] = useState('all'); const [year, setYear] = useState('all'); const [level, setLevel] = useState('all');
  const [page, setPage] = useState(1); const [selected, setSelected] = useState<string[]>([]); const [feedback, setFeedback] = useState('');
  const findings = findingsFor(rows);
  const filtered = rows.filter(r => (dataset === 'all' || dataset === r.dataset) && (status === 'all' || findings.get(r.id)?.status === status) && (year === 'all' || r.raw.year === year) && (level === 'all' || regionReference.get(r.raw.code)?.level === level) && `${r.id} ${r.raw.code} ${regionReference.get(r.raw.code)?.name ?? ''} ${r.raw.indicator}`.toLocaleLowerCase('id').includes(query.toLocaleLowerCase('id')));
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / 8))); const visible = filtered.slice((current - 1) * 8, current * 8);
  function reset() { setQuery(''); setDataset('all'); setStatus('all'); setYear('all'); setLevel('all'); setPage(1); setSelected([]); }
  function filter(set: (value: string) => void, value: string) { set(value); setPage(1); setSelected([]); }
  return <><ValidationSummary findings={[...findings.values()]} />{onRows && <section className="data-filter-section workflow-filters" aria-label="Filter validasi">
    <Field><FieldLabel htmlFor="validation-search">Cari baris atau wilayah</FieldLabel><Input id="validation-search" type="search" placeholder="Referensi, nama, atau kode wilayah" value={query} onChange={e => filter(setQuery, e.target.value)} /></Field>
    <SelectField label="Dataset" value={dataset} onValueChange={v => filter(setDataset, v)} options={[{ value: 'all', label: 'Semua dataset' }, ...Object.entries(datasetLabels).map(([value, label]) => ({ value, label }))]} />
    <SelectField label="Kualitas data" value={status} onValueChange={v => filter(setStatus, v)} options={[{ value: 'all', label: 'Semua status' }, ...Object.entries(qualityLabels).map(([value, label]) => ({ value, label }))]} />
    <SelectField label="Tahun" value={year} onValueChange={v => filter(setYear, v)} options={[{ value: 'all', label: 'Semua tahun' }, ...[...new Set(rows.map(r => r.raw.year))].sort().map(value => ({ value, label: value || 'Kosong' })).filter(o => o.value)]} />
    <SelectField label="Level wilayah" value={level} onValueChange={v => filter(setLevel, v)} options={[{ value: 'all', label: 'Semua level' }, ...[...new Set(rows.map(r => regionReference.get(r.raw.code)?.level).filter(Boolean))].map(value => ({ value: value!, label: value === 'PROV' ? 'Provinsi' : value === 'KAB' ? 'Kabupaten' : 'Kota' }))]} />
    <Button variant="ghost" onClick={reset}><RotateCcw />Reset filter</Button>
  </section>}
    <section className="data-panel"><div className="data-panel-heading"><div><h2 id="validation-table-title" tabIndex={-1}>{onRows ? 'Daftar pemeriksaan' : 'Hasil pemeriksaan sampel'}</h2><p>{filtered.length} dari {rows.length} baris demo · nilai tabel dibulatkan maksimal 3 desimal; nilai lengkap tersedia di detail</p></div>{onRows && <Button variant="outline" disabled={!selected.length} onClick={() => { onRows(rows.map(r => selected.includes(r.id) ? { ...r, review: 'reviewed' } : r)); setFeedback(`${selected.length} baris ditandai ditinjau. Kualitas data tidak berubah.`); setSelected([]); }}>Tandai ditinjau ({selected.length})</Button>}</div>
      {feedback && <p className="workflow-feedback" role="status">{feedback}</p>}
      {visible.length ? <div className="table-scroll" role="region" aria-label="Tabel validasi, dapat digulir horizontal" tabIndex={0}><table className="data-table workflow-table"><caption className="sr-only">Pemeriksaan sampel data</caption><thead><tr>{onRows && <th><label className="workflow-checkbox"><input type="checkbox" aria-label="Pilih semua baris halaman ini" checked={visible.every(r => selected.includes(r.id))} onChange={e => setSelected(e.target.checked ? visible.map(r => r.id) : [])} /></label></th>}<th scope="col">Referensi / dataset</th><th scope="col">Wilayah / tahun</th><th scope="col">Nilai</th><th scope="col">Kualitas data</th><th scope="col">Temuan</th>{onRows && <th scope="col">Tinjauan</th>}<th scope="col">Tindakan</th></tr></thead><tbody>{visible.map(r => { const finding = findings.get(r.id)!; return <tr key={r.id}>{onRows && <td><label className="workflow-checkbox"><input type="checkbox" aria-label={`Pilih ${r.id}`} checked={selected.includes(r.id)} onChange={e => setSelected(e.target.checked ? [...selected, r.id] : selected.filter(id => id !== r.id))} /></label></td>}<td className="table-primary">{r.id}<span className="table-secondary">{datasetLabels[r.dataset]} · {r.raw.indicator || 'Kosong'}</span></td><td>{regionReference.get(r.raw.code)?.name ?? 'Tidak dikenali'}<span className="table-secondary">{r.raw.code || 'Kode kosong'} · {r.raw.year || 'Tahun kosong'}</span></td><td className="workflow-value" title={r.raw.value}>{displayValue(r.raw.value)}</td><td><StatusBadge tone={tones[finding.status]}>{qualityLabels[finding.status]}</StatusBadge></td><td className="workflow-issue">{finding.messages[0]}</td>{onRows && <td>{reviewLabels[r.review]}</td>}<td><Detail row={r} finding={finding} allRows={rows} onChange={onRows ? (id, raw) => { onRows(rows.map(item => ({ ...item, raw: item.id === id ? raw : item.raw, note: item.id === id ? 'Nilai dikoreksi manual dalam demo. Nilai asli workbook tetap dipertahankan.' : item.note, review: 'pending' }))); setSelected([]); } : undefined} onReview={onRows ? (id, review) => onRows(rows.map(item => item.id === id ? { ...item, review } : item)) : undefined} /></td></tr>; })}</tbody></table></div> : <NoResults onReset={reset} />}
      {onRows && <Pagination page={current} total={filtered.length} size={8} onPage={p => { setPage(p); setSelected([]); }} />}
    </section></>;
}
