"use client";

import { useState } from 'react';
import { FileSpreadsheet, Info, LoaderCircle, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { SelectField, StatusBadge } from '@/components/ui-patterns';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { datasetLabels, fieldLabels, fields, fileError, type Dataset, type RawRow } from '@/lib/import-validation';
import { demoRows, sourceWorkbook, type DemoRow, type Scenario } from '@/data/import-demo';
import { WorkflowNotice, ValidationWorkspace, findingsFor } from './validation-workspace';

const columns: Record<keyof RawRow, string> = { year: 'TAHUN', code: 'KODE_WILAYAH', indicator: 'INDIKATOR', value: 'NILAI' };
const identity = { year: 'year', code: 'code', indicator: 'indicator', value: 'value' } as const;
type FileInfo = { name: string; size: number; type: string; sample?: boolean };
export default function ImportPage() {
  const [dataset, setDataset] = useState<Dataset>('total'); const [scenario, setScenario] = useState<Scenario>('mixed');
  const [file, setFile] = useState<FileInfo | null>(null); const [error, setError] = useState('');
  const [stage, setStage] = useState<'setup' | 'preview' | 'validated' | 'done'>('setup');
  const [mapping, setMapping] = useState<Record<keyof RawRow, string>>(identity); const [rows, setRows] = useState<DemoRow[]>([]);
  const [processing, setProcessing] = useState(false); const [confirm, setConfirm] = useState(false);
  const [history, setHistory] = useState<{ name: string; dataset: Dataset; count: number; skipped: number; time: string }[]>([]);
  const baseRows = demoRows(dataset, scenario); const findings = findingsFor(rows);
  const valid = [...findings.values()].filter(f => f.status === 'valid').length;
  const canMap = fields.every(f => mapping[f]) && new Set(Object.values(mapping)).size === fields.length;
  function resetPreview() { setStage('setup'); setRows([]); setError(''); setMapping(identity); }
  function choose(file: FileInfo) { resetPreview(); const problem = fileError(file); if (problem) { setFile(null); setError(problem); } else setFile(file); }
  function focusStep(id: string) { requestAnimationFrame(() => document.getElementById(id)?.focus()); }
  function preview() { if (!file) { setError('Pilih file atau gunakan sampel demo terlebih dahulu.'); return; } setError(''); setStage('preview'); focusStep('import-preview-title'); }
  function validate() {
    if (!canMap) { setError('Petakan setiap field wajib ke kolom yang berbeda.'); return; }
    setRows(baseRows.map(r => ({ ...r, raw: Object.fromEntries(fields.map(f => [f, r.raw[mapping[f] as keyof RawRow]])) as RawRow })));
    setError(''); setStage('validated'); focusStep('validation-table-title');
  }
  async function run() {
    setConfirm(false); setProcessing(true);
    // ponytail: a short local delay demonstrates progress; replace only with a real import job in a future backend phase.
    await new Promise(resolve => setTimeout(resolve, 700));
    setHistory(items => [{ name: file!.name, dataset, count: valid, skipped: rows.length - valid, time: new Date().toLocaleTimeString('id-ID') }, ...items].slice(0, 5));
    setProcessing(false); setStage('done');
    requestAnimationFrame(() => document.getElementById('import-result-title')?.focus());
  }
  return <div className="data-page workflow-page"><PageHeader title="Import Data" parent="Pengelolaan Data" description="Siapkan berkas, periksa struktur, dan tinjau kualitas data sebelum konfirmasi." /><WorkflowNotice />
    <ol className="workflow-steps" aria-label="Tahapan import">{['Pilih berkas', 'Preview & pemetaan', 'Validasi & konfirmasi', 'Hasil demo'].map((label, i) => <li key={label} aria-current={['setup', 'preview', 'validated', 'done'][i] === stage ? 'step' : undefined}><span>{i + 1}</span>{label}</li>)}</ol>
    {stage !== 'done' && <section className="data-panel workflow-setup"><div className="data-panel-heading"><div><h2>Konfigurasi import</h2><p>Tahun dan wilayah diambil dari kolom sampel; tidak ditimpa oleh konfigurasi.</p></div><StatusBadge>Demo</StatusBadge></div><div className="workflow-setup-body">
      <div className="workflow-config"><SelectField label="Dataset tujuan" value={dataset} disabled={processing} onValueChange={value => { setDataset(value as Dataset); resetPreview(); }} options={Object.entries(datasetLabels).map(([value, label]) => ({ value, label }))} /><SelectField label="Skenario preview demo" value={scenario} disabled={processing} onValueChange={value => { setScenario(value as Scenario); resetPreview(); }} options={[{ value: 'mixed', label: 'Campuran · perlu pemeriksaan' }, { value: 'clean', label: 'Semua valid' }, { value: 'invalid', label: 'Semua nilai kosong' }]} /></div>
      <div className="workflow-upload"><FileSpreadsheet aria-hidden="true" /><div><h3>{file ? 'Berkas dipilih' : 'Pilih berkas spreadsheet'}</h3><p>.xlsx, .xls, atau .csv. File tetap di perangkat Anda. Batas ukuran upload produksi akan dikonfigurasi dan ditegakkan oleh backend mendatang.</p>{file && <dl className="workflow-file"><div><dt>Nama</dt><dd>{file.name}</dd></div><div><dt>Ukuran</dt><dd>{file.sample ? 'Tidak ada file fisik' : `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(file.size / 1024)} KB`}</dd></div><div><dt>Tipe</dt><dd>{file.sample ? 'Fixture demo' : file.type || 'Tidak dilaporkan oleh browser'}</dd></div></dl>}
      <div className="workflow-actions"><label className="workflow-file-button" aria-disabled={processing}>{file ? 'Ganti file' : 'Pilih file'}<input aria-label={file ? 'Ganti file' : 'Pilih file'} type="file" accept=".xlsx,.xls,.csv" disabled={processing} onChange={event => { const selected = event.target.files?.[0]; if (selected) choose({ name: selected.name, size: selected.size, type: selected.type }); event.target.value = ''; }} /></label><Button variant="outline" disabled={processing} onClick={() => { resetPreview(); setFile({ name: 'Sampel workbook · demo', size: 0, type: '', sample: true }); }}>Gunakan sampel demo</Button>{file && <Button variant="ghost" disabled={processing} onClick={() => { setFile(null); resetPreview(); }}>Hapus pilihan</Button>}</div></div></div>
      <p className="muted-note"><Info className="workflow-inline-icon" /> Isi file pilihan tidak diparsing. Preview selalu menggunakan enam baris sampel workbook, dengan perubahan sesuai skenario yang dipilih.</p>
      {stage === 'setup' && <Button onClick={preview}>Lihat preview demo</Button>}
    </div></section>}
    {error && <div className="workflow-error" role="alert">{error}</div>}
    {stage === 'preview' && <section className="data-panel"><div className="data-panel-heading"><div><h2 id="import-preview-title" tabIndex={-1}>Preview & pemetaan kolom</h2><p>6 baris sampel · kolom template demo, bukan kolom terdeteksi dari file pilihan.</p></div></div><div className="workflow-mapping">{fields.map(f => <SelectField key={f} label={`${fieldLabels[f]} *`} value={mapping[f] || 'none'} onValueChange={value => setMapping({ ...mapping, [f]: value === 'none' ? '' : value })} options={[{ value: 'none', label: 'Belum dipetakan' }, ...fields.map(value => ({ value, label: columns[value] }))]} />)}<div className="workflow-actions"><Button variant="outline" onClick={() => { setMapping(identity); setError(''); }}>Petakan sesuai template</Button><Button onClick={validate}>Periksa sampel</Button></div></div><div className="table-scroll" tabIndex={0} role="region" aria-label="Preview kolom sampel"><table className="data-table workflow-preview"><caption className="sr-only">Nilai sampel sebelum pemetaan</caption><thead><tr>{fields.map(f => <th key={f} scope="col">{columns[f]}</th>)}</tr></thead><tbody>{baseRows.map(r => <tr key={r.id}>{fields.map(f => <td key={f}>{r.raw[f] || 'Kosong'}</td>)}</tr>)}</tbody></table></div></section>}
    {stage === 'validated' && <><ValidationWorkspace key={`${dataset}-${scenario}-${JSON.stringify(mapping)}`} rows={rows} /><section className="workflow-confirm"><div><h2>{valid ? `${valid} baris dapat diproses dalam demo` : 'Validasi belum lolos'}</h2><p>{rows.length - valid} baris perlu tinjauan atau tidak valid dan akan dilewati. Hanya baris valid diproses; tidak ada update/replace data tersimpan.</p></div><div className="workflow-actions"><Button variant="outline" disabled={processing} onClick={() => setStage('preview')}>Kembali ke pemetaan</Button><Dialog open={confirm} onOpenChange={setConfirm}><DialogTrigger asChild><Button disabled={!valid || processing}>{processing ? <><LoaderCircle className="animate-spin" />Memproses demo…</> : 'Konfirmasi demo'}</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Jalankan simulasi import?</DialogTitle><DialogDescription>{valid} dari {rows.length} baris sampel akan dihitung sebagai berhasil; {rows.length - valid} dilewati. Ini bukan hasil pembacaan {file?.name} dan tidak menyimpan data ke database.</DialogDescription></DialogHeader><DialogFooter><DialogClose asChild><Button variant="outline">Batal</Button></DialogClose><Button onClick={run}>Jalankan demo</Button></DialogFooter></DialogContent></Dialog></div>{processing && <p role="status">Simulasi sedang diproses. Tidak ada unggahan ke server.</p>}</section></>}
    {stage === 'done' && <section className="data-panel workflow-result" role="status"><StatusBadge tone="success">Simulasi selesai</StatusBadge><h2 id="import-result-title" tabIndex={-1}>{valid} baris berhasil dalam simulasi</h2><p>{rows.length - valid} baris dilewati. Tidak ada data yang benar-benar diimport atau disimpan. Halaman Validasi Data memiliki sampel demo tersendiri.</p><Button variant="outline" onClick={() => { setFile(null); resetPreview(); }}><RotateCcw />Mulai demo baru</Button></section>}
    {history.length > 0 && <section className="data-panel workflow-history"><div className="data-panel-heading"><div><h2>Aktivitas sesi demo</h2><p>Lima simulasi terbaru selama halaman terbuka. Bukan log produksi.</p></div></div><ul>{history.map((entry, i) => <li key={`${entry.time}-${i}`}><strong>{entry.name}</strong><span>{datasetLabels[entry.dataset]} · {entry.time} · {entry.count} berhasil simulasi, {entry.skipped} dilewati</span></li>)}</ul></section>}
    <p className="data-source">Sumber sampel: {sourceWorkbook} · fact_total_idsd dan fact_skor_pilar; referensi dim_wilayah, dim_waktu, dim_pilar_idsd melalui fixture Phase 3. Duplikat hanya diperiksa dalam sampel, bukan terhadap database.</p>
  </div>;
}
