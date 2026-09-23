import sample from './import-samples.json';
import { type Dataset, type RawRow } from '../lib/import-validation';

export type Review = 'pending' | 'reviewed' | 'accepted' | 'rejected';
export type DemoRow = { id: string; dataset: Dataset; raw: RawRow; original: RawRow; sheet: string; sourceRow: number; note: string; review: Review };
export const references = { codes: sample.regions.map(r => r.code), years: sample.years, pillarIds: sample.pillarIds };
export const regionReference = new Map(sample.regions.map(r => [r.code, r]));
export const sourceWorkbook = sample.workbook;
export type Scenario = 'mixed' | 'clean' | 'invalid';
export function demoRows(dataset: Dataset, scenario: Scenario): DemoRow[] {
  const records = dataset === 'total' ? sample.totals : sample.pillars;
  return records.map((r, index) => {
    const original: RawRow = { year: r.year, code: r.code, indicator: r.indicator, value: r.value };
    let raw = { ...original };
    let note = 'Nilai sampel sesuai fixture workbook; bukan hasil pembacaan file pilihan.';
    if (scenario === 'invalid') { raw.value = ''; note = 'Skenario demo: nilai sengaja dikosongkan.'; }
    if (scenario === 'mixed') {
      if (index === 1) { raw = { year: records[0].year, code: records[0].code, indicator: records[0].indicator, value: records[0].value }; note = 'Skenario demo: baris diganti dengan salinan baris pertama untuk menunjukkan duplikat.'; }
      if (index === 2) { raw.value = ''; note = 'Skenario demo: nilai sengaja dikosongkan.'; }
      if (index === 3) { raw.value = 'abc'; note = 'Skenario demo: nilai diubah menjadi teks nonnumerik.'; }
      if (index === 4) { raw.year = '2030'; note = 'Skenario demo: tahun diubah ke 2030 yang belum ada pada referensi.'; }
    }
    return { id: `${dataset}-${index}`, dataset, raw, original, sheet: r.sheet, sourceRow: r.sourceRow, note, review: 'pending' };
  });
}
