// A deliberately small source-derived slice, not a complete region dataset.
export type Region = {
  code: string;
  name: string;
  province: string;
  island: string;
  level: "PROV" | "KAB";
  active: boolean;
  sourceRow: number;
};

export const regionSource = {
  workbook: "Dataset Dashboard 040526.xlsx",
  sheet: "dim_wilayah",
};

export const regions: Region[] = [
  { code: "11", name: "Aceh", province: "ACEH", island: "SUMATERA", level: "PROV", active: true, sourceRow: 2 },
  { code: "31", name: "Daerah Khusus Ibukota Jakarta", province: "DKI JAKARTA", island: "JAWA", level: "PROV", active: true, sourceRow: 27689 },
  { code: "34", name: "Daerah Istimewa Yogyakarta", province: "DI YOGYAKARTA", island: "JAWA", level: "PROV", active: true, sourceRow: 43794 },
  { code: "1101", name: "Kabupaten Aceh Selatan", province: "ACEH", island: "SUMATERA", level: "KAB", active: true, sourceRow: 3 },
];

// Operational data is explicitly demo-only; no real account or authentication.
export const demoUser = { name: "Admin Demo", role: "Administrator", initials: "AD" };
