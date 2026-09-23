export type IndicatorDraft = {
  id: string; name: string; groupCode: string; groupName: string; unit: string;
  baseline: string; target: string; period: string; start: string; end: string;
};
export type YearDraft = { year: string; sequence: string };
export type Errors<T> = Partial<Record<keyof T, string>>;
const validYear = (value: string) => /^\d{4}$/.test(value) && Number(value) >= 1000;
const decimal = (value: string) => /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(value.trim()) && Number.isFinite(Number(value.trim().replace(",", ".")));
export const optionalNumber = (value: string) => value.trim() === "" ? null : Number(value.trim().replace(",", "."));

export function validateIndicator(draft: IndicatorDraft, existingIds: number[]): Errors<IndicatorDraft> {
  const errors: Errors<IndicatorDraft> = {};
  if (!/^\d+$/.test(draft.id) || !Number.isSafeInteger(Number(draft.id)) || Number(draft.id) < 1) errors.id = "Gunakan ID berupa bilangan bulat positif.";
  else if (existingIds.includes(Number(draft.id))) errors.id = "ID indikator sudah digunakan.";
  if (!draft.name.trim()) errors.name = "Nama indikator wajib diisi.";
  if (!draft.groupCode.trim()) errors.groupCode = "Kode sasaran wajib diisi.";
  if (!draft.groupName.trim()) errors.groupName = "Nama sasaran wajib diisi.";
  if (!draft.unit.trim()) errors.unit = "Satuan wajib diisi.";
  if (draft.baseline.trim() && !decimal(draft.baseline)) errors.baseline = "Masukkan angka yang valid, misalnya 0,62.";
  if (draft.target.trim() && !decimal(draft.target)) errors.target = "Masukkan angka yang valid, misalnya 0,70.";
  if (draft.start || draft.end) {
    if (!validYear(draft.start)) errors.start = "Isi tahun mulai dengan empat digit (1000–9999).";
    if (!validYear(draft.end)) errors.end = "Isi tahun selesai dengan empat digit (1000–9999).";
    else if (!errors.start && Number(draft.end) < Number(draft.start)) errors.end = "Tahun selesai tidak boleh sebelum tahun mulai.";
  }
  return errors;
}

export function validateYear(draft: YearDraft, existingYears: number[]): Errors<YearDraft> {
  const errors: Errors<YearDraft> = {};
  if (!validYear(draft.year)) errors.year = "Masukkan tahun empat digit antara 1000 dan 9999.";
  else if (existingYears.includes(Number(draft.year))) errors.year = "Tahun ini sudah ada. Gunakan tahun yang berbeda.";
  if (draft.sequence && (!/^\d+$/.test(draft.sequence) || !Number.isSafeInteger(Number(draft.sequence)) || Number(draft.sequence) < 1)) errors.sequence = "Urutan tahun RPJMD harus berupa bilangan bulat positif.";
  return errors;
}
