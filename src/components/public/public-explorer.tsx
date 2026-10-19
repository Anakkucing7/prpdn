"use client";

import { RegionLevel, RegionalControls } from '@/components/data/regional-controls';
import { matchesRegion } from '@/lib/regional-filter';
import { MapPinned, ArrowUpRight, Info, RotateCcw, SlidersHorizontal, Check } from 'lucide-react';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui-patterns';
import { YearMultiSelect } from '@/components/data/year-multi-select';
import { DataFilters, NoResults, Pagination } from '@/components/data/data-controls';
import { TrendDelta } from '@/components/trend-delta';
import { regions, matchesQuery, levelName } from '@/lib/regions';
import {
  data,
  metrics,
  metricKeys,
  observation,
  format,
  mean,
  valueColor,
  mapColors,
  type Metric,
} from '@/lib/dashboard';
import { idsdObservation, idsdYears } from '@/lib/idsd-observations';
import { deltaText } from '@/lib/trend';

const RegionMap = dynamic(() => import('@/components/data/region-map'), {
  ssr: false,
  loading: () => <p className="map-loading-text" role="status">Memuat peta wilayah…</p>,
});

const Chart = dynamic(() => import('@/components/dashboard/analytics-chart'), {
  ssr: false,
  loading: () => <p className="chart-loading-text" role="status">Memuat grafik…</p>,
});

