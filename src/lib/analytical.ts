export type AnalyticalModule = 'kfd' | 'poverty' | 'eppd' | 'rpjmd';
export type AnalyticalRecord = {
  id: string; sheet: string; row: number; sourceCode: string | null; code: string | null;
  name: string; year: number | null; period: string | null; value: number | null;
  end: number | null; category: string | null; indicator: string | null; unit: string | null;
  issues: string[]; raw: Record<string, string | number | null | undefined>;
};
export type AnalyticalData = {
  records: AnalyticalRecord[];
  excluded: { sheet: string; row: number; reason: string; raw: Record<string, string | number | null | undefined> }[];
  definitions?: Record<string, string | number | null>[];
  rawNote?: string;
};

export const analyticalModules = {
  kfd: { title: 'Data KFD', description: 'Telusuri rasio kapasitas fiskal daerah dan kategori yang tercatat pada sumber.', value: 'Rasio KFD', category: 'Kategori', sheet: 'fact_kfd' },
  poverty: { title: 'Data Kemiskinan', description: 'Telusuri persentase penduduk miskin, jumlah penduduk, dan garis kemiskinan per periode.', value: 'Penduduk miskin (%)', category: '', sheet: 'fact_kemiskinan' },
  eppd: { title: 'Data EPPD', description: 'Telusuri skor dan status evaluasi penyelenggaraan pemerintahan daerah.', value: 'Skor EPPD', category: 'Status EPPD', sheet: 'fact_eppd' },
  rpjmd: { title: 'Data RPJMD', description: 'Telusuri realisasi, target, dan nilai awal–akhir indikator sesuai istilah sumber.', value: 'Nilai awal', category: 'Tipe', sheet: 'fact_rpjmd_prov' },
} as const;

export const analyticalFormat = (value: number | null | undefined) => value == null ? '—' : value.toLocaleString('id-ID', { maximumFractionDigits: 4 });

/** Only compare one unambiguous observation for the same code, series and period. */
export function seriesValue(records: AnalyticalRecord[], record: AnalyticalRecord, year: number): number | null {
  if (!record.code) return null;
  const matches = records.filter(r => r.code === record.code && r.sheet === record.sheet && r.year === year && r.period === record.period && r.indicator === record.indicator && r.unit === record.unit && (!record.indicator || r.category === record.category));
  return matches.length === 1 ? matches[0].value : null;
}

export function sortAnalytical(records: AnalyticalRecord[], sort: string): AnalyticalRecord[] {
  return [...records].sort((a, b) => {
    const tie = a.name.localeCompare(b.name, 'id') || (a.year ?? Infinity) - (b.year ?? Infinity) || a.row - b.row;
    if (sort === 'name') return tie;
    if (sort === 'year') return (b.year ?? -Infinity) - (a.year ?? -Infinity) || tie;
    if (a.value == null && b.value == null) return tie;
    if (a.value == null) return 1;
    if (b.value == null) return -1;
    return (sort === 'high' ? b.value - a.value : a.value - b.value) || tie;
  });
}
