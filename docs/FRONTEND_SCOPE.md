# FRONTEND_SCOPE — PRPDN

> **Project:** PRPDN — Dashboard Spasial Terintegrasi Indikator Pembangunan Daerah  
> **Current Phase:** Frontend / UI Prototype  
> **Status:** Active implementation scope  
> **Master Requirement:** `docs/PRD.md`  
> **Design Guidance:** `docs/DESIGN_DIRECTION.md`  
> **Primary Data Source:** `data/Dataset Dashboard 040526.xlsx`

> **Arah produksi (Phase 5.5):** Next.js → Backend/API → Prisma → MySQL. Lihat [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md). Phase 1–5 tetap prototipe frontend dengan fixture/state lokal, bukan arsitektur penyimpanan final. UI CRUD yang ada akan dihubungkan ke API/database pada fase backend; implementasi backend belum termasuk scope saat ini.

---

# 1. Purpose of This Document

Dokumen ini membatasi **scope implementasi saat ini** agar agent AI tidak mengerjakan seluruh arsitektur production yang tercantum pada PRD sekaligus.

`PRD.md` tetap menjadi **source of truth untuk product requirement secara keseluruhan**.

Untuk fase sekarang:

> **Fokus utama adalah membangun frontend/UI yang production-quality secara visual dan interaction design, menggunakan data realistis dari dataset yang tersedia, tanpa membangun backend production penuh.**

Dokumen ini **tidak menggantikan PRD**. Dokumen ini hanya menentukan bagian mana dari PRD yang dikerjakan pada fase frontend.

Jika terdapat konflik:

1. `PRD.md` menentukan kebutuhan dan tujuan produk.
2. `FRONTEND_SCOPE.md` menentukan batas pekerjaan fase saat ini.
3. `DESIGN_DIRECTION.md` menentukan keputusan visual dan interaction design.
4. Current task/prompt menentukan pekerjaan spesifik pada sesi tersebut.

---

# 2. Current Development Objective

Bangun frontend prototype PRPDN yang:

- modern;
- clean;
- credible;
- institutional;
- data-centric;
- responsive;
- mudah dipahami;
- cocok untuk platform analitik pemerintah/BRIN;
- menggunakan data yang realistis;
- memiliki visual hierarchy yang kuat;
- tidak terlihat seperti template dashboard AI generik.

Frontend harus cukup matang untuk:

- dipresentasikan kepada pembimbing/stakeholder;
- digunakan untuk validasi UX;
- menjadi fondasi implementasi backend berikutnya;
- menunjukkan bagaimana data riil akan ditampilkan sebelum integrasi production.

---

# 3. Current Phase: FRONTEND ONLY

## 3.1 In Scope

Pada fase ini agent boleh mengerjakan:

- project frontend foundation;
- routing;
- application shell;
- sidebar;
- top navigation;
- breadcrumbs;
- dashboard layout;
- responsive layout;
- design tokens;
- reusable UI components;
- page-specific components;
- local state;
- URL/search-param state jika bermanfaat;
- filters;
- search;
- sort;
- pagination;
- tabs;
- drawers / side panels;
- modals / confirmation dialogs;
- mock CRUD interactions;
- mock import workflow;
- mock validation workflow;
- chart visualizations;
- local map/spatial visualization;
- loading state;
- empty state;
- error state;
- disabled state;
- toast / feedback state;
- accessibility behavior;
- realistic frontend fixtures yang diturunkan dari dataset.

Interaksi harus terasa nyata meskipun belum terhubung ke backend production.

---

## 3.2 Out of Scope for This Phase

Jangan membangun secara production:

- MySQL production database;
- Prisma schema/migration;
- production API persistence;
- authentication backend;
- production session management;
- production RBAC persistence;
- server-side import engine;
- database transaction import;
- permanent CRUD persistence;
- audit log persistence;
- production file storage;
- production export pipeline;
- Docker/deployment;
- Nginx;
- production security infrastructure;
- SSO/LDAP;
- production notification system;
- AI features;
- machine learning;
- forecasting.

Mocking atau frontend simulation diperbolehkan jika dibutuhkan untuk menunjukkan UX.

---

# 4. Source Materials

Agent wajib membaca dan memahami sumber berikut sebelum membuat perubahan besar.

