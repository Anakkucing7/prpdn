"use client";

import idsdFixture from '@/data/idsd.json';
import { TrendDelta } from "@/components/trend-delta";
import { deltaText } from "@/lib/trend";
import { regions } from "@/lib/regions";
import { RegionLevel, RegionalControls } from '@/components/data/regional-controls';
import { matchesRegion } from '@/lib/regional-filter';
import { idsdObservation } from '@/lib/idsd-observations';
import { useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { ArrowDownWideNarrow, ArrowUpRight, BookOpen, ChevronDown, CircleHelp, RotateCcw, SlidersHorizontal } from "lucide-react";
import type { EChartsOption } from "echarts";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectField, StatusBadge } from "@/components/ui-patterns";
import { YearMultiSelect } from "@/components/data/year-multi-select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { data, format, hasValue, mapColors, mean, metricKeys, metrics, observation, type Metric } from "@/lib/dashboard";

const ProvinceMap = dynamic(() => import("./province-map"), { ssr: false, loading: () => <Skeleton className="map-loading" aria-label="Memuat peta provinsi" /> });
const AnalyticsChart = dynamic(() => import("./analytics-chart"), { ssr: false, loading: () => <Skeleton className="analytics-chart" aria-label="Memuat grafik" /> });

function Panel({ title, description, action, children, className = "" }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={`dashboard-panel ${className}`}><header className="panel-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</header>{children}</section>;
}

function Methodology() {
  return <Dialog><DialogTrigger asChild><Button variant="outline"><BookOpen />Sumber & metodologi</Button></DialogTrigger>
    <DialogContent className="methodology-dialog"><DialogHeader><DialogTitle>Sumber & metodologi</DialogTitle><DialogDescription>Ringkasan analitis dari {data.workbook}. Sumber tidak mencantumkan waktu pembaruan.</DialogDescription></DialogHeader>
      <div className="methodology-content" tabIndex={0} role="region" aria-label="Penjelasan sumber dan metodologi">
        <h3>Cakupan dan agregasi</h3><p>Dashboard menampilkan 38 provinsi pada master wilayah saat ini, untuk tahun 2022–2024. Mode kabupaten/kota menggunakan IDSD dengan padanan kode pasti; duplikat identik digabung dan konflik ditandai kosong. KFD, EPPD, dan kemiskinan belum tersedia pada fixture tingkat kabupaten/kota.</p>
        <p>Rata-rata adalah rerata sederhana provinsi dengan nilai numerik, tanpa bobot penduduk. Angka ini bukan indeks nasional atau persentase kemiskinan nasional. Nilai kosong tidak dianggap nol. Peringkat mengikuti nilai numerik, bukan penilaian kinerja lintas indikator.</p>
        <h3>Tren dan pilar</h3><p>Garis pembanding IDSD memakai {data.regions.filter(r => data.years.every(y => observation("idsd", y, r.code, "Maret")?.value != null)).length} kode provinsi yang memiliki nilai pada ketiga tahun. Pemekaran Papua tetap membatasi keterbandingan wilayah dari waktu ke waktu. Profil pilar memakai provinsi yang tersedia pada tahun terpilih, pada skala 0–5.</p>
        <p>Dalam fixture, 36 baris pilar bernama MALUKU UTARA dipetakan dari kode 81 ke 82 sesuai nama pada master. Nilai skor dan workbook asli tidak diubah. Semua nomor baris koreksi disimpan bersama fixture.</p>
        <h3>Peta dan kelengkapan</h3><p>Batas dari BIG edisi Juni 2026, memakai kode Kemendagri/PUM yang sama dengan master. Batas provinsi digabung dari kabupaten/kota lalu disederhanakan untuk tampilan. Latar Indonesia memakai Natural Earth. Geometri untuk eksplorasi, bukan penegasan batas hukum.</p>
        <p>Cakupan = jumlah provinsi dengan nilai numerik ÷ 38 provinsi master saat ini. Angka cakupan tidak menyatakan data sudah tervalidasi. KFD dan EPPD masih menggunakan cakupan 34 provinsi; Bengkulu 2024 berstatus Tidak Dinilai pada EPPD. Periode Maret dan September kemiskinan dipisahkan.</p>
        <h3>Sheet yang digunakan</h3><p className="source-line">dim_wilayah · dim_waktu · dim_pilar_idsd · fact_total_idsd · fact_skor_pilar · fact_kfd · fact_eppd · fact_kemiskinan</p>
      </div>
    </DialogContent>
  </Dialog>;
}

