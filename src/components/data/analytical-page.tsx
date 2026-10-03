"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Info } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { SelectField, StatusBadge } from '@/components/ui-patterns';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { TrendDelta } from '@/components/trend-delta';
import { provinces, regionByCode, matchesQuery } from '@/lib/regions';
import { analyticalModules, analyticalFormat as fmt, seriesValue, sortAnalytical, type AnalyticalData, type AnalyticalModule, type AnalyticalRecord } from '@/lib/analytical';
import { DataFilters, NoResults, Pagination } from './data-controls';
import {ExportControl} from './export-control';

const Chart = dynamic(() => import('@/components/dashboard/analytics-chart'), { ssr: false, loading: () => <p role="status">Memuat grafik…</p> });
const options = (values: string[], all: string) => [{ value: 'all', label: all }, ...values.map(value => ({ value, label: value }))];

function RecordDelta({ record, records }: { record: AnalyticalRecord; records: AnalyticalRecord[] }) {
  if (!record.code) return <span className="trend-delta">— Padanan kode belum pasti</span>;
  if (record.year === null) return <span className="trend-delta">— Tahun belum terisi</span>;
  const current = seriesValue(records, record, record.year);
  if (current === null && record.value !== null) return <span className="trend-delta">— Baris pembanding tidak unik</span>;
  return <TrendDelta current={current} previous={seriesValue(records, record, record.year - 1)} year={record.year} />;
}

function RecordDetail({ record, records, module }: { record: AnalyticalRecord; records: AnalyticalRecord[]; module: AnalyticalModule }) {
  const [open, setOpen] = useState(false);
  const config = analyticalModules[module];
  const related = record.code ? records.filter(r => r.code === record.code && r.sheet === record.sheet && r.indicator === record.indicator && r.period === record.period && r.unit === record.unit && (module !== 'rpjmd' || r.category === record.category) && r.year !== null) : [];
  const years = related.map(r => r.year!);
  const timeline = years.length ? Array.from({ length: Math.max(...years) - Math.min(...years) + 1 }, (_, i) => Math.min(...years) + i) : [];
  return <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button variant="link" aria-label={`Detail ${record.name}, ${record.year ?? 'tahun kosong'}, baris ${record.row}`}>Detail</Button></SheetTrigger>
    <SheetContent className="detail-sheet analytical-detail"><SheetHeader><SheetTitle>{record.name}</SheetTitle><SheetDescription>{config.title} · {record.year ?? 'Tahun belum terisi'}{record.period ? ` · ${record.period}` : ''}</SheetDescription></SheetHeader>
      <div className="detail-body">
        <div className="idsd-score"><span>{record.indicator ?? config.value}</span><strong>{fmt(record.value)}{module === 'rpjmd' && <> – {fmt(record.end)}</>}<small> {record.unit}</small></strong>
          {module === 'rpjmd' ? <p>Nilai awal – nilai akhir · {record.category ?? 'Tipe belum terisi'}. Rentang mengikuti dua kolom sumber, bukan perhitungan capaian.</p> : <><p>{record.category ?? 'Kategori tidak tersedia pada sumber.'}</p><RecordDelta record={record} records={records} /></>}
        </div>
        {record.issues.length > 0 && <div className="analytical-issues"><h3 className="subheading">Catatan sumber</h3><ul>{record.issues.map(issue => <li key={issue}>{issue}</li>)}</ul></div>}
        <dl className="facts"><div><dt>Kode sumber</dt><dd>{record.sourceCode ?? 'Belum terisi'}</dd></div><div><dt>Padanan wilayah</dt><dd>{record.code ? `${record.code} · ${regionByCode.get(record.code)?.name}` : 'Perlu ditinjau; belum dipadankan'}</dd></div><div><dt>Sumber</dt><dd>{record.sheet} · baris {record.row}</dd></div></dl>
        {module === 'poverty' && <dl className="facts"><div><dt>Jumlah penduduk miskin</dt><dd>{fmt(typeof record.raw.jumlah_penduduk_miskin === 'number' ? record.raw.jumlah_penduduk_miskin : null)} ribu</dd></div><div><dt>Garis kemiskinan</dt><dd>{fmt(typeof record.raw.garis_kemiskinan === 'number' ? record.raw.garis_kemiskinan : null)} Rp</dd></div></dl>}
        <section><h3 className="subheading">{module === 'rpjmd' ? 'Riwayat indikator' : 'Tren wilayah'}</h3><p className="muted-note">{module === 'poverty' ? `${record.period}; dibandingkan dengan bulan yang sama tahun sebelumnya. Delta dalam poin persentase.` : 'Hanya seri dan kode wilayah yang sama; tahun kosong tidak diisi.'} Arah angka tidak menyatakan baik/buruk. Pemekaran dapat membatasi perbandingan.</p>
          {record.code && timeline.length ? <>
            {module !== 'rpjmd' && open && <Chart label={`${config.value} ${record.name}. Nilai tersedia pada tabel riwayat.`} option={{ grid: { left: 42, right: 20, top: 22, bottom: 35 }, tooltip: { trigger: 'axis', confine: true, renderMode: 'richText' }, xAxis: { type: 'category', data: timeline.map(String) }, yAxis: { type: 'value' }, series: [{ type: 'line', data: timeline.map(year => seriesValue(records, record, year)), connectNulls: false, lineStyle: { color: '#1769c2' }, itemStyle: { color: '#1769c2' } }] }} />}
            <div className="table-scroll" tabIndex={0} role="region" aria-label="Riwayat nilai, dapat digulir horizontal"><table className="data-table analytical-history"><thead><tr><th scope="col">Tahun</th><th scope="col">{module === 'rpjmd' ? 'Awal / akhir' : 'Nilai'}</th><th scope="col">{module === 'rpjmd' ? 'Tipe / baris' : 'Perubahan'}</th></tr></thead><tbody>{module === 'rpjmd' ? [...related].sort((a,b) => a.year! - b.year!).map(r => <tr key={r.id}><td>{r.year}</td><td>{fmt(r.value)} / {fmt(r.end)}</td><td>{r.category ?? '—'} · {r.row}</td></tr>) : timeline.map(year => <tr key={year}><td>{year}</td><td>{fmt(seriesValue(records, record, year))}</td><td><TrendDelta current={seriesValue(records, record, year)} previous={seriesValue(records, record, year - 1)} year={year} /></td></tr>)}</tbody></table></div>
          </> : <p className="muted-note">Tren tidak dihitung karena pasangan kode atau tahun belum tersedia.</p>}
        </section>
        <details className="analytical-source"><summary>Kolom asli workbook</summary><dl className="facts">{Object.entries(record.raw).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value === null ? 'Tidak terisi' : String(value)}</dd></div>)}</dl></details>
        <p className="source-line">Dataset Dashboard 040526.xlsx · {record.sheet}, baris {record.row}. Nilai 0 dipertahankan; tanda — berarti nilai tidak tersedia. Tidak ada perubahan yang disimpan.</p>
      </div><SheetFooter><SheetClose asChild><Button variant="outline">Tutup detail</Button></SheetClose></SheetFooter>
    </SheetContent></Sheet>;
}