## 4.1 Master Product Requirement

```text
docs/PRD.md
```

Gunakan untuk memahami:

- tujuan produk;
- information architecture;
- module requirements;
- user roles;
- dashboard capabilities;
- spatial workflows;
- analytics workflows;
- import/validation workflow;
- responsive requirement;
- accessibility;
- technology direction.

Jangan mengimplementasikan seluruh backend hanya karena tercantum dalam PRD.

---

## 4.2 Dataset

```text
data/Dataset Dashboard 040526.xlsx
```

Dataset digunakan sebagai **sumber domain dan sample data realistis**.

Utamakan data nyata dari workbook sebelum membuat placeholder.

Sheet penting yang telah tersedia:

| Sheet | Kegunaan Frontend |
|---|---|
| `dim_waktu` | pilihan tahun / period filter |
| `dim_pilar_idsd` | 12 pilar, komponen, label IDSD |
| `dim_wilayah_ol` | master wilayah ringkas |
| `dim_wilayah` | wilayah + koordinat/spatial fields |
| `dim_indikator_rpjmd` | metadata indikator RPJMD |
| `fact_total_idsd` | skor total IDSD |
| `fact_skor_pilar` | skor pilar IDSD tingkat provinsi |
| `fact_skor_pilar_kabkota` | skor pilar kabupaten/kota |
| `fact_kfd` | kapasitas fiskal daerah |
| `fact_kemiskinan` | data kemiskinan |
| `fact_eppd` | data EPPD |
| `fact_overlay_prov` | data overlay lintas indikator |
| `fact_rpjmd_prov_master` | target/baseline RPJMD |
| `fact_rpjmd_prov` | realisasi RPJMD |

Sheet seperti `REKAP` dan `kemiskinan_raw` dapat dipakai sebagai referensi sumber, tetapi tidak harus menjadi fixture utama jika data yang lebih terstruktur sudah tersedia.

---

## 4.3 Supervisor UI References

```text
references/ui/
```

Screenshot dari pembimbing/stakeholder digunakan untuk memahami:

- modul yang dibutuhkan;
- struktur sidebar;
- hierarchy informasi;
- field yang diperlukan;
- pola filter;
- tabel;
- detail side panel;
- import wizard;
- validation workflow;
- user management;
- spatial preview;
- action yang tersedia.

### Important

> **Reference screenshots are NOT the final visual design.**

Jangan menyalin 1:1:

- warna;
- gradient;
- spacing;
- typography;
- card treatment;
- shadow;
- border radius;
- density;
- decorative style.

Agent harus memperbaiki visual dan UX berdasarkan `DESIGN_DIRECTION.md`.

---

# 5. Data Strategy for Frontend

## 5.1 Use Realistic Fixtures

Frontend tidak boleh penuh dengan data generik seperti:

```text
John Doe
Lorem ipsum
Company A
$99,999
```

jika domain data riil tersedia.

Gunakan workbook sebagai basis untuk membuat fixture lokal.

Contoh struktur:

```text
src/
└── data/
    └── mock/
        ├── regions.ts
        ├── years.ts
        ├── idsd.ts
        ├── idsd-pillars.ts
        ├── kfd.ts
        ├── poverty.ts
        ├── eppd.ts
        ├── rpjmd.ts
        └── users.ts
```

Lokasi final boleh menyesuaikan struktur project yang sudah ada.

---

## 5.2 Dataset Extraction Rule

Agent boleh:

- membaca XLSX;
- mengambil sample record;
- melakukan transformasi sederhana;
- membuat JSON/TS fixture lokal;
- mengagregasi nilai untuk kebutuhan demo UI.

Agent tidak boleh:

- mengubah dataset sumber;
- menganggap kolom yang tidak jelas tanpa inspeksi;
- membuat angka palsu jika data asli tersedia;
- membangun ETL production pada fase ini.

Jika data untuk suatu UI memang tidak tersedia, gunakan **clearly-labeled demo fixture** dan jangan mengklaimnya sebagai data resmi.

---

# 6. Product Areas to Implement

## P0 — Foundation