export default function PublicExplorer() {
  const [level, setLevel] = useState('PROV');
  const [province, setProvince] = useState('all');
  const [kind, setKind] = useState('all');
  const [metric, setMetric] = useState<Metric>('idsd');
  const [year, setYear] = useState(2024);
  const [comparisonYears, setComparisonYears] = useState<number[]>([2024]);
  const [period, setPeriod] = useState('Maret');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const years =
    metric === 'idsd'
      ? idsdYears
      : [...new Set(data.records.filter((r) => r.metric === metric).map((r) => r.year))].sort();
  const mapYears = comparisonYears.filter(value => years.includes(value)).slice(-3);
  const visibleMapYears = mapYears.length ? mapYears : years.slice(-3);

  function selectMapYear(value: number) {
    if (visibleMapYears.includes(value)) setYear(value);
  }

  function toggleMapYear(value: number) {
    if (visibleMapYears.includes(value)) {
      if (visibleMapYears.length === 1) return;
      const next = visibleMapYears.filter(item => item !== value);
      setComparisonYears(next);
      if (value === year) setYear(next.at(-1)!);
    } else if (visibleMapYears.length < 3) { setComparisonYears([...visibleMapYears, value].sort((a,b) => a-b)); setYear(value); }
  }

  const scopedRegions = regions.filter((r) => matchesRegion(r, level, province, kind));
  const filtered = scopedRegions.filter((r) => matchesQuery(query, r.code, r.name));

  const value = (code: string, y: number) =>
    metric === 'idsd'
      ? idsdObservation(code, y)?.value ?? null
      : observation(metric, y, code, period)?.value ?? null;

  const values = filtered.flatMap((r) => {
    const v = value(r.code, year);
    return v === null ? [] : [v];
  });

  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;

  const colors = Object.fromEntries(filtered.map((r) => [r.code, valueColor(value(r.code, year), min, max)]));
  const descriptions = Object.fromEntries(filtered.map((region) => [region.code,
    `${metrics[metric].label}\n${visibleMapYears.map(selectedYear => `${selectedYear}: ${format(value(region.code, selectedYear))} ${metrics[metric].unit}`).join('\n')}`,
  ]));

  const region = filtered.find((r) => r.code === selected);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10)));
  const cohort = scopedRegions.filter((r) => years.every((y) => value(r.code, y) !== null));
  const trend = years.map((y) => ({
    year: y,
    value: region ? value(region.code, y) : mean(cohort.map((r) => value(r.code, y)!)),
  }));

  function change(action: () => void) {
    action();
    setPage(1);
    setSelected(null);
  }

  function reset() {
    change(() => {
      setLevel('PROV');
      setProvince('all');
      setKind('all');
      setQuery('');
      setMetric('idsd');
      setYear(2024);
      setComparisonYears([2024]);
      setPeriod('Maret');
    });
  }

  function select(code: string) {
    setSelected(code);
    let index = filtered.findIndex((r) => r.code === code);
    if (index < 0) {
      setQuery('');
      index = scopedRegions.findIndex((r) => r.code === code);
    }
    setPage(Math.max(1, Math.floor(index / 10) + 1));
  }

  function drill() {
    if (!region) return;
    change(() => {
      setProvince(region.code);
      setLevel('KABKOTA');
      setKind('all');
      setQuery('');
      setMetric('idsd');
      setYear(2024);
      setComparisonYears(idsdYears.slice(-3));
    });
  }

  return (
    <section id="data" className="public-explorer">
      {/* Section Header */}
      <div className="public-section-heading">
        <div>
          <p className="public-eyebrow">Eksplorasi wilayah</p>
          <h2>Jelajahi Indonesia melalui data.</h2>
          <p>Pilih indikator, bandingkan performa antarwilayah, lalu telusuri konteks pembangunan daerah.</p>
        </div>
        <span className="public-source-tag">Tahun data {years.join(', ')}</span>
      </div>

      {/* Main Exploration Workspace */}
      <div className="exploration-workspace" id="peta">
        <div className="explore-controls">
          <div className="explore-toolbar-heading">
            <div><SlidersHorizontal size={16} aria-hidden="true" /><h3>Atur tampilan data</h3></div>
            <a href="#perbandingan">Lihat tren & perbandingan <ArrowUpRight size={14} aria-hidden="true" /></a>
          </div>
          <div className="explore-primary">
            <RegionLevel
              value={level}
              onChange={(v) => {
                if (v !== level)
                  change(() => {
                    setLevel(v);
                    setKind('all');
                    setProvince('all');
                    setMetric('idsd');
                    setYear(2024);
                    setComparisonYears([2024]);
                  });
              }}
            />
            <SelectField
              label="Indikator"
              value={metric}
              onValueChange={(v) => {
                const nextMetric = v as Metric;
                const availableYears = nextMetric === 'idsd'
                  ? idsdYears
                  : [...new Set(data.records.filter((r) => r.metric === nextMetric).map((r) => r.year))].sort();
                const latestYear = Math.max(...availableYears);
                change(() => {
                  setMetric(nextMetric);
                  if (nextMetric !== 'idsd' && level === 'KABKOTA') {
                    setLevel('PROV');
                    setProvince('all');
                    setKind('all');
                  }
                  setYear(latestYear);
                  setComparisonYears([latestYear]);
                });
              }}
              options={metricKeys.map((m) => ({
                value: m,
                label: `${metrics[m].name}${level === 'KABKOTA' && m !== 'idsd' ? ' · data provinsi' : ''}`,
              }))}
            />
            <YearMultiSelect years={[...years].reverse()} selected={visibleMapYears} onToggle={toggleMapYear} />
            {metric === 'poverty' && (
              <SelectField
                label="Periode"
                value={period}
                onValueChange={setPeriod}
                options={['Maret', 'September'].map((p) => ({ value: p, label: p }))}
              />
            )}
          </div>

          <DataFilters
            query={query}
            onQuery={(q) => change(() => setQuery(q))}
            onReset={reset}
            summary={`${filtered.length} wilayah ditampilkan · ${values.length} dengan nilai ${year}${
              level === 'KABKOTA' ? ' · IDSD tersedia untuk kabupaten/kota' : ''
            }`}
          >
            <RegionalControls
              level={level}
              province={province}
              kind={kind}
              selected={selected ?? 'all'}
              onChange={(field, v) => {
                if (field === 'region') {
                  if (v === 'all') setSelected(null);
                  else select(v);
                } else
                  change(() => {
                    if (field === 'province') setProvince(v);
                    else setKind(v);
                  });
              }}
            />
          </DataFilters>
        </div>

        {/* Map Layout & Region Summary */}
        <div className="public-map-layout">
          <section className="data-panel public-map-panel">
            <header className="data-panel-heading">
              <div>
                <p className="public-panel-kicker">Peta indikator</p>
                <h3>{metrics[metric].name}</h3>
                <p>
                  {year} · {level === 'PROV' ? 'Provinsi' : 'Kabupaten/Kota'} · klik batas untuk memilih wilayah
                </p>
              </div>
              {selected && (
                <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
                  <RotateCcw size={13} className="mr-1" />
                  <span>Lihat semua</span>
                </Button>
              )}
            </header>

            <RegionMap
              regions={filtered}
              selected={region?.code ?? null}
              onSelect={select}
              colors={colors}
              descriptions={descriptions}
              comparisonYears={visibleMapYears}
              mapYear={year}
              onMapYearChange={selectMapYear}
            />

            <div className="public-map-legend">
              <div className="public-color-scale">
                <span className="public-legend-label">Nilai ({metrics[metric].unit})</span>
                <span>{format(values.length ? min : null)}</span>
                <div aria-hidden="true">
                  {mapColors.map((c) => (
                    <i key={c} style={{ background: c }} />
                  ))}
                </div>
                <span>
                  {format(values.length ? max : null)} {metrics[metric].unit}
                </span>
              </div>
              <span className="public-no-data">
                <i />
                Tidak tersedia
              </span>
            </div>
            <p className="public-map-guidance">Warna lebih gelap menunjukkan nilai lebih tinggi. Pilih wilayah pada peta atau tabel untuk membaca profilnya.</p>
          </section>

          <aside className="public-region-summary" aria-live="polite">
            <div className="summary-kicker">
              <MapPinned size={16} aria-hidden="true" />
              <span>{region ? levelName(region.level) : 'Gambaran wilayah'}</span>
            </div>

            <h3 className="summary-region-title">
              {region?.name ??
                (province === 'all'
                  ? 'Indonesia'
                  : regions.find((r) => r.code === province)?.name)}
            </h3>

            {region ? (
              <>
                <p className="summary-code">Kode wilayah {region.code}</p>
                <div className="public-score-years" aria-label={`Nilai ${metrics[metric].label} untuk tahun yang dipilih`}>
                  {visibleMapYears.map(selectedYear => <div className="public-score" key={selectedYear}>
                    <span>{metrics[metric].label} {selectedYear}</span>
                    <div className="score-val-row"><strong>{format(value(region.code, selectedYear))}</strong><small>{metrics[metric].unit}</small></div>
                  </div>)}
                </div>
                <p className="summary-subtext">Bandingkan perubahan antarwaktu pada grafik dan tabel di bawah peta.</p>
                {region.level === 'PROV' && (
                  <Button onClick={drill} className="drill-kabkota-btn">
                    <span>Jelajahi kabupaten/kota</span>
                    <ArrowUpRight size={15} />
                  </Button>
                )}
                <a className="summary-data-link" href="#perbandingan">
                  <span>Lihat perbandingan wilayah</span>
                  <ArrowUpRight size={14} />
                </a>
              </>
            ) : (
              <>
                <p className="summary-subtext">
                  {metrics[metric].name} pada tingkat {level === 'PROV' ? 'provinsi' : 'kabupaten/kota'}.
                </p>
                <div className="public-score-years" aria-label="Ketersediaan nilai untuk tahun yang dipilih">
                  {visibleMapYears.map(selectedYear => {
                    const availableCount = filtered.filter(item => value(item.code, selectedYear) !== null).length;
                    return <div className="public-score" key={selectedYear}>
                      <span>Ketersediaan nilai {selectedYear}</span>
                      <div className="score-val-row"><strong>{availableCount}</strong><small>/ {filtered.length} wilayah</small></div>
                      <progress max={Math.max(1, filtered.length)} value={availableCount} aria-label={`${availableCount} dari ${filtered.length} wilayah memiliki nilai pada ${selectedYear}`} />
                    </div>;
                  })}
                </div>
                <div className="map-selection-hint">
                  <MapPinned size={18} aria-hidden="true" />
                  <p>Pilih batas pada peta atau nama di tabel untuk melihat profil wilayah.</p>
                </div>
              </>
            )}

            <details className="public-source-detail">
              <summary>
                <Info size={14} aria-hidden="true" />
                <span>Cara membaca data</span>
              </summary>
              <div className="detail-body">
                <p>
                  Warna lebih gelap menunjukkan nilai lebih tinggi, bukan otomatis hasil lebih baik. Perubahan ditampilkan netral.
                </p>
                <p>
                  Sumber: data {metrics[metric].name}. Nilai 0 mengikuti catatan sumber; nilai kosong berarti belum tersedia. Batas terkini dapat berbeda dari wilayah historis.
                </p>
              </div>
            </details>
          </aside>
        </div>
      </div>

      {/* Analytics & Comparison Grid */}
      <div className="public-analysis" id="perbandingan">
        <section className="data-panel public-trend-panel">
          <header className="data-panel-heading">
            <div>
              <p className="public-panel-kicker">Analisis antarwaktu</p>
              <h3>Tren {metrics[metric].label}</h3>
              <p>
                {region?.name ??
                  `Rerata tetap ${cohort.length} ${
                    level === 'PROV' ? 'provinsi' : 'kabupaten/kota'
                  } · bukan indeks nasional`}
              </p>
            </div>
          </header>

          <div className="public-trend-content">
          {trend.some(point => point.value !== null) ? <Chart
            label={`Tren ${metrics[metric].label}; nilai tersedia pada tabel tren`}
            option={{
              animationDuration: 300,
              animationDurationUpdate: 200,
              grid: { left: 56, right: 28, top: 38, bottom: 38 },
              tooltip: {
                trigger: 'axis',
                confine: true,
                renderMode: 'richText',
                backgroundColor: '#071b34',
                borderWidth: 0,
                textStyle: { color: '#f8fafd', fontSize: 13, lineHeight: 22 },
                padding: [12, 16],
                axisPointer: { type: 'line', lineStyle: { color: '#8aa6bf', type: 'solid' } },
                formatter: (params) => {
                  const p = Array.isArray(params) ? params[0] : params;
                  const point = trend[p.dataIndex];
                  return `${point.year}: ${format(point.value)}\n${deltaText(
                    point.value,
                    trend.find((t) => t.year === point.year - 1)?.value,
                    point.year - 1
                  )}`;
                },
              },
              xAxis: {
                type: 'category',
                data: years.map(String),
                axisLine: { lineStyle: { color: '#cbd7e3' } },
                axisLabel: { color: '#4f6378', fontSize: 13, hideOverlap: true, margin: 14 },
                axisTick: { show: false },
              },
              yAxis: {
                type: 'value',
                name: metrics[metric].unit,
                nameTextStyle: { color: '#4f6378', fontSize: 13, align: 'left' },
                splitLine: { lineStyle: { color: '#e4ecf4' } },
                axisLabel: { color: '#4f6378', fontSize: 13 },
              },
              series: [
                {
                  type: 'line',
                  data: trend.map((t) => t.value),
                  connectNulls: false,
                  symbol: 'circle',
                  symbolSize: 5,
                  lineStyle: { color: '#255c89', width: 3 },
                  itemStyle: { color: '#255c89', borderColor: '#fff', borderWidth: 1 },
                  areaStyle: { color: '#e4ecf4', opacity: 0.5 },
                },
              ],
            }}
          /> : <div className="data-empty" role="status"><Info aria-hidden="true" /><h3>Tren belum tersedia</h3><p>{region ? 'Belum ada nilai untuk wilayah ini.' : 'Tidak ada wilayah dengan data lengkap di seluruh tahun.'} Pilih wilayah atau indikator lain.</p></div>}

          <div className="public-table-scroll" tabIndex={0} role="region" aria-label="Nilai grafik tren">
            <table className="data-table">
              <caption className="sr-only">Tren {metrics[metric].label}, {region?.name ?? 'rerata wilayah'}, satuan {metrics[metric].unit}</caption>
              <thead>
                <tr>
                  <th scope="col">Tahun</th>
                  <th scope="col">Nilai ({metrics[metric].unit})</th>
                  <th scope="col">Perubahan tahunan</th>
                </tr>
              </thead>
              <tbody>
                {trend.map((t) => (
                  <tr key={t.year}>
                    <td>{t.year}</td>
                    <td>{format(t.value)}</td>
                    <td>
                      <TrendDelta
                        current={t.value}
                        previous={trend.find((p) => p.year === t.year - 1)?.value}
                        year={t.year}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
          <p className="public-panel-note">
            Rerata menggunakan wilayah yang memiliki nilai di seluruh tahun yang ditampilkan. Delta membandingkan tahun sebelumnya pada periode yang sama; pemekaran dapat membatasi kesetaraan data.
          </p>
        </section>

        <section className="data-panel public-comparison-panel">
          <header className="data-panel-heading">
            <div>
              <p className="public-panel-kicker">Analisis antarwilayah</p>
              <h3>Perbandingan wilayah</h3>
              <p>{metrics[metric].label} {year} · pilih wilayah untuk melihat profil</p>
            </div>
            {region && (
              <a className="summary-data-link" href="#peta">
                <span>Lihat di peta</span>
                <ArrowUpRight size={14} />
              </a>
            )}
          </header>

          {filtered.length ? (
            <>
              <p className="public-table-hint" id="public-comparison-help">Geser tabel ke samping untuk melihat seluruh kolom. Pilih nama wilayah untuk memperbarui profil dan grafik.</p>
              <div
                className="public-table-scroll"
                tabIndex={0}
                role="region"
                aria-label="Tabel perbandingan wilayah"
                aria-describedby="public-comparison-help"
              >
                <table className="data-table">
                  <caption className="sr-only">Perbandingan {metrics[metric].name} tahun {year}</caption>
                  <thead>
                    <tr>
                      <th scope="col">Wilayah</th>
                      <th scope="col">Nilai ({metrics[metric].unit})</th>
                      <th scope="col">Perubahan tahunan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered
                      .slice((currentPage - 1) * 10, currentPage * 10)
                      .map((r) => (
                        <tr key={r.code} data-selected={r.code === selected}>
                          <td>
                            <button
                              onClick={() => select(r.code)}
                              className="public-region-link"
                              aria-pressed={r.code === selected}
                            >
                              {r.name}
                              {r.code === selected && <Check size={14} aria-hidden="true" />}
                            </button>
                            <small>{r.code}</small>
                          </td>
                          <td className="score-cell-bold">{format(value(r.code, year))}</td>
                          <td>
                            <TrendDelta
                              current={value(r.code, year)}
                              previous={value(r.code, year - 1)}
                              year={year}
                            />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={currentPage}
                total={filtered.length}
                size={10}
                onPage={setPage}
              />
            </>
          ) : (
            <NoResults onReset={reset} />
          )}
        </section>
      </div>
    </section>
  );
}
