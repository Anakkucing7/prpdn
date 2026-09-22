"use client";

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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { data, format, hasValue, mapColors, mean, metricKeys, metrics, observation, valuesFor, type Metric } from "@/lib/dashboard";

const ProvinceMap = dynamic(() => import("./province-map"), { ssr: false, loading: () => <Skeleton className="map-loading" aria-label="Memuat peta provinsi" /> });
const AnalyticsChart = dynamic(() => import("./analytics-chart"), { ssr: false, loading: () => <Skeleton className="analytics-chart" aria-label="Memuat grafik" /> });

function Panel({ title, description, action, children, className = "" }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={`dashboard-panel ${className}`}><header className="panel-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</header>{children}</section>;
}

function Methodology() {
  return <Dialog><DialogTrigger asChild><Button variant="outline"><BookOpen />Sumber & metodologi</Button></DialogTrigger>
    <DialogContent className="methodology-dialog"><DialogHeader><DialogTitle>Sumber & metodologi</DialogTitle><DialogDescription>Ringkasan analitis dari {data.workbook}. Sumber tidak mencantumkan waktu pembaruan.</DialogDescription></DialogHeader>
      <div className="methodology-content" tabIndex={0} role="region" aria-label="Penjelasan sumber dan metodologi">
        <h3>Cakupan dan agregasi</h3><p>Dashboard menampilkan 38 provinsi pada master wilayah saat ini, untuk tahun 2022–2024. Kabupaten/kota belum disertakan karena duplikasi dan anomali pada data sumber.</p>
        <p>Rata-rata adalah rerata sederhana provinsi dengan nilai numerik, tanpa bobot penduduk. Angka ini bukan indeks nasional atau persentase kemiskinan nasional. Nilai kosong tidak dianggap nol. Peringkat mengikuti nilai numerik, bukan penilaian kinerja lintas indikator.</p>
        <h3>Tren dan pilar</h3><p>Garis pembanding IDSD memakai {data.regions.filter(r => data.years.every(y => observation("idsd", y, r.code, "Maret")?.value != null)).length} kode provinsi yang memiliki nilai pada ketiga tahun. Pemekaran Papua tetap membatasi keterbandingan wilayah dari waktu ke waktu. Profil pilar memakai provinsi yang tersedia pada tahun terpilih, pada skala 0–5.</p>
        <p>Dalam fixture, 36 baris pilar bernama MALUKU UTARA dipetakan dari kode 81 ke 82 sesuai nama pada master. Nilai skor dan workbook asli tidak diubah. Semua nomor baris koreksi disimpan bersama fixture.</p>
        <h3>Peta dan kelengkapan</h3><p>{data.boundaryCount} geometri path digunakan untuk pratinjau. {data.omittedRings.length} ring dengan kurang dari empat posisi tidak dirender; rinciannya dicatat dalam fixture. Kolom WKT tidak digunakan karena menggabungkan pulau menjadi satu ring. Batas ini belum diverifikasi secara topologis atau terhadap pemekaran. {38 - data.boundaryCount} provinsi lain ditampilkan sebagai titik long/lat dari master; titik bukan representasi luas wilayah. Latar Indonesia menggunakan Natural Earth 1:50m, domain publik.</p>
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
  const code = data.regions.some(r => r.code === searchParams.get("province")) ? searchParams.get("province")! : "all";
  const period = searchParams.get("period") === "Maret" ? "Maret" : "September";
  const selected = data.regions.find(r => r.code === code);
  const [showAll, setShowAll] = useState(false);
  const [ascending, setAscending] = useState(false);
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    window.history.pushState(null, "", `?${params}`);
  }
  function reset() { window.history.pushState(null, "", window.location.pathname); setQuery(""); setAscending(false); setShowAll(false); }

  const definition = metrics[metric];
  const rows = valuesFor(metric, year, period);
  const available = rows.filter(hasValue);
  const sorted = [...available].sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "id"));
  const high = sorted[0];
  const low = sorted.at(-1);
  const min = low?.value ?? 0;
  const max = high?.value ?? 1;
  const average = mean(available.map(r => r.value));
  const selectedValue = selected ? observation(metric, year, code, period)?.value : null;
  const ordered = [...rows].sort((a, b) => a.value === null ? b.value === null ? a.label.localeCompare(b.label, "id") : 1 : b.value === null ? -1 : (ascending ? a.value - b.value : b.value - a.value) || a.label.localeCompare(b.label, "id"));
  const ranked = ordered.filter(r => r.label.toLocaleLowerCase("id").includes(query.trim().toLocaleLowerCase("id"))).slice(0, showAll ? 38 : 5);
  const rankOf = (value: number | null) => value === null ? "—" : 1 + available.filter(r => ascending ? r.value < value : r.value > value).length;
  const cohort = data.regions.filter(r => data.years.every(y => observation("idsd", y, r.code, period)?.value != null));
  const trend = data.years.map(y => ({ year: y, average: mean(cohort.map(r => observation("idsd", y, r.code, period)!.value!)), selected: selected ? observation("idsd", y, code, period)?.value ?? null : null }));
  const pillarValues = data.pillarDefinitions.map(p => ({ ...p, value: mean(data.pillars.filter(r => r.year === year && r.pillar === p.id && (!selected || r.code === code)).map(r => r.value)) }));
  const scatter = data.regions.map(r => ({ ...r, x: observation("kfd", year, r.code, period)?.value, y: observation("poverty", year, r.code, period)?.value })).filter((r): r is typeof r & { x: number; y: number } => r.x != null && r.y != null);
  const xMean = mean(scatter.map(r => r.x)) ?? 0;
  const yMean = mean(scatter.map(r => r.y)) ?? 0;
  const denominator = Math.sqrt(scatter.reduce((s, r) => s + (r.x - xMean) ** 2, 0) * scatter.reduce((s, r) => s + (r.y - yMean) ** 2, 0));
  const correlation = scatter.length > 1 && denominator > 0 ? scatter.reduce((s, r) => s + (r.x - xMean) * (r.y - yMean), 0) / denominator : null;
  const axes = { axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: "#697386", fontSize: 12 }, splitLine: { lineStyle: { color: "#edf0f5" } } };
  const trendOption: EChartsOption = {
    grid: { left: 40, right: 18, top: 24, bottom: 32 },
    tooltip: { trigger: "axis", confine: true, valueFormatter: value => format(typeof value === "number" ? value : null) },
    xAxis: { ...axes, type: "category", data: data.years.map(String), boundaryGap: true },
    yAxis: { ...axes, type: "value", min: 0, max: 5, interval: 1 },
    series: [{ name: `Rerata ${cohort.length} provinsi`, type: "line", data: trend.map(r => r.average), symbolSize: 7, lineStyle: { width: 2, type: selected ? "dashed" : "solid" }, itemStyle: { color: selected ? "#91a8ba" : "#1769c2" },
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
    <PageHeader title="Dashboard" description="Pantau indikator pembangunan dan ketersediaan data provinsi." parent="Ringkasan" actions={<Methodology />} />
    <div className="mobile-filter-bar"><Button variant="outline" aria-expanded={filtersOpen} aria-controls="dashboard-filters" onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal />Filter dashboard<ChevronDown className={filtersOpen ? "rotate-180" : ""} /></Button><span>{year} · {definition.label} · {selected?.label ?? "Semua provinsi"}</span></div>
    <div id="dashboard-filters" className="dashboard-filters" data-open={filtersOpen} aria-label="Filter dashboard">
      <SelectField label="Tahun" value={String(year)} onValueChange={v => setFilter("year", v)} options={[...data.years].reverse().map(y => ({ value: String(y), label: String(y) }))} />
      <SelectField label="Indikator peta & peringkat" value={metric} onValueChange={v => setFilter("indicator", v)} options={metricKeys.map(k => ({ value: k, label: metrics[k].label }))} />
      <SelectField label="Provinsi" value={code} onValueChange={v => setFilter("province", v)} options={[{ value: "all", label: "Semua provinsi" }, ...data.regions.map(r => ({ value: r.code, label: r.name }))]} />
      <SelectField label="Periode kemiskinan" value={period} onValueChange={v => setFilter("period", v)} options={[{ value: "Maret", label: "Maret" }, { value: "September", label: "September" }]} />
      <Button variant="ghost" onClick={reset}><RotateCcw />Reset</Button>
    </div>
    <p className="dashboard-context" aria-live="polite">Tingkat provinsi · {year} · {definition.name}{metric === "poverty" ? ` · ${period}` : ""}{selected ? ` · Profil ${selected.label}` : " · Seluruh Indonesia"}</p>
    <div className="kpi-grid">
      <div className="kpi"><p>{selected ? `${definition.label} · ${selected.label}` : `Cakupan ${definition.label}`}</p><strong>{selected ? format(selectedValue) : <>{available.length}<span> / 38</span></>}</strong><small>{selected ? selectedValue == null ? "Data belum tersedia" : definition.unit : "provinsi dengan nilai tersedia"}</small></div>
      <div className="kpi"><p>Rata-rata provinsi</p><strong>{format(average)}<span>{metric === "poverty" ? "%" : ""}</span></strong><small>{available.length ? `Rerata tanpa bobot · ${available.length} provinsi` : "Belum ada nilai numerik"}</small></div>
      <div className="kpi"><p>Nilai tertinggi</p><strong>{format(high?.value)}<span>{metric === "poverty" ? "%" : ""}</span></strong><small>{high?.label ?? "Data belum tersedia"}</small></div>
      <div className="kpi"><p>Nilai terendah</p><strong>{format(low?.value)}<span>{metric === "poverty" ? "%" : ""}</span></strong><small>{low?.label ?? "Data belum tersedia"}</small></div>
    </div>

    <div className="spatial-grid">
      <Panel title={`Peta ${definition.label}`} description={`${year}${metric === "poverty" ? ` · ${period}` : ""} · Pilih wilayah untuk melihat profil`} className="map-panel" action={<StatusBadge>{available.length}/38 tersedia</StatusBadge>}>
        <ProvinceMap rows={rows} selected={code} onSelect={v => setFilter("province", v)} min={min} max={max} label={definition.label} unit={definition.unit} year={year} />
        <div className="map-legend"><span>{definition.unit}</span><div className="legend-scale"><span>{format(available.length ? min : null)}</span><div>{mapColors.map(color => <i key={color} style={{ background: color }} />)}</div><span>{format(available.length ? max : null)}</span></div><span className="no-data-key"><i />Tidak tersedia</span></div>
        <p className="map-note"><CircleHelp aria-hidden="true" />{data.boundaryCount} batas pratinjau; {38 - data.boundaryCount} provinsi memakai titik lokasi. Batas belum diverifikasi terhadap pemekaran.</p>
      </Panel>
      <Panel title="Peringkat provinsi" description={`${definition.label} · ${ascending ? "Nilai terendah dahulu" : "Nilai tertinggi dahulu"}`} action={<Button variant="ghost" size="icon" aria-label={ascending ? "Urutkan nilai tertinggi" : "Urutkan nilai terendah"} title="Ubah urutan nilai" onClick={() => setAscending(!ascending)}><ArrowDownWideNarrow /></Button>}>
        <div className="ranking-toolbar"><div className="segment-control" aria-label="Jumlah peringkat"><button aria-pressed={!showAll} onClick={() => { setShowAll(false); setQuery(""); }}>5 provinsi</button><button aria-pressed={showAll} onClick={() => setShowAll(true)}>Semua (38)</button></div>{showAll && <Input aria-label="Cari provinsi di peringkat" placeholder="Cari provinsi…" value={query} onChange={e => setQuery(e.target.value)} />}</div>
        <div className="ranking-list" data-expanded={showAll} tabIndex={0} aria-label="Daftar peringkat, pilih provinsi"><table><thead><tr><th scope="col">#</th><th scope="col">Provinsi</th><th scope="col">{definition.unit}</th></tr></thead><tbody>{ranked.map(r => <tr key={r.code} data-selected={r.code === code}><td>{rankOf(r.value)}</td><td><button onClick={() => setFilter("province", r.code)} aria-pressed={r.code === code}>{r.label}</button><span className="rank-track" aria-hidden="true"><i style={{ width: `${r.value == null || max === 0 ? 0 : Math.max(0, r.value / max * 100)}%` }} /></span></td><td>{format(r.value)}</td></tr>)}</tbody></table>{!ranked.length && <p className="chart-empty">Tidak ada provinsi yang cocok.</p>}</div>
        <p className="panel-footnote">{metric === "poverty" ? "Persentase lebih tinggi berarti kemiskinan lebih tinggi." : "Urutan nilai numerik pada tahun terpilih."} Klik nama untuk membuka profil.</p>
      </Panel>
    </div>

    <section className="province-brief" aria-label="Ringkasan indikator provinsi">
      <div className="brief-heading"><h2>{selected?.label ?? "Ringkasan seluruh provinsi"}</h2><p>{selected ? `Kode ${code} · ${selected.island}` : "Rerata sederhana provinsi yang tersedia"}</p>{selected && <Sheet><SheetTrigger asChild><Button variant="link">Detail sumber<ArrowUpRight /></Button></SheetTrigger><SheetContent className="detail-sheet"><SheetHeader><SheetTitle>{selected.name}</SheetTitle><SheetDescription>Nilai indikator {year} · kemiskinan {period}</SheetDescription></SheetHeader><div className="detail-body"><dl className="facts">{metricKeys.map(k => { const record = observation(k, year, code, period); return <div key={k}><dt>{metrics[k].label}</dt><dd><strong>{format(record?.value)} {record?.value == null ? "" : metrics[k].unit}</strong><p>{record?.category}</p><p className="source-line">{metrics[k].sheet}{record ? `, baris ${record.sourceRow}` : " · Tidak ada record"}</p></dd></div>; })}</dl><p className="source-line">{data.workbook}<br/>dim_wilayah, baris {selected.sourceRow}</p><p className="muted-note">{selected.boundary ? "Batas dapat dibaca; belum diverifikasi secara topologis." : "Batas tidak lengkap. Peta menggunakan titik lokasi dari master."}</p></div></SheetContent></Sheet>}</div>
      <div className="brief-metrics">{metricKeys.map(k => { const list = valuesFor(k, year, period).filter(hasValue); const value = selected ? observation(k, year, code, period)?.value : mean(list.map(r => r.value)); return <div key={k}><span>{metrics[k].label}</span><strong>{format(value)}{k === "poverty" && value != null ? <small>%</small> : null}</strong><small>{selected ? value == null ? "Tidak tersedia" : metrics[k].unit : `${list.length} provinsi`}{k === "poverty" ? ` · ${period}` : ""}</small></div>; })}</div>
    </section>

    <div className="analytics-grid">
      <Panel title="Tren IDSD" description={`2022–2024 · ${selected?.label ?? `Rerata ${cohort.length} provinsi dengan kode yang sama`}`}>
        <div className="chart-legend"><span><i />{selected?.label ?? `Rerata ${cohort.length} provinsi`}</span>{selected && <span><i className="secondary-series" />Rerata {cohort.length} provinsi</span>}<span>Skala 0–5</span></div>
        <AnalyticsChart option={trendOption} label={`Tren skor IDSD 2022–2024 untuk ${selected?.label ?? "rerata provinsi"}. Nilai tersedia pada tabel di bawah grafik.`} />
        <p className="panel-footnote">Garis vertikal: tahun {year}. Pemekaran Papua membatasi perbandingan antarwaktu.</p>
        <details className="chart-data"><summary>Lihat angka tren</summary><div className="chart-table-scroll" tabIndex={0} role="region" aria-label="Tabel angka tren, dapat digulir horizontal"><table><thead><tr><th>Tahun</th><th>Rerata {cohort.length} provinsi</th>{selected && <th>{selected.label}</th>}</tr></thead><tbody>{trend.map(t => <tr key={t.year}><td>{t.year}</td><td>{format(t.average)}</td>{selected && <td>{format(t.selected)}</td>}</tr>)}</tbody></table></div></details>
      </Panel>
      <Panel title="Profil 12 pilar IDSD" description={`${year} · ${selected?.label ?? "Rerata provinsi yang tersedia"}`} action={<span className="unit-label">Skala 0–5</span>}>
        <div className="pillar-list">{pillarValues.map(p => <div key={p.id} className="pillar-row"><span title={p.group}><small>{p.id}</small>{p.name}</span><span className="pillar-track" aria-hidden="true"><i style={{ width: `${(p.value ?? 0) / 5 * 100}%` }} /></span><strong>{format(p.value)}</strong></div>)}</div>
        <p className="panel-footnote">Empat komponen: lingkungan pendukung, SDM, pasar, dan ekosistem inovasi. Nilai kosong ditandai —.</p>
      </Panel>
      <Panel title="Cakupan data" description={`${year} · Ketersediaan nilai pada 38 provinsi master`}>
        <div className="coverage-list">{metricKeys.map(k => { const count = valuesFor(k, year, period).filter(hasValue).length; return <div key={k}><div><span>{metrics[k].label}{k === "poverty" ? ` · ${period}` : ""}</span><strong>{count}<small> / 38</small></strong></div><progress value={count} max={38} aria-label={`Cakupan ${metrics[k].label}: ${count} dari 38 provinsi`} /><p>{count === 38 ? "Seluruh provinsi memiliki nilai" : `${38 - count} provinsi tanpa nilai numerik`}</p></div>; })}</div>
        <div className="coverage-note"><CircleHelp aria-hidden="true" /><p>Cakupan menunjukkan ketersediaan, bukan status validasi. Perubahan jumlah provinsi dan periode pelaporan memengaruhi kelengkapan.</p></div>
      </Panel>
      <Panel title="KFD dan kemiskinan" description={`${year} · Kemiskinan ${period} · ${scatter.length} pasangan provinsi`} action={<span className="correlation">r = {format(correlation)}</span>}>
        {scatter.length ? <AnalyticsChart option={scatterOption} label={`Sebaran rasio KFD dan persentase kemiskinan ${period} ${year}, ${scatter.length} provinsi, korelasi Pearson ${format(correlation)}. Angka tersedia pada tabel.`} /> : <div className="chart-empty"><strong>Pasangan data belum tersedia</strong><p>Data kemiskinan {period} {year} belum memiliki nilai numerik yang dapat dipasangkan dengan KFD.</p><Button variant="outline" onClick={() => setFilter("period", "Maret")}>Gunakan periode Maret</Button></div>}
        <p className="panel-footnote">Korelasi Pearson dari pasangan lengkap. Hubungan statistik tidak menunjukkan sebab-akibat.</p>
        {!!scatter.length && <details className="chart-data"><summary>Lihat pasangan data ({scatter.length})</summary><div className="chart-table-scroll" tabIndex={0} role="region" aria-label="Tabel pasangan data, dapat digulir horizontal"><table><thead><tr><th>Provinsi</th><th>KFD</th><th>Kemiskinan (%)</th></tr></thead><tbody>{scatter.map(r => <tr key={r.code}><td>{r.label}</td><td>{format(r.x)}</td><td>{format(r.y)}</td></tr>)}</tbody></table></div></details>}
      </Panel>
    </div>
    <p className="dashboard-source">Sumber: {data.workbook} · Fixture lokal · Periode dan ketersediaan mengikuti sheet sumber.</p>
  </div>;
}