1. Application shell
2. Global design system
3. Sidebar navigation
4. Top bar
5. Page header / breadcrumb
6. Shared filter controls
7. Shared table pattern
8. Shared status/badge pattern
9. Shared drawer/detail pattern
10. Loading / empty / error states

P0 harus stabil sebelum halaman lain diperbanyak.

---

## P1 — Core Screens

Urutan implementasi yang disarankan:

### 1. Admin Dashboard

Mencakup:

- summary;
- data coverage;
- key indicators;
- trend;
- spatial overview;
- ranking;
- completeness;
- recent activity.

Dashboard harus menjadi **visual benchmark** untuk halaman lain.

### 2. Data Wilayah

Mencakup:

- provinsi;
- kabupaten/kota;
- search/filter;
- table;
- spatial status;
- spatial preview;
- detail panel.

### 3. Data IDSD

Mencakup:

- skor IDSD;
- 12 pilar;
- year/region filtering;
- table;
- status/category;
- detail;
- add/edit UI.

### 4. Master Indikator

Mencakup:

- code;
- name;
- category;
- unit;
- direction;
- source;
- active status;
- detail;
- add/edit action.

### 5. Master Tahun

Mencakup:

- year;
- historical/planning type;
- status;
- description;
- detail;
- add/edit action.

---

## P2 — Data Operations Screens

### 6. Import Data

Frontend prototype harus menunjukkan flow:

```text
Upload
→ Preview
→ Mapping
→ Validation
→ Confirmation
→ Import Result
```

Tidak perlu menyimpan file ke server pada fase ini.

### 7. Validasi Data

Mencakup:

- valid;
- error;
- duplicate;
- empty;
- warning;
- filter;
- row inspect;
- edit UI;
- bulk action UI;
- validation detail.

### 8. Manajemen Pengguna

Mencakup:

- list user;
- role;
- unit kerja;
- status;
- last login;
- detail;
- edit;
- deactivate;
- reset password UI.

---

## P3 — Supporting Screens

Setelah pola visual utama stabil:

- role & hak akses;
- log aktivitas;
- pengaturan;
- additional data category pages;
- deeper spatial drilldown;
- public dashboard screens.

---

# 7. Frontend Interaction Expectations

## 7.1 Filters

Filter harus:

- konsisten antarhalaman;
- memiliki label jelas;
- menyediakan reset;
- memiliki disabled state;
- tidak menyebabkan page reload;
- mempertahankan hierarchy yang jelas.

Untuk dashboard analitik, state filter dapat disimpan pada URL search params jika membantu usability.

---

## 7.2 Tables

Table harus mendukung pola UI untuk:

- search;
- sort;
- filtering;
- pagination;
- row action;
- selection jika diperlukan;
- column visibility jika relevan;
- sticky header untuk tabel panjang;
- responsive overflow.

Jangan membuat row terlalu tinggi.

Jangan menyembunyikan data penting di balik terlalu banyak menu.

---

## 7.3 Drawers / Detail Panels

Gunakan detail drawer/side panel jika user perlu melihat informasi tambahan tanpa kehilangan konteks tabel/map.

Cocok untuk:

- detail wilayah;
- detail indikator;
- detail tahun;
- detail user;
- validation error.

Drawer tidak boleh menjadi halaman penuh mini yang terlalu padat.

---

## 7.4 Forms

Form harus:

- dikelompokkan secara logis;
- memiliki label eksplisit;
- menampilkan required state;
- menampilkan helper text hanya jika perlu;
- memiliki validation message yang jelas;
- menjaga primary action tetap mudah ditemukan.

Jangan menggunakan placeholder sebagai satu-satunya label.

---

# 8. Spatial / Map Scope

Map tetap termasuk frontend karena merupakan bagian penting pengalaman produk.

Gunakan:

- local GeoJSON/geometry jika tersedia;
- map layer lokal;
- choropleth;
- hover;
- click;
- selected-region state;
- legend;
- no-data state.

Jika aset spasial final belum tersedia:

- jangan menggambar geography palsu;
- gunakan data/local geometry yang tersedia;
- atau buat component shell dengan honest demo state.

Map tidak membutuhkan production geospatial backend pada fase ini.

---

# 9. Chart Scope

Visualisasi yang relevan:

- line chart;
- bar chart;
- ranking;
- radar;
- scatter plot;
- quadrant;
- completeness/progress.

