"use client";

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, ChartNoAxesCombined, Info, X } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { SelectField } from '@/components/ui-patterns';
import { Button } from '@/components/ui/button';
import { TrendDelta } from '@/components/trend-delta';
import { metrics, type Metric, format } from '@/lib/dashboard';
import type { EChartsOption } from 'echarts';
import './comparison.css';

const Chart = dynamic(() => import('@/components/dashboard/analytics-chart'), { ssr: false, loading: () => <div className="comparison-chart-loading" role="status">Memuat grafik…</div> });
const metricOptions: Metric[] = ['idsd', 'kfd', 'eppd', 'poverty'];
const colors = ['#1769c2', '#27805a', '#b35d25', '#7655a5', '#168b91'];
export type ComparisonRecord = { metric: string; code: string; year: number; period: string | null; value: number };
export type ComparisonRegion = { code: string; name: string; level: string; provinceCode: string };

export default function ComparisonPage({ records, regions }: { records: ComparisonRecord[]; regions: ComparisonRegion[] }) {
  const [metric, setMetric] = useState<Metric>('idsd');
  const [level, setLevel] = useState('PROV');
  const [province, setProvince] = useState('');
  const [period, setPeriod] = useState('September');
  const [selectedCodes, setSelectedCodes] = useState(() => regions.filter(region => region.level === 'PROV' && records.some(record => record.metric === 'idsd' && record.code === region.code)).slice(0, 3).map(region => region.code));
  const [addCode, setAddCode] = useState('');
  const [fromYear, setFromYear] = useState('');
  const [toYear, setToYear] = useState('');
  const definition = metrics[metric];
  const hasMetricData = (code: string) => records.some(record => record.metric === metric && record.code === code && (metric !== 'poverty' || record.period === period));
  const provinces = regions.filter(region => region.level === 'PROV' && regions.some(child => child.level === 'KABKOTA' && child.provinceCode === region.code && hasMetricData(child.code)));
  const levelRegions = regions.filter(region => region.level === level && (level === 'PROV' || Boolean(province && region.provinceCode === province)) && hasMetricData(region.code));
  const plottedRegions = selectedCodes.flatMap(code => {
    const region = levelRegions.find(item => item.code === code);
    return region ? [{ region, values: [] as (number | null)[] }] : [];
  });
  const availableYears = [...new Set(records.filter(record => record.metric === metric && levelRegions.some(region => region.code === record.code) && (metric !== 'poverty' || record.period === period)).map(record => record.year))].sort((a, b) => a - b);
  const years = availableYears.filter(year => (!fromYear || year >= Number(fromYear)) && (!toYear || year <= Number(toYear)));
  const valueAt = (code: string, year: number) => {
    const matches = records.filter(record => record.metric === metric && record.code === code && record.year === year && (metric !== 'poverty' || record.period === period));
    return matches.length === 1 ? matches[0].value : null;
  };
  plottedRegions.forEach(item => { item.values = years.map(year => valueAt(item.region.code, year)); });
  const availableToAdd = levelRegions.filter(region => !selectedCodes.includes(region.code));
  const candidate = availableToAdd.find(region => region.code === addCode) ?? availableToAdd[0];
  const changes = plottedRegions.map(item => {
    const first = item.values.find(value => value !== null) ?? null;
    const last = [...item.values].reverse().find(value => value !== null) ?? null;
    return { code: item.region.code, value: first !== null && last !== null ? last - first : null };
  });
  const chart: EChartsOption = {
    color: colors,
    grid: { left: 56, right: 28, top: 24, bottom: 44 },
    tooltip: { trigger: 'axis', confine: true, renderMode: 'richText', formatter: params => {
      const items = Array.isArray(params) ? params : [params];
      const index = items[0]?.dataIndex ?? -1;
      return [`${years[index] ?? ''}`, ...items.map(item => `${item.marker ?? ''}${item.seriesName}: ${format(typeof item.value === 'number' ? item.value : null)} ${definition.unit}`)].join('\n');
    } },
    xAxis: { type: 'category', data: years.map(String), axisLine: { lineStyle: { color: '#d9e1ea' } }, axisTick: { show: false }, axisLabel: { color: '#697386' }, boundaryGap: false },
    yAxis: { type: 'value', scale: true, splitLine: { lineStyle: { color: '#edf0f5' } }, axisLabel: { color: '#697386' } },
    series: plottedRegions.map((item, index) => ({ name: item.region.name, type: 'line', data: item.values, connectNulls: false, symbol: 'circle', symbolSize: 7, lineStyle: { color: colors[index % colors.length], width: 2.5 }, itemStyle: { color: colors[index % colors.length], borderColor: '#fff', borderWidth: 2 } })),
  };
  const setMetricAndDefaults = (next: Metric) => {
    setMetric(next);
    const nextPeriod = next === 'poverty' ? period : 'September';
    const nextRegions = regions.filter(region => region.level === level && (level === 'PROV' || Boolean(province && region.provinceCode === province)) && records.some(record => record.metric === next && record.code === region.code && (next !== 'poverty' || record.period === nextPeriod)));
    setSelectedCodes(nextRegions.slice(0, 3).map(region => region.code));
    setFromYear(''); setToYear('');
  };
  const setPeriodAndDefaults = (next: string) => {
    setPeriod(next);
    const nextRegions = regions.filter(region => region.level === level && (level === 'PROV' || Boolean(province && region.provinceCode === province)) && records.some(record => record.metric === metric && record.code === region.code && record.period === next));
    setSelectedCodes(nextRegions.slice(0, 3).map(region => region.code));
    setFromYear(''); setToYear('');
  };
  const changeLevel = (next: string) => { setLevel(next); setProvince(''); setSelectedCodes([]); setAddCode(''); setFromYear(''); setToYear(''); };
  const changeProvince = (next: string) => { setProvince(next); setSelectedCodes([]); setAddCode(''); setFromYear(''); setToYear(''); };
  const reset = () => {
    setMetric('idsd'); setLevel('PROV'); setProvince(''); setPeriod('September');
    setSelectedCodes(regions.filter(region => region.level === 'PROV' && records.some(record => record.metric === 'idsd' && record.code === region.code)).slice(0, 3).map(region => region.code));
    setAddCode(''); setFromYear(''); setToYear('');
  };

  return <div className="comparison-page">
    <PageHeader title="Perbandingan Data" parent="Ringkasan" description="Bandingkan perkembangan indikator antarwilayah pada rentang tahun yang tersedia." />
    <section className="comparison-controls" aria-label="Pengaturan perbandingan data">
      <SelectField label="Parameter" value={metric} onValueChange={value => setMetricAndDefaults(value as Metric)} options={metricOptions.map(key => ({ value: key, label: metrics[key].name }))} />
      <div className="comparison-field comparison-level"><span>Tingkat wilayah</span><div role="group" aria-label="Tingkat wilayah"><Button size="sm" variant={level === 'PROV' ? 'default' : 'outline'} aria-pressed={level === 'PROV'} onClick={() => changeLevel('PROV')}>Provinsi</Button><Button size="sm" variant={level === 'KABKOTA' ? 'default' : 'outline'} aria-pressed={level === 'KABKOTA'} onClick={() => changeLevel('KABKOTA')}>Kabupaten/Kota</Button></div></div>
      {level === 'KABKOTA' && <SelectField label="Provinsi" value={province || 'none'} onValueChange={value => changeProvince(value === 'none' ? '' : value)} options={[{ value: 'none', label: 'Pilih provinsi' }, ...provinces.map(item => ({ value: item.code, label: item.name }))]} />}
      {metric === 'poverty' && <SelectField label="Periode" value={period} onValueChange={setPeriodAndDefaults} options={[{ value: 'Maret', label: 'Maret' }, { value: 'September', label: 'September' }]} />}
      <div className="comparison-region-picker"><SelectField label={level === 'PROV' ? 'Tambah wilayah pembanding' : 'Tambah kabupaten/kota'} value={candidate?.code ?? ''} onValueChange={setAddCode} options={availableToAdd.map(item => ({ value: item.code, label: item.name }))} disabled={!availableToAdd.length} /><Button variant="outline" onClick={() => candidate && setSelectedCodes(current => current.length < 5 ? [...current, candidate.code] : current)} disabled={!candidate || selectedCodes.length >= 5}>Tambah</Button></div>
      <div className="comparison-year-controls"><div className="comparison-year-range"><SelectField label="Dari tahun" value={fromYear || String(availableYears[0] ?? '')} onValueChange={value => { setFromYear(value); if (toYear && Number(value) > Number(toYear)) setToYear(value); }} options={availableYears.map(year => ({ value: String(year), label: String(year) }))} disabled={!availableYears.length} /><SelectField label="Sampai tahun" value={toYear || String(availableYears.at(-1) ?? '')} onValueChange={value => { setToYear(value); if (fromYear && Number(value) < Number(fromYear)) setFromYear(value); }} options={availableYears.map(year => ({ value: String(year), label: String(year) }))} disabled={!availableYears.length} /></div><Button className="comparison-reset" variant="ghost" onClick={reset}>Atur ulang</Button></div>
    </section>
    <div className="comparison-selection" aria-live="polite"><div><strong>{selectedCodes.length} dari 5 wilayah</strong><span>Pilih sampai lima wilayah untuk dibandingkan pada satu grafik.</span></div><div className="comparison-chips">{plottedRegions.map((item, index) => <span className="comparison-chip" key={item.region.code}><i style={{ backgroundColor: colors[index % colors.length] }} aria-hidden="true" />{item.region.name}<button type="button" aria-label={`Hapus ${item.region.name}`} onClick={() => setSelectedCodes(codes => codes.filter(code => code !== item.region.code))}><X size={14} /></button></span>)}</div></div>
    <p className="comparison-context" aria-live="polite">{definition.label} · {years[0] ?? '—'}–{years.at(-1) ?? '—'}{metric === 'poverty' ? ` · ${period}` : ''}</p>
    <section className="comparison-panel" aria-labelledby="comparison-chart-title">
      <header><div><p className="comparison-eyebrow"><ChartNoAxesCombined aria-hidden="true" /> Analisis historis</p><h2 id="comparison-chart-title">{definition.label} menurut wilayah</h2><p>{definition.name} · {definition.unit} · berdasarkan observasi yang tersedia</p></div></header>
      {plottedRegions.length && years.length && plottedRegions.some(item => item.values.some(value => value !== null)) ? <Chart option={chart} label={`Grafik perbandingan ${definition.label} pada ${plottedRegions.length} wilayah dari ${years[0]} sampai ${years.at(-1)}`} /> : <div className="comparison-empty"><Info aria-hidden="true"/><div><strong>{level === 'KABKOTA' && !province ? 'Pilih provinsi untuk melihat kabupaten/kota' : 'Data belum tersedia untuk pilihan ini'}</strong><p>Grafik hanya menampilkan observasi yang tersedia pada sumber data.</p></div></div>}
      <div className="comparison-series-list" aria-label="Perubahan tiap wilayah">{plottedRegions.map((item, index) => { const change = changes.find(value => value.code === item.region.code)?.value ?? null; return <div className="comparison-series-item" key={item.region.code}><span className="comparison-series-name"><i style={{ backgroundColor: colors[index % colors.length] }} aria-hidden="true" />{item.region.name}</span>{change !== null && <span className="comparison-change" data-direction={change > 0 ? 'up' : change < 0 ? 'down' : 'flat'}>{change > 0 ? <ArrowUpRight /> : change < 0 ? <ArrowDownRight /> : null}<strong>{change > 0 ? '+' : ''}{format(change)}</strong><span>perubahan</span></span>}</div>; })}</div>
      <details className="comparison-data"><summary>Lihat angka per tahun</summary><div className="comparison-table-scroll" tabIndex={0} role="region" aria-label="Nilai tiap wilayah per tahun, dapat digulir horizontal"><table><thead><tr><th scope="col">Tahun</th>{plottedRegions.map((item, index) => <th scope="col" key={item.region.code}><i style={{ backgroundColor: colors[index % colors.length] }} aria-hidden="true" />{item.region.name}</th>)}</tr></thead><tbody>{years.map((year, yearIndex) => <tr key={year}><th scope="row">{year}{metric === 'poverty' ? ` · ${period}` : ''}</th>{plottedRegions.map(item => { const priorIndex = years.indexOf(year - 1); return <td key={item.region.code}><span>{format(item.values[yearIndex])}</span><TrendDelta current={item.values[yearIndex]} previous={priorIndex >= 0 ? item.values[priorIndex] : null} year={year} /></td>; })}</tr>)}</tbody></table></div></details>
      <footer><span><i aria-hidden="true" /> Nilai {definition.label}</span><p>Perubahan menunjukkan arah dan besar selisih; tidak menyatakan hasil baik atau buruk.</p></footer>
    </section>
    <section className="comparison-period-note"><Info aria-hidden="true"/><p>Sumber menyediakan data tahunan; data kemiskinan juga dibedakan menurut periode Maret dan September. Tanggal harian tidak tersedia.</p></section>
  </div>;
}