export default function AnalyticalPage({ module, data, defaults }: { module: AnalyticalModule; data: AnalyticalData; defaults:{year:number;province:string;pageSize:number} }) {
  const config = analyticalModules[module];
  const rp = module === 'rpjmd';
  const [sheet, setSheet] = useState<string>(rp?config.sheet:'all');
  const [year, setYear] = useState(String(defaults.year));
  const [period, setPeriod] = useState('Maret');
  const [province, setProvince] = useState(defaults.province);
  const [indicator, setIndicator] = useState('all');
  const [category, setCategory] = useState('all');
  const [quality, setQuality] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const records = data.records.filter(r => sheet === 'all' || r.sheet === sheet);
  const years = [...new Set(records.flatMap(r => r.year === null ? [] : [r.year]))].sort((a,b) => b-a);
  const categories = [...new Set(records.flatMap(r => r.category ? [r.category] : []))].sort();
  const indicators = [...new Set(records.flatMap(r => r.indicator ? [r.indicator] : []))].sort();
  const filtered = records.filter(r => (year === 'all' || (year === 'missing' ? r.year === null : r.year === Number(year))) && (module !== 'poverty' || r.period === period) && (province === 'all' || (province === 'unmatched' ? r.code === null : r.code === province)) && (indicator === 'all' || (indicator === 'missing' ? !r.indicator : r.indicator === indicator)) && (category === 'all' || (category === 'missing' ? !r.category : r.category === category)) && (quality === 'all' || (quality === 'missing' ? r.value === null || (rp && r.end === null) : r.issues.length > 0)) && matchesQuery(query, r.name, r.sourceCode ?? '', r.code ? regionByCode.get(r.code)?.name ?? '' : ''));
  const canSortValues = !rp || (new Set(filtered.map(r => r.indicator)).size === 1 && new Set(filtered.map(r => r.unit)).size === 1 && new Set(filtered.map(r => r.category)).size === 1);
  const effectiveSort = !canSortValues && ['high','low'].includes(sort) ? 'name' : sort;
  const rows = sortAnalytical(filtered, effectiveSort);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / defaults.pageSize)));
  const filled = rows.filter(r => r.value !== null && (!rp || r.end !== null));
  const mapped = new Set(rows.flatMap(r => r.code ? [r.code] : []));
  function change(action: () => void) { action(); setPage(1); }
  function reset() { setSheet(rp?config.sheet:'all'); setYear(String(defaults.year)); setPeriod('Maret'); setProvince(defaults.province); setIndicator('all'); setCategory('all'); setQuality('all'); setQuery(''); setSort('name'); setPage(1); }
  return <div className="data-page analytical-page"><PageHeader title={config.title} parent="Kelola Data" description={config.description} actions={<ExportControl dataset={module} filters={{year,province,indicator,category,quality,q:query,sheet,sort:effectiveSort,...(module==='poverty'?{period}:{})}}/>}/>
    <div className="data-notice"><Info aria-hidden="true" /><p>Data tersedia pada tingkat provinsi. Tidak ada nilai kabupaten/kota pada sheet ini. Filter provinsi hanya memakai kode yang selaras dengan master; baris bermasalah tersedia melalui “Belum dipadankan”.</p></div>
    <DataFilters query={query} onQuery={value => change(() => setQuery(value))} onReset={reset} summary={`${year === 'all' ? 'Semua tahun' : year === 'missing' ? 'Tahun belum terisi' : year}${module === 'poverty' ? ` · ${period}` : ''} · Provinsi · ${rows.length} baris sesuai filter`}>
      {rp && <SelectField label="Sheet sumber" value={sheet} onValueChange={value => change(() => { setSheet(value); setYear('all'); setProvince('all'); setIndicator('all'); setCategory('all'); setSort('name'); })} options={[{value:'fact_rpjmd_prov',label:'Fakta RPJMD provinsi'},{value:'fact_rpjmd_prov_master',label:'Master RPJMD provinsi'}]} />}
      <SelectField label={rp ? 'Tahun kinerja' : 'Tahun'} value={year} onValueChange={value => change(() => setYear(value))} options={[...options(years.map(String), 'Semua tahun'), ...(records.some(r=>r.year===null) ? [{value:'missing',label:'Tahun belum terisi'}] : [])]} />
      {module === 'poverty' && <SelectField label="Periode" value={period} onValueChange={value => change(() => setPeriod(value))} options={[{value:'Maret',label:'Maret'},{value:'September',label:'September'}]} />}
      <SelectField label="Provinsi" value={province} onValueChange={value => change(() => setProvince(value))} options={[{value:'all',label:'Semua provinsi'}, ...provinces.map(r=>({value:r.code,label:r.name})), {value:'unmatched',label:'Belum dipadankan'}]} />
      {rp && <SelectField label="Indikator" value={indicator} onValueChange={value => change(() => { setIndicator(value); setSort('name'); })} options={[...options(indicators,'Semua indikator'),{value:'missing',label:'Indikator belum terisi'}]} />}
      {module !== 'poverty' && <SelectField label={config.category} value={category} onValueChange={value => change(() => { setCategory(value); setSort('name'); })} options={[...options(categories,`Semua ${config.category.toLowerCase()}`), ...(records.some(r=>!r.category) ? [{value:'missing',label:'Belum terisi'}] : [])]} />}
      <SelectField label="Ketersediaan & catatan" value={quality} onValueChange={value => change(() => setQuality(value))} options={[{value:'all',label:'Semua baris'},{value:'missing',label:'Nilai belum tersedia'},{value:'notes',label:'Dengan catatan sumber'}]} />
    </DataFilters>
    <div className="data-overview"><div><strong>{rows.length}</strong><span>Baris sesuai filter</span></div><div><strong>{filled.length}<small> / {rows.length}</small></strong><span>{rp ? 'Nilai awal & akhir terisi' : 'Nilai tersedia'}</span></div><div><strong>{mapped.size}</strong><span>Provinsi dengan padanan kode pasti</span></div></div>
    {module === 'poverty' && <p className="analytical-context">Jumlah penduduk dalam ribu dan garis kemiskinan dalam Rp mengikuti kemiskinan_raw. {data.rawNote} Delta memakai bulan yang sama tahun sebelumnya; tidak memberi penilaian baik/buruk.</p>}
    {rp && <p className="analytical-context">Nilai awal dan akhir ditampilkan apa adanya. Tidak dijumlahkan lintas indikator atau satuan. Fakta dan master ditampilkan terpisah, tanpa menggabungkan baris.</p>}
    <section className="data-panel"><div className="data-panel-heading"><div><h2>{rp ? 'Indikator RPJMD provinsi' : config.value}</h2><p>{sheet} · {rows.filter(r=>r.issues.length).length} baris dengan catatan sumber</p></div><div className="data-sort-field"><SelectField label="Urutkan" value={effectiveSort} onValueChange={value => change(() => setSort(value))} options={[{value:'name',label:'Nama wilayah A–Z'},{value:'year',label:'Tahun terbaru'}, ...(canSortValues ? [{value:'high',label:rp?'Nilai awal tertinggi':'Nilai tertinggi'},{value:'low',label:rp?'Nilai awal terendah':'Nilai terendah'}] : [])]} /></div></div>
      <p className="analytical-table-hint">Geser tabel untuk melihat seluruh kolom. Pilih Detail untuk riwayat dan kolom sumber.{rp && !canSortValues ? ' Urutan nilai tersedia setelah memilih satu indikator, satuan, dan tipe yang sama.' : ''}</p>
      {rows.length ? <div className="table-scroll" tabIndex={0} role="region" aria-label={`Tabel ${config.title}, dapat digulir horizontal`}><table className="data-table analytical-table"><caption className="sr-only">{config.title}, sumber {sheet}</caption><thead><tr><th scope="col">Wilayah / kode sumber</th><th scope="col">{rp ? 'Tahun kinerja' : 'Tahun / periode'}</th>{rp && <th scope="col">Indikator / satuan</th>}<th scope="col" className="number-cell">{config.value}</th>{rp && <th scope="col" className="number-cell">Nilai akhir</th>}{module === 'poverty' ? <><th scope="col" className="number-cell">Jumlah (ribu)</th><th scope="col" className="number-cell">Garis (Rp)</th></> : <th scope="col">{config.category}</th>}<th scope="col">Sumber / detail</th></tr></thead><tbody>{rows.slice((currentPage-1)*defaults.pageSize,currentPage*defaults.pageSize).map(r=><tr key={r.id}><td><span className="table-primary">{r.name}</span><span className="table-secondary">{r.sourceCode ?? 'Kode kosong'}</span>{!r.code && <span className="record-note">Belum dipadankan</span>}{r.issues.length > 0 && <span className="table-secondary">{r.issues.length} catatan sumber</span>}</td><td>{r.year ?? 'Belum terisi'}{r.period && <span className="table-secondary">{r.period}</span>}</td>{rp && <td>{r.indicator ?? 'Belum terisi'}<span className="table-secondary">{r.unit ?? 'Satuan belum terisi'}</span></td>}<td className="number-cell score-cell">{fmt(r.value)}{!rp && <RecordDelta record={r} records={records} />}</td>{rp && <td className="number-cell score-cell">{fmt(r.end)}</td>}{module === 'poverty' ? <><td className="number-cell">{fmt(typeof r.raw.jumlah_penduduk_miskin === 'number' ? r.raw.jumlah_penduduk_miskin : null)}</td><td className="number-cell">{fmt(typeof r.raw.garis_kemiskinan === 'number' ? r.raw.garis_kemiskinan : null)}</td></> : <td><StatusBadge>{r.category ?? 'Belum terisi'}</StatusBadge></td>}<td><span className="table-source">Baris {r.row}</span><RecordDetail record={r} records={records} module={module} /></td></tr>)}</tbody></table></div> : <NoResults onReset={reset} />}
      <Pagination page={currentPage} total={rows.length} size={defaults.pageSize} onPage={setPage} />
    </section>
    {rp && <details className="analytical-metadata"><summary>Metadata indikator & catatan ekstraksi</summary><p>dim_indikator_rpjmd berisi Indeks Modal Manusia. Tidak tersedia kunci relasi ke indikator pada dua sheet fakta; metadata ini tidak dipaksakan menjadi pasangan.</p>{data.definitions?.map((definition,i)=><dl className="facts" key={i}>{Object.entries(definition).map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value === null ? 'Tidak terisi' : String(value)}</dd></div>)}</dl>)}<p>{data.excluded.length} baris anotasi master dikecualikan dari observasi: {data.excluded.map(r=>r.row).join(', ')}. Baris fakta yang belum lengkap tetap dapat dilihat melalui filter tahun/indikator belum terisi.</p></details>}
    <p className="data-source">Dataset Dashboard 040526.xlsx · {sheet} · dim_wilayah · dim_waktu{rp ? ' · dim_indikator_rpjmd' : module === 'poverty' ? ' · kemiskinan_raw' : ''}. Tahun mengikuti fakta, termasuk yang belum tercakup pada dim_waktu. Tabel membaca database terkini; hasil import yang telah disetujui tersedia setelah halaman dimuat ulang.</p>
  </div>;
}
