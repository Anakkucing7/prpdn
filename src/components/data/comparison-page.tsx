"use client";

import dynamic from 'next/dynamic';
import { useEffect, useId, useRef, useState } from 'react';
import { ChartNoAxesCombined, ChevronDown, Info, Search, X } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { TrendDelta } from '@/components/trend-delta';
import { metrics, type Metric, format } from '@/lib/dashboard';
import { normalizeValues } from '@/lib/comparison';
import type { EChartsOption } from 'echarts';
import './comparison.css';

const Chart = dynamic(() => import('@/components/dashboard/analytics-chart'), { ssr: false, loading: () => <div className="comparison-chart-loading" role="status">Memuat grafik…</div> });
const metricOptions: Metric[] = ['idsd', 'kfd', 'eppd', 'poverty'];
const colors = ['#1769c2', '#27805a', '#b35d25', '#7655a5', '#168b91'];
export type ComparisonRecord = { metric: string; code: string; year: number; period: string | null; value: number };
export type ComparisonRegion = { code: string; name: string; level: string; provinceCode: string };

function SearchableSelectField({ label, value, onValueChange, options, disabled = false }: {
  label: string; value: string; onValueChange: (value: string) => void;
  options: { value: string; label: string }[]; disabled?: boolean;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const filtered = options.filter(option => `${option.label} ${option.value}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const selected = options.find(option => option.value === value)?.label;

  useEffect(() => { if (open) search.current?.focus(); }, [open]);

  const close = (restoreFocus = false) => { setOpen(false); setQuery(''); setActive(0); if (restoreFocus) trigger.current?.focus(); };
  const choose = (option: { value: string; label: string }) => { onValueChange(option.value); close(true); };
  const openMenu = () => { setQuery(''); setActive(0); setOpen(true); };

  return <div className="comparison-search-field" ref={root} onBlur={event => {
    if (!root.current?.contains(event.relatedTarget as Node | null)) close();
  }}>
    <label htmlFor={id}>{label}</label>
    <button ref={trigger} id={id} type="button" className="comparison-search-trigger" aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-listbox`} disabled={disabled}
      onClick={() => open ? close() : openMenu()} onKeyDown={event => {
        if (['ArrowDown', 'Enter', ' '].includes(event.key)) { event.preventDefault(); if (!open) openMenu(); }
      }}>
      <span>{selected || 'Pilih…'}</span><ChevronDown aria-hidden="true" />
    </button>
    {open && <div className="comparison-search-menu">
      <div className="comparison-search-input-wrap"><Search aria-hidden="true" /><input ref={search} type="search" role="combobox" aria-label={`Cari ${label}`} aria-autocomplete="list" aria-expanded="true" aria-controls={`${id}-listbox`} aria-activedescendant={filtered[active] ? `${id}-option-${active}` : undefined} placeholder={`Cari ${label.toLocaleLowerCase()}…`} value={query} onChange={event => { setQuery(event.target.value); setActive(0); }} onKeyDown={event => {
        if (event.key === 'ArrowDown' && filtered.length) { event.preventDefault(); setActive(index => Math.min(index + 1, filtered.length - 1)); }
        if (event.key === 'ArrowUp') { event.preventDefault(); setActive(index => Math.max(index - 1, 0)); }
        if (event.key === 'Enter' && filtered[active]) { event.preventDefault(); choose(filtered[active]); }
        if (event.key === 'Escape') { event.preventDefault(); close(true); }
      }} /></div>
      <div id={`${id}-listbox`} className="comparison-search-options" role="listbox" aria-label={label}>
        {filtered.length ? filtered.map((option, index) => <div key={option.value} id={`${id}-option-${index}`} role="option" aria-selected={option.value === value} data-active={index === active || undefined} onMouseMove={() => setActive(index)} onMouseDown={event => event.preventDefault()} onClick={() => choose(option)}>{option.label}</div>) : <p className="comparison-search-empty">Tidak ada pilihan yang cocok.</p>}
      </div>
    </div>}
  </div>;
}

export default function ComparisonPage({ records, regions }: { records: ComparisonRecord[]; regions: ComparisonRegion[] }) {
  const [selectedMetrics, setSelectedMetrics] = useState<Metric[]>(['idsd']);
  const [addMetricChoice, setAddMetricChoice] = useState<Metric | ''>('');
  const [level, setLevel] = useState('PROV');
  const [province, setProvince] = useState('');
  const [period, setPeriod] = useState('September');
  const [selectedCodes, setSelectedCodes] = useState(() => regions.filter(region => region.level === 'PROV' && records.some(record => record.metric === 'idsd' && record.code === region.code)).slice(0, 3).map(region => region.code));
  const [addCode, setAddCode] = useState('');
  const [fromYear, setFromYear] = useState('');
  const [toYear, setToYear] = useState('');
  const hasMetricData = (metric: Metric, code: string) => records.some(record => record.metric === metric && record.code === code && (metric !== 'poverty' || record.period === period));
  const hasDataInScope = (metric: Metric, scope: string, provinceCode = '') => regions.some(region => region.level === scope && (scope === 'PROV' || !provinceCode || region.provinceCode === provinceCode) && hasMetricData(metric, region.code));
  const metricsInScope = metricOptions.filter(metric => hasDataInScope(metric, level, province));
  const scopeRegions = regions.filter(region => region.level === level && (level === 'PROV' || Boolean(province && region.provinceCode === province)));
  const availableToAdd = scopeRegions.filter(region => !selectedCodes.includes(region.code) && selectedMetrics.some(metric => hasMetricData(metric, region.code)));
  const addCandidate = availableToAdd.find(region => region.code === addCode) ?? availableToAdd[0];
  const provinces = regions.filter(region => region.level === 'PROV' && regions.some(child => child.level === 'KABKOTA' && child.provinceCode === region.code && metricsInScope.some(metric => hasMetricData(metric, child.code))));
  const availableYearsByMetric = Object.fromEntries(selectedMetrics.map(metric => [metric, [...new Set(records.filter(record => record.metric === metric && scopeRegions.some(region => region.code === record.code) && (metric !== 'poverty' || record.period === period)).map(record => record.year))].sort((a, b) => a - b)])) as Partial<Record<Metric, number[]>>;
  const availableYears = [...new Set(selectedMetrics.flatMap(metric => availableYearsByMetric[metric] ?? []))].sort((a, b) => a - b);
  const yearInRange = (year: number) => (!fromYear || year >= Number(fromYear)) && (!toYear || year <= Number(toYear));
  const changeLevel = (next: string) => {
    setLevel(next); setProvince(''); setSelectedMetrics(['idsd']); setSelectedCodes([]); setAddCode(''); setFromYear(''); setToYear('');
  };
  const changeProvince = (next: string) => {
    setProvince(next);
    setSelectedMetrics(current => {
      const available = current.filter(metric => hasDataInScope(metric, 'KABKOTA', next));
      return available.length ? available : ['idsd'];
    });
    setSelectedCodes([]); setAddCode(''); setFromYear(''); setToYear('');
  };
  const reset = () => {
    setSelectedMetrics(['idsd']); setLevel('PROV'); setProvince(''); setPeriod('September');
    setSelectedCodes(regions.filter(region => region.level === 'PROV' && records.some(record => record.metric === 'idsd' && record.code === region.code)).slice(0, 3).map(region => region.code));
    setAddCode(''); setFromYear(''); setToYear('');
  };

  const years = availableYears.filter(yearInRange);
  const lineStyles: Record<Metric, { type: 'solid' | number[]; key: 'solid' | 'longdash' | 'shortdash' | 'dashdash' }> = {
    idsd: { type: 'solid', key: 'solid' }, kfd: { type: [14, 7], key: 'longdash' },
    eppd: { type: [8, 6], key: 'shortdash' }, poverty: { type: [18, 7, 8, 7], key: 'dashdash' },
  };
  const plottedSeries = selectedMetrics.flatMap(metric => selectedCodes.flatMap(code => {
    const region = scopeRegions.find(item => item.code === code);
    if (!region || !hasMetricData(metric, code)) return [];
    const rawValues = years.map(year => {
      const matches = records.filter(record => record.metric === metric && record.code === code && record.year === year && (metric !== 'poverty' || record.period === period));
      return matches.length === 1 ? matches[0].value : null;
    });
    const baseline = rawValues.find(value => value !== null);
    const definition = metrics[metric];
    const style = lineStyles[metric];
    const color = colors[selectedCodes.indexOf(code) % colors.length];
    return [{ metric, definition, region, rawValues, baseline, style, color, name: `${region.name} · ${definition.name}`, values: normalizeValues(rawValues) }];
  }));
  const chart: EChartsOption = {
    grid: { left: 58, right: 24, top: 22, bottom: 42 },
    tooltip: { trigger: 'axis', confine: true, renderMode: 'richText', formatter: params => {
      const items = Array.isArray(params) ? params : [params];
      const index = items[0]?.dataIndex ?? -1;
      return [`${years[index] ?? ''}`, ...items.flatMap(item => {
        const series = plottedSeries[item.seriesIndex ?? -1];
        if (!series) return [];
        const raw = series.rawValues[index];
        const indexed = typeof item.value === 'number' ? `${format(item.value)} (indeks)` : 'Indeks tidak tersedia';
        return [`${item.marker ?? ''}${series.name}: ${indexed} · asli ${format(raw ?? null)} ${series.definition.unit}`];
      })].join('\n');
    } },
    xAxis: { type: 'category', data: years.map(String), axisLine: { lineStyle: { color: '#d9e1ea' } }, axisTick: { show: false }, axisLabel: { color: '#697386' }, boundaryGap: false },
    yAxis: { type: 'value', name: 'Indeks (tahun awal = 100)', nameTextStyle: { color: '#697386', padding: [0, 0, 8, 0] }, scale: true, splitLine: { lineStyle: { color: '#edf0f5' } }, axisLabel: { color: '#697386' } },
    series: plottedSeries.map(item => ({ name: item.name, type: 'line', data: item.values, connectNulls: false, showSymbol: false, symbol: 'none', lineStyle: { color: item.color, width: 2.5, type: item.style.type }, itemStyle: { color: item.color } })),
  };

  const addMetricOptions = metricsInScope.filter(metric => !selectedMetrics.includes(metric));
  const addMetric = addMetricOptions.includes(addMetricChoice as Metric) ? addMetricChoice : addMetricOptions[0] ?? '';
  return <div className="comparison-page">
    <PageHeader title="Perbandingan Data" parent="Ringkasan" description="Bandingkan perkembangan indikator antarwilayah pada rentang tahun yang tersedia." />
    <section className="comparison-controls" aria-label="Pengaturan perbandingan data">
      <div className="comparison-metric-picker"><SearchableSelectField label="Tambah parameter" value={addMetric} onValueChange={value => setAddMetricChoice(value as Metric)} options={addMetricOptions.map(key => ({ value: key, label: metrics[key].name }))} disabled={!addMetricOptions.length} />
        <Button variant="outline" disabled={!addMetric} onClick={() => { if (addMetric) { setSelectedMetrics(current => current.includes(addMetric) ? current : [...current, addMetric]); setAddMetricChoice(''); setFromYear(''); setToYear(''); } }}>Tambah</Button>
      </div>
      <div className="comparison-field comparison-level"><span>Tingkat wilayah</span><div role="group" aria-label="Tingkat wilayah"><Button size="sm" variant={level === 'PROV' ? 'default' : 'outline'} aria-pressed={level === 'PROV'} onClick={() => changeLevel('PROV')}>Provinsi</Button><Button size="sm" variant={level === 'KABKOTA' ? 'default' : 'outline'} aria-pressed={level === 'KABKOTA'} onClick={() => changeLevel('KABKOTA')}>Kabupaten/Kota</Button></div></div>
      {level === 'KABKOTA' && <SearchableSelectField label="Provinsi" value={province || 'none'} onValueChange={value => changeProvince(value === 'none' ? '' : value)} options={[{ value: 'none', label: 'Pilih provinsi' }, ...provinces.map(item => ({ value: item.code, label: item.name }))]} />}
      {selectedMetrics.includes('poverty') && <SearchableSelectField label="Periode" value={period} onValueChange={value => { setPeriod(value); setFromYear(''); setToYear(''); }} options={[{ value: 'Maret', label: 'Maret' }, { value: 'September', label: 'September' }]} />}
      <div className="comparison-region-picker"><SearchableSelectField label={level === 'PROV' ? 'Tambah wilayah pembanding' : 'Tambah kabupaten/kota'} value={addCandidate?.code ?? ''} onValueChange={setAddCode} options={availableToAdd.map(item => ({ value: item.code, label: item.name }))} disabled={!availableToAdd.length || selectedCodes.length >= 5} /><Button variant="outline" onClick={() => addCandidate && setSelectedCodes(current => current.length < 5 ? [...current, addCandidate.code] : current)} disabled={!addCandidate || selectedCodes.length >= 5}>Tambah</Button></div>
      <div className="comparison-year-controls"><div className="comparison-year-range"><SearchableSelectField label="Dari tahun" value={fromYear || String(availableYears[0] ?? '')} onValueChange={value => { setFromYear(value); if (toYear && Number(value) > Number(toYear)) setToYear(value); }} options={availableYears.map(year => ({ value: String(year), label: String(year) }))} disabled={!availableYears.length} /><SearchableSelectField label="Sampai tahun" value={toYear || String(availableYears.at(-1) ?? '')} onValueChange={value => { setToYear(value); if (fromYear && Number(value) < Number(fromYear)) setFromYear(value); }} options={availableYears.map(year => ({ value: String(year), label: String(year) }))} disabled={!availableYears.length} /></div><Button className="comparison-reset" variant="ghost" onClick={reset}>Atur ulang</Button></div>
      <div className="comparison-metric-chips" aria-label="Parameter aktif">{selectedMetrics.map(metric => <span className="comparison-metric-chip" key={metric}>{metrics[metric].name}<button type="button" aria-label={`Hapus parameter ${metrics[metric].name}`} title={selectedMetrics.length === 1 ? 'Minimal satu parameter harus dipilih' : undefined} disabled={selectedMetrics.length === 1} onClick={() => { setSelectedMetrics(current => current.filter(item => item !== metric)); setFromYear(''); setToYear(''); }}><X size={14} /></button></span>)}</div>
    </section>
    <div className="comparison-selection" aria-live="polite"><div><strong>{selectedCodes.length} dari 5 wilayah</strong><span>Pilih sampai lima wilayah untuk dibandingkan pada grafik.</span></div><div className="comparison-chips">{selectedCodes.flatMap((code, index) => { const region = scopeRegions.find(item => item.code === code); return region ? <span className="comparison-chip" key={code}><i style={{ backgroundColor: colors[index % colors.length] }} aria-hidden="true" />{region.name}<button type="button" aria-label={`Hapus ${region.name}`} onClick={() => setSelectedCodes(codes => codes.filter(item => item !== code))}><X size={14} /></button></span> : []; })}</div></div>
    <p className="comparison-context" aria-live="polite">{selectedMetrics.map(metric => metrics[metric].label).join(' · ')} · {years[0] ?? '—'}–{years.at(-1) ?? '—'}{selectedMetrics.includes('poverty') ? ` · ${period}` : ''}</p>
    <section className="comparison-panel" aria-labelledby="comparison-chart-title">
      <header><div><p className="comparison-eyebrow"><ChartNoAxesCombined aria-hidden="true" /> Analisis historis</p><h2 id="comparison-chart-title">Tren indikator menurut wilayah</h2><p>Nilai diindeks terhadap observasi pertama yang tersedia untuk tiap wilayah dan indikator.</p></div></header>
      {plottedSeries.some(item => item.values.some(value => value !== null)) && years.length ? <Chart option={chart} label={`Grafik tren gabungan untuk ${selectedMetrics.length} indikator dan ${selectedCodes.length} wilayah dari ${years[0]} sampai ${years.at(-1)}, indeks tahun awal sama dengan 100`} /> : <div className="comparison-empty"><Info aria-hidden="true"/><div><strong>{level === 'KABKOTA' && !province ? 'Pilih provinsi untuk melihat kabupaten/kota' : plottedSeries.some(item => item.baseline === 0) ? 'Indeks tidak dapat dihitung karena nilai awal bernilai nol' : 'Data belum tersedia untuk pilihan ini'}</strong><p>Nilai asli tetap dapat dilihat pada tabel; grafik hanya menampilkan observasi yang dapat diindeks.</p></div></div>}
      <div className="comparison-chart-keys" aria-label="Keterangan grafik"><div><strong>Indikator</strong>{selectedMetrics.map(metric => <span key={metric}><i data-line={lineStyles[metric].key} />{metrics[metric].name}</span>)}</div><div><strong>Wilayah</strong>{selectedCodes.flatMap((code, index) => { const region = scopeRegions.find(item => item.code === code); return region ? <span key={code}><i style={{ backgroundColor: colors[index % colors.length] }} />{region.name}</span> : []; })}</div></div>
      <details className="comparison-data"><summary>Lihat angka asli per tahun</summary><div className="comparison-table-scroll" tabIndex={0} role="region" aria-label="Nilai asli tiap indikator dan wilayah per tahun, dapat digulir horizontal"><table><thead><tr><th scope="col">Tahun</th>{plottedSeries.map(item => <th scope="col" key={`${item.metric}-${item.region.code}`}><i style={{ backgroundColor: item.color }} aria-hidden="true" />{item.region.name}<small>{item.definition.name}</small></th>)}</tr></thead><tbody>{years.map((year, yearIndex) => <tr key={year}><th scope="row">{year}</th>{plottedSeries.map(item => { const priorIndex = years.indexOf(year - 1); return <td key={`${item.metric}-${item.region.code}`}><span>{format(item.rawValues[yearIndex])} {item.definition.unit}</span><TrendDelta current={item.rawValues[yearIndex]} previous={priorIndex >= 0 ? item.rawValues[priorIndex] : null} year={year} /></td>; })}</tr>)}</tbody></table></div></details>
      <footer><span><i aria-hidden="true" /> Warna menunjukkan wilayah · pola garis menunjukkan indikator</span><p>Indeks memudahkan perbandingan tren; angka asli tersedia pada tabel dan tooltip.</p></footer>
    </section>
    <section className="comparison-period-note"><Info aria-hidden="true"/><p>Sumber menyediakan data tahunan; data kemiskinan juga dibedakan menurut periode Maret dan September. Tanggal harian tidak tersedia.</p></section>
  </div>;
}
