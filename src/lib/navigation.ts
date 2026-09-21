import { LayoutDashboard, Map, FileChartColumn, Landmark, Users, ClipboardList, Target, ListTree, CalendarDays, Upload, ClipboardCheck, ShieldCheck, History, Settings, PanelsTopLeft, type LucideIcon } from "lucide-react";

export type NavigationItem = { slug: string; label: string; icon: LucideIcon; phase: number };
export const navigation: { label: string; items: NavigationItem[] }[] = [
  { label: "Ringkasan", items: [{ slug: "dashboard", label: "Dashboard", icon: LayoutDashboard, phase: 2 }] },
  { label: "Kelola Data", items: [
    { slug: "regions", label: "Data Wilayah", icon: Map, phase: 3 },
    { slug: "idsd", label: "Data IDSD", icon: FileChartColumn, phase: 3 },
    { slug: "kfd", label: "Data KFD", icon: Landmark, phase: 6 },
    { slug: "poverty", label: "Data Kemiskinan", icon: Users, phase: 6 },
    { slug: "eppd", label: "Data EPPD", icon: ClipboardList, phase: 6 },
    { slug: "rpjmd", label: "Data RPJMD", icon: Target, phase: 6 },
  ] },
  { label: "Master Data", items: [
    { slug: "indicators", label: "Master Indikator", icon: ListTree, phase: 4 },
    { slug: "years", label: "Master Tahun", icon: CalendarDays, phase: 4 },
  ] },
  { label: "Pengelolaan Data", items: [
    { slug: "import", label: "Import Data", icon: Upload, phase: 5 },
    { slug: "validation", label: "Validasi Data", icon: ClipboardCheck, phase: 5 },
  ] },
  { label: "Sistem", items: [
    { slug: "users", label: "Manajemen Pengguna", icon: Users, phase: 6 },
    { slug: "roles", label: "Role & Hak Akses", icon: ShieldCheck, phase: 6 },
    { slug: "activity", label: "Log Aktivitas", icon: History, phase: 6 },
    { slug: "settings", label: "Pengaturan", icon: Settings, phase: 6 },
  ] },
];

export const foundationItem: NavigationItem = { slug: "foundation", label: "Fondasi antarmuka", icon: PanelsTopLeft, phase: 1 };