export function DashboardLoading() {
  return <div role="status" aria-label="Memuat dashboard"><PageHeader title="Dashboard" description="Menyiapkan ringkasan indikator pembangunan daerah." parent="Ringkasan" /><Skeleton className="dashboard-loading-filters" /><div className="kpi-grid">{[1, 2, 3, 4].map(n => <Skeleton key={n} className="dashboard-loading-kpi" />)}</div><Skeleton className="map-loading" /></div>;
}

export default function Dashboard() {
  const searchParams = useSearchParams();
  const year = data.years.includes(Number(searchParams.get("year"))) ? Number(searchParams.get("year")) : 2024;
  const metric: Metric = metricKeys.includes(searchParams.get("indicator") as Metric) ? searchParams.get("indicator") as Metric : "idsd";
  const level = searchParams.get('level') === 'KABKOTA' ? 'KABKOTA' : 'PROV';
  const parent = regions.some(r => r.level === 'PROV' && r.code === searchParams.get('parent')) ? searchParams.get('parent')! : 'all';
  const kind = ['KAB','KOTA'].includes(searchParams.get('kind') ?? '') ? searchParams.get('kind')! : 'all';
  const scope = regions.filter(r => matchesRegion(r,level,parent,kind)).map(r => ({...r,label:r.name}));
  const codeParam = searchParams.get('region') ?? searchParams.get('province');
  const code = scope.some(r => r.code === codeParam) ? codeParam! : 'all';
  const period = searchParams.get('period') === 'Maret' ? 'Maret' : 'September';
  const selected = scope.find(r => r.code === code);
  const levelLabel = level === 'PROV' ? 'provinsi' : 'kabupaten/kota';
  function recordFor(k: Metric, y: number, c: string, p: string) {
    if (level === 'PROV') return observation(k,y,c,p);
    const record = k === 'idsd' ? idsdObservation(c,y) : undefined;
    return record ? {value:record.value,sourceRow:record.rows.join(', '),category:null} : undefined;
  }
  const scopedValues = (k: Metric, y: number, p: string) => scope.map(r => ({...r,value:recordFor(k,y,r.code,p)?.value ?? null}));
  const [showAll, setShowAll] = useState(false);
  const [ascending, setAscending] = useState(false);
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [comparisonYears, setComparisonYears] = useState<number[]>([year]);
  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    if (key === 'level') { params.delete('parent'); params.delete('kind'); }
    if (['level','parent','kind'].includes(key)) { params.delete('region'); params.delete('province'); setQuery(''); }

    window.history.pushState(null, "", `?${params}`);
  }
  function reset() { window.history.pushState(null, "", window.location.pathname); setQuery(""); setAscending(false); setShowAll(false); setComparisonYears([2024]); }

  const definition = metrics[metric];
  const rows = scopedValues(metric, year, period);
  const visibleMapYears = comparisonYears.filter(value => data.years.includes(value)).slice(-3);
  function selectMapYear(value: number) { if (visibleMapYears.includes(value)) setFilter('year',String(value)); }
  function toggleMapYear(value: number) {
    if (visibleMapYears.includes(value)) {
      if (visibleMapYears.length === 1) return;
      const next = visibleMapYears.filter(item => item !== value);
      setComparisonYears(next);
      if (value === year) setFilter('year',String(next.at(-1)));
    } else if (visibleMapYears.length < 3) { setComparisonYears([...visibleMapYears, value].sort((a,b) => a-b)); setFilter('year',String(value)); }
  }
  const mapDescriptions = Object.fromEntries(scope.map(region => {
    const values = visibleMapYears.map(value => `${value}: ${format(recordFor(metric, value, region.code, period)?.value)} ${definition.unit}`);
    return [region.code, [definition.label, ...values].join('\n')];
  }));
  const available = rows.filter(hasValue);
  const sorted = [...available].sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "id"));
  const high = sorted[0];
  const low = sorted.at(-1);
  const min = low?.value ?? 0;
  const max = high?.value ?? 1;
  const average = mean(available.map(r => r.value));
  const previousRows = scopedValues(metric, year - 1, period).filter(hasValue);
  const sameCoverage = previousRows.length === available.length && available.every(r => previousRows.some(p => p.code === r.code));
  const previousAverage = sameCoverage ? mean(previousRows.map(r => r.value)) : null;
  const selectedValue = selected ? recordFor(metric, year, code, period)?.value : null;
  const ordered = [...rows].sort((a, b) => a.value === null ? b.value === null ? a.label.localeCompare(b.label, "id") : 1 : b.value === null ? -1 : (ascending ? a.value - b.value : b.value - a.value) || a.label.localeCompare(b.label, "id"));
  const ranked = ordered.filter(r => r.label.toLocaleLowerCase("id").includes(query.trim().toLocaleLowerCase("id"))).slice(0, showAll ? rows.length : 5);
  const rankOf = (value: number | null) => value === null ? "—" : 1 + available.filter(r => ascending ? r.value < value : r.value > value).length;
  const cohort = scope.filter(r => data.years.every(y => recordFor("idsd", y, r.code, period)?.value != null));
  const trend = data.years.map(y => ({ year: y, average: mean(cohort.map(r => recordFor("idsd", y, r.code, period)!.value!)), selected: selected ? recordFor("idsd", y, code, period)?.value ?? null : null }));
  const pillarSets: Record<string, { id:number;value:number|null;conflict:boolean;mapped:boolean }[]> = idsdFixture.pillars;
  const pillarValues = data.pillarDefinitions.map(p => ({ ...p, value: level === 'KABKOTA'
    ? mean(scope.filter(r => !selected || r.code === code).flatMap(r => { const item = pillarSets[`${r.code}:${year}`]?.find(v => v.id === p.id && !v.conflict && !v.mapped); return item?.value == null ? [] : [item.value]; }))
    : mean(data.pillars.filter(r => r.year === year && r.pillar === p.id && scope.some(s => s.code === r.code) && (!selected || r.code === code)).map(r => r.value)) }));
  const scatter = scope.map(r => ({ ...r, x: recordFor("kfd", year, r.code, period)?.value, y: recordFor("poverty", year, r.code, period)?.value })).filter((r): r is typeof r & { x: number; y: number } => r.x != null && r.y != null);
  const xMean = mean(scatter.map(r => r.x)) ?? 0;
  const yMean = mean(scatter.map(r => r.y)) ?? 0;
  const denominator = Math.sqrt(scatter.reduce((s, r) => s + (r.x - xMean) ** 2, 0) * scatter.reduce((s, r) => s + (r.y - yMean) ** 2, 0));
  const correlation = scatter.length > 1 && denominator > 0 ? scatter.reduce((s, r) => s + (r.x - xMean) * (r.y - yMean), 0) / denominator : null;
  const axes = { axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: "#697386", fontSize: 12 }, splitLine: { lineStyle: { color: "#edf0f5" } } };
  const trendOption: EChartsOption = {
    grid: { left: 40, right: 18, top: 24, bottom: 32 },
    tooltip: { trigger: "axis", confine: true, renderMode: "richText", formatter: params => {
      const items = Array.isArray(params) ? params : [params];
      const point = trend[items[0]?.dataIndex ?? 0];
      if (!point) return '';
      const prior = trend.find(t => t.year === point.year - 1);
      return [String(point.year), ...items.map(item => { const value = item.seriesIndex === 0 ? point.average : point.selected; const previous = item.seriesIndex === 0 ? prior?.average : prior?.selected; return `${item.seriesName}: ${format(value)}\n${deltaText(value, previous, point.year - 1)}`; })].join('\n');
    } },
    xAxis: { ...axes, type: "category", data: data.years.map(String), boundaryGap: true },
    yAxis: { ...axes, type: "value", min: 0, max: 5, interval: 1 },
    series: [{ name: `Rerata ${cohort.length} ${levelLabel}`, type: "line", data: trend.map(r => r.average), symbolSize: 7, lineStyle: { width: 2, type: selected ? "dashed" : "solid" }, itemStyle: { color: selected ? "#91a8ba" : "#1769c2" },
      markLine: { silent: true, symbol: "none", label: { show: false }, lineStyle: { color: "#b8c8d8", type: "dotted" }, data: [{ xAxis: String(year) }] } },
      ...(selected ? [{ name: selected.label, type: "line" as const, data: trend.map(r => r.selected), symbolSize: 8, connectNulls: false, itemStyle: { color: "#1769c2" }, lineStyle: { width: 3 } }] : [])],
  };
  const scatterOption: EChartsOption = {
    grid: { left: 48, right: 20, top: 24, bottom: 46 },
    tooltip: { confine: true, trigger: "item", formatter: params => {
      const p = Array.isArray(params) ? params[0] : params;
      const point = scatter[p.dataIndex];
      return `${point.label}<br/>KFD: ${format(point.x)}<br/>Kemiskinan: ${format(point.y)}%`;
    } },
    xAxis: { ...axes, type: "value", name: "KFD (rasio)", nameLocation: "middle", nameGap: 30, min: 0 },
    yAxis: { ...axes, type: "value", name: "Kemiskinan (%)", nameTextStyle: { align: "left" }, min: 0 },
    series: [{ type: "scatter", symbolSize: 9, data: scatter.map(r => ({ value: [r.x, r.y], itemStyle: { color: r.code === code ? "#0b2743" : "#458abd", opacity: r.code === code ? 1 : 0.75, borderColor: "#fff", borderWidth: 1 } })) }],
  };

  return <div className="dashboard">
    <PageHeader title="Dashboard" description="Pantau indikator pembangunan dan ketersediaan data wilayah." parent="Ringkasan" actions={<Methodology />} />
    <RegionLevel value={level} onChange={v => setFilter("level",v)} /><div className="mobile-filter-bar"><Button variant="outline" aria-expanded={filtersOpen} aria-controls="dashboard-filters" onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal />Filter dashboard<ChevronDown className={filtersOpen ? "rotate-180" : ""} /></Button><span>{year} · {definition.label} · {selected?.label ?? `Semua ${levelLabel}`}</span></div>
    <div id="dashboard-filters" className="dashboard-filters" data-open={filtersOpen} aria-label="Filter dashboard">
      <YearMultiSelect years={[...data.years].reverse()} selected={visibleMapYears} onToggle={toggleMapYear} />
      <SelectField label="Indikator peta & peringkat" value={metric} onValueChange={v => setFilter("indicator", v)} options={metricKeys.map(k => ({ value: k, label: metrics[k].label }))} />
      <RegionalControls level={level} province={parent} kind={kind} selected={code} onChange={(field,v) => setFilter(field==='province'?'parent':field,v)} />
      <SelectField label="Periode kemiskinan" value={period} onValueChange={v => setFilter("period", v)} options={[{ value: "Maret", label: "Maret" }, { value: "September", label: "September" }]} />
      <Button variant="ghost" onClick={reset}><RotateCcw />Reset</Button>
    </div>
    <p className="dashboard-context" aria-live="polite">Tingkat {levelLabel} · {year} · {definition.name}{metric === "poverty" ? ` · ${period}` : ""}{selected ? ` · Profil ${selected.label}` : " · Seluruh Indonesia"}</p>
    {level === "KABKOTA" && <p className="data-notice">IDSD memakai padanan kode pasti. KFD, EPPD, dan kemiskinan kabupaten/kota belum tersedia pada data dashboard; nilai tidak diturunkan dari provinsi.</p>}
    <div className="kpi-grid">
      <div className="kpi"><p>{selected ? `${definition.label} · ${selected.label}` : `Cakupan ${definition.label}`}</p><strong>{selected ? format(selectedValue) : <>{available.length}<span> / {rows.length}</span></>}</strong><small>{selected ? selectedValue == null ? "Data belum tersedia" : definition.unit : `${levelLabel} dengan nilai tersedia`}</small>{selected && <TrendDelta current={selectedValue} previous={recordFor(metric, year - 1, code, period)?.value} year={year} />}</div>
      <div className="kpi"><p>Rata-rata {levelLabel}</p><strong>{format(average)}<span>{metric === "poverty" ? "%" : ""}</span></strong><small>{available.length ? `Rerata tanpa bobot · ${available.length} ${levelLabel}` : "Belum ada nilai numerik"}</small><TrendDelta current={average} previous={previousAverage} year={year} />{!sameCoverage && <small>Cakupan pembanding berbeda/kosong.</small>}</div>
      <div className="kpi"><p>Nilai tertinggi</p><strong>{format(high?.value)}<span>{metric === "poverty" ? "%" : ""}</span></strong><small>{high?.label ?? "Data belum tersedia"}</small><TrendDelta current={high?.value} previous={high ? recordFor(metric, year - 1, high.code, period)?.value : null} year={year} /></div>
      <div className="kpi"><p>Nilai terendah</p><strong>{format(low?.value)}<span>{metric === "poverty" ? "%" : ""}</span></strong><small>{low?.label ?? "Data belum tersedia"}</small><TrendDelta current={low?.value} previous={low ? recordFor(metric, year - 1, low.code, period)?.value : null} year={year} /></div>
    </div>

    <div className="spatial-grid">
      <Panel title={`Peta ${definition.label}`} description={`${year}${metric === "poverty" ? ` · ${period}` : ""} · Pilih wilayah untuk melihat profil`} className="map-panel" action={<StatusBadge>{available.length}/{rows.length} tersedia</StatusBadge>}>
        <ProvinceMap rows={rows} regions={scope} selected={code} onSelect={v => setFilter("region", v)} min={min} max={max} label={definition.label} unit={definition.unit} year={year} comparisonYears={visibleMapYears} onMapYearChange={selectMapYear} descriptions={mapDescriptions} />
        <div className="map-legend"><span>{definition.unit}</span><div className="legend-scale"><span>{format(available.length ? min : null)}</span><div>{mapColors.map(color => <i key={color} style={{ background: color }} />)}</div><span>{format(available.length ? max : null)}</span></div><span className="no-data-key"><i />Tidak tersedia</span></div>
        <p className="map-note"><CircleHelp aria-hidden="true" />{scope.filter(r => r.boundary).length} batas {levelLabel} dari BIG Juni 2026, disederhanakan. Klik poligon untuk memilih wilayah.</p>
      </Panel>
      <Panel title={`Peringkat ${levelLabel}`} description={`${definition.label} · ${ascending ? "Nilai terendah dahulu" : "Nilai tertinggi dahulu"}`} action={<Button variant="ghost" size="icon" aria-label={ascending ? "Urutkan nilai tertinggi" : "Urutkan nilai terendah"} title="Ubah urutan nilai" onClick={() => setAscending(!ascending)}><ArrowDownWideNarrow /></Button>}>
        <div className="ranking-toolbar"><div className="segment-control" aria-label="Jumlah peringkat"><button aria-pressed={!showAll} onClick={() => { setShowAll(false); setQuery(""); }}>5 wilayah</button><button aria-pressed={showAll} onClick={() => setShowAll(true)}>Semua ({rows.length})</button></div>{showAll && <Input aria-label="Cari wilayah di peringkat" placeholder="Cari wilayah…" value={query} onChange={e => setQuery(e.target.value)} />}</div>
        <div className="ranking-list" data-expanded={showAll} tabIndex={0} aria-label="Daftar peringkat, pilih wilayah"><table><thead><tr><th scope="col">#</th><th scope="col">Wilayah</th><th scope="col">{definition.unit}</th></tr></thead><tbody>{ranked.map(r => <tr key={r.code} data-selected={r.code === code}><td>{rankOf(r.value)}</td><td><button onClick={() => setFilter("region", r.code)} aria-pressed={r.code === code}>{r.label}</button><span className="rank-track" aria-hidden="true"><i style={{ width: `${r.value == null || max === 0 ? 0 : Math.max(0, r.value / max * 100)}%` }} /></span></td><td>{format(r.value)}</td></tr>)}</tbody></table>{!ranked.length && <p className="chart-empty">Tidak ada wilayah yang cocok.</p>}</div>
        <p className="panel-footnote">{metric === "poverty" ? "Persentase lebih tinggi berarti kemiskinan lebih tinggi." : "Urutan nilai numerik pada tahun terpilih."} Klik nama untuk membuka profil.</p>
      </Panel>
    </div>

    <section className="province-brief" aria-label="Ringkasan indikator wilayah">
      <div className="brief-heading"><h2>{selected?.label ?? `Ringkasan ${levelLabel}`}</h2><p>{selected ? `Kode ${code} · ${selected.island}` : `Rerata sederhana ${levelLabel} yang tersedia`}</p>{selected && <Sheet><SheetTrigger asChild><Button variant="link">Detail sumber<ArrowUpRight /></Button></SheetTrigger><SheetContent className="detail-sheet"><SheetHeader><SheetTitle>{selected.name}</SheetTitle><SheetDescription>Nilai indikator {year} · kemiskinan {period}</SheetDescription></SheetHeader><div className="detail-body"><dl className="facts">{metricKeys.map(k => { const record = recordFor(k, year, code, period); return <div key={k}><dt>{metrics[k].label}</dt><dd><strong>{format(record?.value)} {record?.value == null ? "" : metrics[k].unit}</strong><p>{record?.category}</p><p className="source-line">{metrics[k].sheet}{record ? `, baris ${record.sourceRow}` : " · Tidak ada record"}</p></dd></div>; })}</dl><p className="source-line">{data.workbook}<br/>dim_wilayah, baris {selected.sourceRow}</p><p className="muted-note">{selected.boundary ? "Batas dapat dibaca; belum diverifikasi secara topologis." : "Batas tidak lengkap. Peta menggunakan titik lokasi dari master."}</p></div></SheetContent></Sheet>}</div>
      <div className="brief-metrics">{metricKeys.map(k => { const list = scopedValues(k, year, period).filter(hasValue); const value = selected ? recordFor(k, year, code, period)?.value : mean(list.map(r => r.value)); return <div key={k}><span>{metrics[k].label}</span><strong>{format(value)}{k === "poverty" && value != null ? <small>%</small> : null}</strong><small>{selected ? value == null ? "Tidak tersedia" : metrics[k].unit : `${list.length} ${levelLabel}`}{k === "poverty" ? ` · ${period}` : ""}</small></div>; })}</div>
    </section>

    <div className="analytics-grid">
      <Panel title="Tren IDSD" description={`2022–2024 · ${selected?.label ?? `Rerata ${cohort.length} ${levelLabel} dengan kode yang sama`}`}>
        <div className="chart-legend"><span><i />{selected?.label ?? `Rerata ${cohort.length} ${levelLabel}`}</span>{selected && <span><i className="secondary-series" />Rerata {cohort.length} {levelLabel}</span>}<span>Skala 0–5</span></div>
        <AnalyticsChart option={trendOption} label={`Tren skor IDSD 2022–2024 untuk ${selected?.label ?? "rerata provinsi"}. Nilai tersedia pada tabel di bawah grafik.`} />
        <p className="panel-footnote">Garis vertikal: tahun {year}. Delta membandingkan tahun sebelumnya, dengan periode yang sama. Warna netral: arah baik/buruk belum ditetapkan. Pemekaran Papua membatasi perbandingan antarwaktu.</p>
        <details className="chart-data"><summary>Lihat angka tren</summary><div className="chart-table-scroll" tabIndex={0} role="region" aria-label="Tabel angka tren, dapat digulir horizontal"><table><thead><tr><th>Tahun</th><th>Rerata {cohort.length} {levelLabel}</th>{selected && <th>{selected.label}</th>}<th>Perubahan dari tahun sebelumnya</th></tr></thead><tbody>{trend.map(t => <tr key={t.year}><td>{t.year}</td><td>{format(t.average)}</td>{selected && <td>{format(t.selected)}</td>}<td><TrendDelta current={selected ? t.selected : t.average} previous={selected ? trend.find(p => p.year === t.year - 1)?.selected : trend.find(p => p.year === t.year - 1)?.average} year={t.year} /></td></tr>)}</tbody></table></div></details>
      </Panel>
      <Panel title="Profil 12 pilar IDSD" description={`${year} · ${selected?.label ?? `Rerata ${levelLabel} yang tersedia`}`} action={<span className="unit-label">Skala 0–5</span>}>
        <div className="pillar-list">{pillarValues.map(p => <div key={p.id} className="pillar-row"><span title={p.group}><small>{p.id}</small>{p.name}</span><span className="pillar-track" aria-hidden="true"><i style={{ width: `${(p.value ?? 0) / 5 * 100}%` }} /></span><strong>{format(p.value)}</strong></div>)}</div>
        <p className="panel-footnote">{level === "KABKOTA" ? "Pilar kabupaten/kota hanya memakai padanan kode pasti tanpa konflik; lihat Data IDSD untuk rincian sumber. " : ""}Empat komponen: lingkungan pendukung, SDM, pasar, dan ekosistem inovasi. Nilai kosong ditandai —.</p>
      </Panel>
      <Panel title="Cakupan data" description={`${year} · Ketersediaan nilai pada ${rows.length} ${levelLabel}`}>
        <div className="coverage-list">{metricKeys.map(k => { const count = scopedValues(k, year, period).filter(hasValue).length; return <div key={k}><div><span>{metrics[k].label}{k === "poverty" ? ` · ${period}` : ""}</span><strong>{count}<small> / {rows.length}</small></strong></div><progress value={count} max={rows.length} aria-label={`Cakupan ${metrics[k].label}: ${count} dari ${rows.length} ${levelLabel}`} /><p>{count === rows.length ? "Seluruh wilayah memiliki nilai" : `${rows.length - count} ${levelLabel} tanpa nilai numerik`}</p></div>; })}</div>
        <div className="coverage-note"><CircleHelp aria-hidden="true" /><p>Cakupan menunjukkan ketersediaan, bukan status validasi. Perubahan jumlah provinsi dan periode pelaporan memengaruhi kelengkapan.</p></div>
      </Panel>
      <Panel title="KFD dan kemiskinan" description={`${year} · Kemiskinan ${period} · ${scatter.length} pasangan wilayah`} action={<span className="correlation">r = {format(correlation)}</span>}>
        {scatter.length ? <AnalyticsChart option={scatterOption} label={`Sebaran rasio KFD dan persentase kemiskinan ${period} ${year}, ${scatter.length} provinsi, korelasi Pearson ${format(correlation)}. Angka tersedia pada tabel.`} /> : <div className="chart-empty"><strong>Pasangan data belum tersedia</strong><p>Data kemiskinan {period} {year} belum memiliki nilai numerik yang dapat dipasangkan dengan KFD.</p>{level === "PROV" && <Button variant="outline" onClick={() => setFilter("period", "Maret")}>Gunakan periode Maret</Button>}</div>}
        <p className="panel-footnote">Korelasi Pearson dari pasangan lengkap. Hubungan statistik tidak menunjukkan sebab-akibat.</p>
        {!!scatter.length && <details className="chart-data"><summary>Lihat pasangan data ({scatter.length})</summary><div className="chart-table-scroll" tabIndex={0} role="region" aria-label="Tabel pasangan data, dapat digulir horizontal"><table><thead><tr><th>Provinsi</th><th>KFD</th><th>Kemiskinan (%)</th></tr></thead><tbody>{scatter.map(r => <tr key={r.code}><td>{r.label}</td><td>{format(r.x)}</td><td>{format(r.y)}</td></tr>)}</tbody></table></div></details>}
      </Panel>
    </div>
    <p className="dashboard-source">Sumber: {data.workbook} · Fixture lokal · Periode dan ketersediaan mengikuti sheet sumber.</p>
  </div>;
}
