export type Dataset = 'total' | 'pillar';
export type RawRow = { year: string; code: string; indicator: string; value: string };
export type Quality = 'valid' | 'warning' | 'duplicate' | 'empty' | 'error';
export type Finding = { status: Quality; messages: string[] };
export const qualityLabels: Record<Quality, string> = { valid: 'Valid', warning: 'Perlu tinjau', duplicate: 'Duplikat', empty: 'Nilai kosong', error: 'Tidak valid' };
export const datasetLabels: Record<Dataset, string> = { total: 'IDSD · skor total', pillar: 'IDSD · skor pilar' };
export const fieldLabels: Record<keyof RawRow, string> = { year: 'Tahun', code: 'Kode wilayah', indicator: 'Kode indikator / ID pilar', value: 'Nilai' };
export const fields = Object.keys(fieldLabels) as (keyof RawRow)[];
export function fileError(file: { name: string; size: number }) {
  if (!/\.(xlsx|xls|csv)$/i.test(file.name)) return 'Pilih file .xlsx, .xls, atau .csv.';
  if (!file.size) return 'File kosong. Pilih file yang berisi data.';
  return '';
}
export function validateRows(rows: RawRow[], dataset: Dataset, references: { codes: string[]; years: number[]; pillarIds: string[] }): Finding[] {
  const codes = new Set(references.codes);
  const keys = rows.map(r => [r.year.trim(), r.code.trim(), r.indicator.trim()].join('|'));
  const counts = new Map<string, number>();
  keys.forEach(k => counts.set(k, (counts.get(k) ?? 0) + 1));
  return rows.map((raw, i) => {
    const r = Object.fromEntries(fields.map(f => [f, raw[f].trim()])) as RawRow;
    const missing = fields.filter(f => !r[f]);
    const errors: string[] = [];
    if (r.year && !/^[1-9]\d{3}$/.test(r.year)) errors.push('Tahun harus berupa empat digit (1000–9999).');
    if (r.code && !codes.has(r.code)) errors.push('Kode wilayah tidak ditemukan pada dim_wilayah.');
    if (r.indicator && (dataset === 'total' ? r.indicator !== 'IDSD' : !references.pillarIds.includes(r.indicator))) errors.push(dataset === 'total' ? 'Gunakan kode IDSD untuk skor total.' : 'ID pilar tidak ditemukan pada dim_pilar_idsd.');
    const numeric = /^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(r.value) && Number.isFinite(Number(r.value.replace(',', '.')));
    if (r.value && !numeric) errors.push('Nilai harus numerik; desimal boleh memakai titik atau koma.');
    if (numeric && dataset === 'total' && (Number(r.value.replace(',', '.')) < 1 || Number(r.value.replace(',', '.')) > 5)) errors.push('Skor total IDSD harus 1–5 menurut aturan import PRD. Nilai sumber tidak diubah.');
    const messages = [...missing.map(f => `${fieldLabels[f]} wajib diisi.`), ...errors];
    if (missing.length) return { status: 'empty', messages };
    if (errors.length) return { status: 'error', messages };
    if ((counts.get(keys[i]) ?? 0) > 1) return { status: 'duplicate', messages: ['Kombinasi tahun, kode wilayah, dan indikator berulang dalam sampel. Tentukan baris yang benar; tidak digabung otomatis.'] };
    if (!references.years.includes(Number(r.year))) return { status: 'warning', messages: ['Tahun belum tersedia pada referensi dim_waktu. Konfirmasikan periode sebelum menerima data.'] };
    return { status: 'valid', messages: ['Field wajib, format angka, tahun, referensi wilayah/indikator, dan keunikan dalam sampel lolos pemeriksaan.'] };
  });
}
