"use client";

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, ChartNoAxesCombined, Info } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { SelectField } from '@/components/ui-patterns';
import { Button } from '@/components/ui/button';
import { TrendDelta } from '@/components/trend-delta';
import { metrics, type Metric, format } from '@/lib/dashboard';
import type { EChartsOption } from 'echarts';
import './comparison.css';

const Chart = dynamic(() => import('@/components/dashboard/analytics-chart'), { ssr: false, loading: () => <div className="comparison-chart-loading" role="status">Memuat grafik…</div> });
const metricOptions: Metric[] = ['idsd', 'kfd', 'eppd', 'poverty'];
export type ComparisonRecord = { metric: string; code: string; year: number; period: string | null; value: number };
export type ComparisonRegion = { code: string; name: string; level: string; provinceCode: string };

export default function ComparisonPage({ records, regions }: { records: ComparisonRecord[]; regions: ComparisonRegion[] }) {
  const [metric, setMetric] = useState<Metric>('idsd');
  const [level, setLevel] = useState('PROV');
  const [province, setProvince] = useState('all');
  const [region, setRegion] = useState('');
  const [period, setPeriod] = useState('September');
  const levelRegions = regions.filter(item => item.level === level && (level === 'PROV' || province === 'all' || item.provinceCode === province));
  const availableYears = [...new Set(records.filter(item => item.metric === metric && (metric !== 'poverty' || item.period === period) && levelRegions.some(r => r.code === item.code)).map(item => item.year))].sort((a, b) => a - b);
  const [fromYear, setFromYear] = useState('');
  const [toYear, setToYear] = useState('');
  const chosenRegion = levelRegions.find(item => item.code === region) ?? levelRegions[0];
  const years = availableYears.filter(year => (!fromYear || year >= Number(fromYear)) && (!toYear || year <= Number(toYear)));
  const series = years.map(year => {
    const matches = records.filter(item => item.metric === metric && item.code === chosenRegion?.code && item.year === year && (metric !== 'poverty' || item.period === period));
    return matches.length === 1 ? matches[0].value : null;
  });
  const definition = metrics[metric];
  const first = series.find(value => value !== null) ?? null;
  const last = [...series].reverse().find(value => value !== null) ?? null;
  const delta = first !== null && last !== null ? last - first : null;
  const chart: EChartsOption = {
    grid: { left: 52, right: 24, top: 30, bottom: 42 },
    tooltip: { trigger: 'axis', confine: true, renderMode: 'richText', formatter: params => { const item = Array.isArray(params) ? params[0] : params; const value = series[item?.dataIndex ?? -1]; return `${years[item?.dataIndex ?? -1] ?? ''}\n${format(value)} ${definition.unit}`; } },
    xAxis: { type: 'category', data: years.map(String), axisLine: { lineStyle: { color: '#d9e1ea' } }, axisTick: { show: false }, axisLabel: { color: '#697386' }, boundaryGap: false },
    yAxis: { type: 'value', scale: true, splitLine: { lineStyle: { color: '#edf0f5' } }, axisLabel: { color: '#697386' } },
    series: [{ name: definition.label, type: 'line', data: series, connectNulls: false, symbol: 'circle', symbolSize: 7, lineStyle: { color: '#1769c2', width: 3 }, itemStyle: { color: '#1769c2', borderColor: '#fff', borderWidth: 2 }, areaStyle: { color: 'rgba(23,105,194,.08)' } }],
  };
  const changeLevel = (next: string) => { setLevel(next); setProvince('all'); setRegion(''); };
  const reset = () => { setMetric('idsd'); setLevel('PROV'); setProvince('all'); setRegion(''); setPeriod('September'); setFromYear(''); setToYear(''); };

  return <div className="comparison-page">
    <PageHeader title="Perbandingan Data" parent="Ringkasan" description="Bandingkan perjalanan indikator pembangunan berdasarkan wilayah dan periode yang tercatat." />
    <section className="comparison-controls" aria-label="Pengaturan grafik perbandingan">
      <SelectField label="Parameter" value={metric} onValueChange={value => { setMetric(value as Metric); setFromYear(''); setToYear(''); }} options={metricOptions.map(key => ({ value: key, label: metrics[key].name }))} />
      <div className="comparison-level" role="group" aria-label="Tingkat wilayah"><Button size="sm" variant={level === 'PROV' ? 'default' : 'outline'} aria-pressed={level === 'PROV'} onClick={() => changeLevel('PROV')}>Provinsi</Button><Button size="sm" variant={level === 'KABKOTA' ? 'default' : 'outline'} aria-pressed={level === 'KABKOTA'} onClick={() => changeLevel('KABKOTA')}>Kabupaten/Kota</Button></div>
      {level === 'KABKOTA' && <SelectField label="Provinsi" value={province} onValueChange={value => { setProvince(value); setRegion(''); }} options={[{ value: 'all', label: 'Semua provinsi' }, ...regions.filter(item => item.level === 'PROV').map(item => ({ value: item.code, label: item.name }))]} />}
      <SelectField label={level === 'PROV' ? 'Wilayah' : 'Kabupaten/Kota'} value={chosenRegion?.code ?? ''} onValueChange={setRegion} options={levelRegions.map(item => ({ value: item.code, label: item.name }))} disabled={!levelRegions.length} />
      <SelectField label="Periode" value={metric === 'poverty' ? period : 'annual'} onValueChange={setPeriod} options={[{ value: 'annual', label: 'Tahunan' }, { value: 'Maret', label: 'Maret' }, { value: 'September', label: 'September' }]} disabled={metric !== 'poverty'} />
      <SelectField label="Tanggal" value="unavailable" onValueChange={() => {}} options={[{ value: 'unavailable', label: 'Tidak tersedia di sumber' }]} disabled />
      <SelectField label="Dari tahun" value={fromYear || String(availableYears[0] ?? '')} onValueChange={setFromYear} options={availableYears.map(year => ({ value: String(year), label: String(year) }))} disabled={!availableYears.length} />
      <SelectField label="Sampai tahun" value={toYear || String(availableYears.at(-1) ?? '')} onValueChange={setToYear} options={availableYears.map(year => ({ value: String(year), label: String(year) }))} disabled={!availableYears.length} />
      <Button variant="ghost" onClick={reset}>Atur ulang</Button>
    </section>
    <p className="comparison-context" aria-live="polite">{chosenRegion ? `${chosenRegion.name} · ${definition.label} · ${years[0] ?? '—'}–${years.at(-1) ?? '—'}${metric === 'poverty' ? ` · ${period}` : ''}` : 'Tidak ada wilayah dengan data pada pilihan ini.'}</p>
    <section className="comparison-panel" aria-labelledby="comparison-chart-title">
      <header><div><p className="comparison-eyebrow"><ChartNoAxesCombined aria-hidden="true" /> Analisis historis</p><h2 id="comparison-chart-title">{chosenRegion?.name ?? 'Wilayah'} · {definition.label}</h2><p>{definition.name} · {definition.unit} · berdasarkan observasi yang tersedia</p></div>
        {delta !== null && <div className="comparison-change" data-direction={delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'}>{delta > 0 ? <ArrowUpRight /> : delta < 0 ? <ArrowDownRight /> : null}<strong>{delta > 0 ? '+' : ''}{format(delta)}</strong><span>perubahan dalam rentang</span></div>}
      </header>
      {series.some(value => value !== null) ? <Chart option={chart} label={`Grafik historis ${definition.label} di ${chosenRegion?.name ?? 'wilayah'}, ${years.length} tahun tersedia`} /> : <div className="comparison-empty"><Info aria-hidden="true"/><div><strong>Belum ada seri untuk pilihan ini</strong><p>Data kota untuk parameter ini mungkin belum tersedia. Grafik hanya memakai nilai pada sumber.</p></div></div>}
      <details className="comparison-data"><summary>Lihat angka dan perubahan</summary><div className="comparison-table-scroll" tabIndex={0} role="region" aria-label="Nilai tahunan, dapat digulir horizontal"><table><thead><tr><th scope="col">Tahun</th><th scope="col">Nilai ({definition.unit})</th><th scope="col">Perubahan dari tahun sebelumnya</th></tr></thead><tbody>{years.map((year, index) => { const priorIndex = years.indexOf(year - 1); return <tr key={year}><td>{year}{metric === 'poverty' ? ` · ${period}` : ''}</td><td>{format(series[index])}</td><td><TrendDelta current={series[index]} previous={priorIndex >= 0 ? series[priorIndex] : null} year={year} /></td></tr>; })}</tbody></table></div></details>
      <footer><span><i aria-hidden="true" /> Nilai {definition.label}</span><p>Perubahan hanya menunjukkan arah dan besar selisih; tidak menyatakan hasil baik atau buruk.</p></footer>
    </section>
    <section className="comparison-period-note"><Info aria-hidden="true"/><p>Data sumber tersedia per tahun. Untuk kemiskinan tersedia periode Maret dan September. Tanggal harian tidak tersedia sehingga tidak ditampilkan sebagai pilihan.</p></section>
  </div>;
}
