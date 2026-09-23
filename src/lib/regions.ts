import regions from "@/data/regions.json";

export { regions };
export type RegionRecord = typeof regions[number];
export const regionByCode = new Map(regions.map(region => [region.code, region]));
export const provinces = regions.filter(region => region.level === "PROV");
export const provinceOptions = [{ value: "all", label: "Semua provinsi" }, ...provinces.map(r => ({ value: r.code, label: r.name }))];
export const levelName = (level: string) => level === "PROV" ? "Provinsi" : level === "KOTA" ? "Kota" : "Kabupaten";
export const spatialStatus = (r: RegionRecord) => r.boundary ? "boundary" : r.longitude !== null ? "point" : "missing";
export const spatialLabels: Record<string, string> = { boundary: "Batas terbaca", point: "Batas tidak tersedia · titik lokasi", missing: "Batas dan titik tidak tersedia" };
export const matchesQuery = (query: string, ...values: string[]) => values.join(" ").toLocaleLowerCase("id").includes(query.trim().toLocaleLowerCase("id"));
export const scoreFormat = (value: number | null) => value === null ? "—" : value.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