Gunakan Apache ECharts jika project mengikuti stack PRD dan library tersedia/diperlukan.

Chart harus:

- readable;
- memiliki unit;
- memiliki tooltip;
- memiliki source/year context jika relevan;
- menggunakan warna secara konsisten;
- tidak dekoratif berlebihan.

---

# 10. Technology Guardrails

Ikuti stack frontend dari PRD selama tidak ada keputusan baru:

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
MapLibre GL JS
Apache ECharts
TanStack Table
```

### Rules

- Jangan mengganti framework tanpa instruksi.
- Jangan menambah state-management library jika React state + URL params cukup.
- Jangan menambah UI framework kedua.
- Jangan menambah chart library kedua tanpa kebutuhan nyata.
- Jangan menambah icon package baru jika package existing sudah memadai.
- Jangan membuat abstraction layer hanya demi “clean architecture”.
- Reuse existing component jika cocok.
- Jangan refactor besar tanpa hubungan langsung dengan current task.

---

# 11. AI Skill Responsibilities

Project dapat menggunakan tiga skill berikut secara bersamaan.

## Frontend Design Skills

Fokus:

- visual direction;
- hierarchy;
- composition;
- typography;
- layout quality;
- anti-generic UI.

## Build Web Apps

Fokus:

- frontend implementation;
- component quality;
- responsive behavior;
- framework best practices;
- frontend testing/debugging;
- implementation QA.

## Ponytail

Fokus:

- hindari over-engineering;
- reuse existing code;
- hindari dependency tak perlu;
- implementasi minimum yang tetap berkualitas.

### Important Balance

> Ponytail tidak boleh digunakan sebagai alasan untuk menurunkan kualitas UX, accessibility, responsive behavior, map/chart readability, atau visual polish.

---

# 12. Implementation Workflow

Untuk feature/page besar:

```text
READ CONTEXT
↓
UNDERSTAND REQUIREMENT
↓
DESIGN / UX PLAN
↓
IMPLEMENT
↓
VISUAL REVIEW
↓
RESPONSIVE REVIEW
↓
PONYTAIL SIMPLIFICATION REVIEW
↓
LINT / TYPECHECK
```

Jangan langsung membuat seluruh aplikasi dalam satu task besar.

---

# 13. Recommended Build Sequence

```text
Phase A
Design tokens + App shell
        ↓
Phase B
Dashboard
        ↓
Visual review / approval
        ↓
Phase C
Data Wilayah + Data IDSD
        ↓
Pattern review
        ↓
Phase D
Master Indikator + Master Tahun
        ↓
Phase E
Import + Validasi
        ↓
Phase F
Manajemen Pengguna + supporting screens
```

Jika visual direction salah pada Dashboard, perbaiki lebih dahulu sebelum menyalin pola ke halaman lain.

---

# 14. Frontend Definition of Done

Fase frontend dianggap siap untuk review jika:

- semua P1/P2 screen utama dapat dibuka;
- navigation bekerja;
- layout konsisten;
- data terlihat realistis;
- dataset digunakan sebagai basis fixture;
- dashboard memiliki visual hierarchy yang jelas;
- filter UI berfungsi;
- table interactions berfungsi secara lokal;
- detail panel/drawer berfungsi;
- import/validation flow dapat didemokan;
- loading state tersedia;
- empty state tersedia;
- error state tersedia;
- desktop layout matang;
- tablet/mobile tidak rusak;
- keyboard focus terlihat;
- color tidak menjadi satu-satunya penanda status;
- tidak ada major TypeScript error;
- lint/typecheck lolos;
- tidak ada dependency/abstraction yang jelas tidak perlu;
- tidak ada production backend yang dibangun tanpa instruksi.

---

# 15. Final Frontend Principle

Jika harus memilih:

```text
INFORMATION CLARITY
>
DATA READABILITY
>
INTERACTION CONSISTENCY
>
RESPONSIVE BEHAVIOR
>
VISUAL POLISH
>
DECORATION
```

Frontend harus terlihat matang bukan karena efek visual yang banyak, tetapi karena:

- hierarchy tepat;
- spacing tepat;
- data jelas;
- interaction predictable;
- visual consistency;
- detail yang terkontrol.
