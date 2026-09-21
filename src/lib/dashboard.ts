import data from "@/data/dashboard.json";

export { data };
export type Metric = "idsd" | "kfd" | "eppd" | "poverty";
export type Province = typeof data.regions[number];
export const metrics: Record<Metric, { label: string; name: string; unit: string; sheet: string }> = {
  idsd: { label: "IDSD", name: "Indeks Daya Saing Daerah", unit: "skor", sheet: "fact_total_idsd" },
  kfd: { label: "KFD", name: "Kapasitas Fiskal Daerah", unit: "rasio", sheet: "fact_kfd" },
  eppd: { label: "EPPD", name: "Evaluasi Penyelenggaraan Pemerintahan Daerah", unit: "skor", sheet: "fact_eppd" },
  poverty: { label: "Kemiskinan", name: "Persentase Penduduk Miskin", unit: "%", sheet: "fact_kemiskinan" },
};
export const metricKeys = Object.keys(metrics) as Metric[];
export const format = (n: number | null | undefined, digits = 2) => n == null ? "—" : n.toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits });
export const mean = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
export function observation(metric: Metric, year: number, code: string, period: string) {
  return data.records.find(r => r.metric === metric && r.year === year && r.code === code && (metric !== "poverty" || r.period === period));
}
export function valuesFor(metric: Metric, year: number, period: string) {
  return data.regions.map(region => ({ ...region, value: observation(metric, year, region.code, period)?.value ?? null }));
}
export const hasValue = <T extends { value: number | null }>(r: T): r is T & { value: number } => r.value !== null;
export const mapColors = ["#d5e6f4", "#a2c8e5", "#6ba5d0", "#347db4", "#124a78"];
export function valueColor(value: number | null, min: number, max: number) {
  return value === null ? "#d5dbe4" : mapColors[max === min ? 2 : Math.min(4, Math.floor((value - min) / (max - min) * 5))];
}
