# PRD — Dashboard Spasial Kinerja & Indikator Pembangunan Daerah

> **Dokumen Produk & Teknis**
>
> Versi: `v1.0`  
> Target pengerjaan MVP: `± 1 bulan`  
> Platform: `Web Application`  
> Metode pengembangan: `Vibe Coding / AI-assisted development`  
> Status: `Draft awal untuk requirement freeze`
>
> **Catatan desain:** contoh tampilan backend yang diberikan pihak BRIN/atasan digunakan sebagai **referensi arah dan kebutuhan fitur**, bukan template yang wajib disalin 1:1. Tim pengembang bebas melakukan improvisasi selama fungsi, keterbacaan data, konsistensi, aksesibilitas, performa, dan kebutuhan utama pengguna tetap terpenuhi.

---

# 1. Ringkasan Produk

Aplikasi ini merupakan **dashboard pemetaan dan analisis kinerja pemerintah daerah** berbasis web yang digunakan untuk mengeksplorasi, membandingkan, dan memahami kondisi pembangunan daerah di Indonesia.

Fokus utama sistem adalah menyajikan data daerah dalam bentuk:

- peta spasial interaktif;
- tabel;
- KPI / summary cards;
- line chart;
- bar chart;
- radar / spider chart;
- scatter plot X–Y;
- analisis korelasi sederhana;
- perbandingan antarwilayah;
- tren data per tahun;
- data completeness / kualitas data;
- detail indikator dan metadata sumber.

Aplikasi harus mendukung analisis lintas indikator seperti:

- daya saing daerah;
- ekonomi;
- sosial;
- kesehatan;
- kemiskinan;
- pertumbuhan ekonomi;
- ekonomi makro daerah;
- inovasi daerah;
- kapasitas fiskal daerah;
- EPPD;
- RPJMD;
- indikator tambahan lain yang disediakan kemudian.

Tujuan utama aplikasi bukan sekadar menjadi tempat penyimpanan data, tetapi menjadi **alat eksplorasi dan pengambilan insight berbasis data wilayah**.

Contoh use case:

> “Apakah wilayah dengan indeks inovasi tinggi cenderung memiliki kemiskinan lebih rendah?”

Pengguna dapat memilih:

- `Sumbu X = Indeks Inovasi`
- `Sumbu Y = Persentase Penduduk Miskin`
- `Tahun = 2024`
- `Level = Provinsi`

Kemudian aplikasi menampilkan scatter plot seluruh provinsi, trend line, nilai korelasi, dan tooltip per wilayah.

---

# 2. Latar Belakang

Dashboard yang tersedia saat ini mengacu pada sistem visualisasi berbasis Tableau. Sistem baru dikembangkan untuk:

1. memberikan kontrol penuh terhadap desain dan fitur;
2. meningkatkan fleksibilitas pengelolaan data;
3. mempermudah integrasi dataset baru;
4. mempercepat akses dibandingkan dashboard yang terlalu berat;
5. memberikan pengalaman pengguna yang lebih modern;
6. memungkinkan eksplorasi spasial dan analisis korelasi antarindikator;
7. memungkinkan backend pengelolaan data yang lebih terstruktur;
8. menyiapkan fondasi untuk pengembangan fitur lanjutan di masa depan.

---

# 3. Product Vision

Membangun satu platform web yang:

> **Cepat, modern, mudah dipahami, interaktif, responsif, mudah diperbarui, dan dapat digunakan untuk melihat hubungan pembangunan antardaerah serta antarindikator secara spasial dan analitis.**

Sistem harus terasa seperti:

- platform analitik pemerintahan;
- dashboard data publik modern;
- sistem spasial interaktif;
- bukan sekadar CRUD;
- bukan sekadar kumpulan chart;
- bukan UI generik hasil template AI.

---

# 4. Product Goals

## 4.1 Goal Utama

### G1 — Eksplorasi Wilayah

Pengguna dapat melihat data dari level:

```text
Indonesia
└── Provinsi
    └── Kabupaten/Kota
```

### G2 — Eksplorasi Indikator

Pengguna dapat memilih indikator pembangunan dan langsung melihat:

- nilai tiap wilayah;
- distribusi nilai;
- tren tahunan;
- wilayah tertinggi;
- wilayah terendah;
- perubahan dari tahun sebelumnya.

### G3 — Analisis Antarindikator

Pengguna dapat membandingkan dua indikator menggunakan sumbu X dan Y.

### G4 — Perbandingan Wilayah

Pengguna dapat membandingkan 2–5 wilayah.

### G5 — Data Management

Administrator dapat:

- menambah data;
- mengedit;
- menghapus;
- import CSV/XLSX;
- memvalidasi data;
- memperbaiki error;
- melihat log aktivitas.

### G6 — Traceability

Setiap nilai data memiliki metadata:

- indikator;
- tahun;
- wilayah;
- sumber;
- tanggal data;
- waktu import/update.

---

# 5. Non-Goals MVP

Fitur berikut **tidak wajib masuk versi 1 bulan**:

- AI chatbot;
- AI-generated insight;
- machine learning prediction;
- forecasting kompleks;
- dashboard builder drag & drop;
- custom query builder;
- live streaming data;
- sinkronisasi API eksternal real-time;
- GIS editing advanced;
- advanced geospatial calculation;
- user-defined formula seperti Tableau Calculated Field;
- mobile app native;
- sistem workflow approval multi-level kompleks;
- SSO kompleks jika belum diwajibkan.

Fitur tersebut dapat menjadi fase berikutnya.

---

# 6. Target User

## 6.1 Public Viewer

Kebutuhan:

- melihat peta;
- memilih indikator;
- melihat chart;
- melihat tren;
- melihat detail wilayah;
- membandingkan wilayah;
- melakukan analisis X–Y.

Tidak membutuhkan akses pengelolaan data.

---

## 6.2 Internal Viewer

Kebutuhan Public Viewer ditambah:

- akses dataset internal tertentu;
- melihat metadata lebih lengkap;
- export data sesuai hak akses.

---

## 6.3 Operator

Dapat:

- input data;
- edit data;
- import data;
- memperbaiki hasil validasi.

Tidak dapat:

- mengubah role pengguna;
- konfigurasi sistem kritis.

---

## 6.4 Validator

Dapat:

- melihat hasil import;
- memvalidasi data;
- menandai data valid/error;
- memperbaiki atau mengembalikan data.

---

## 6.5 Administrator

Dapat:

- seluruh operasi data;
- kelola indikator;
- kelola tahun;
- kelola wilayah;
- kelola pengguna;
- lihat audit log;
- konfigurasi tertentu.

---

## 6.6 Super Admin

Dapat melakukan seluruh aktivitas Administrator ditambah:

- role & permission;
- konfigurasi sistem;
- penghapusan permanen tertentu;
- system-level administration.

---

# 7. Role & Permission Matrix

| Fitur | Viewer | Operator | Validator | Admin | Super Admin |
|---|---:|---:|---:|---:|---:|
| Dashboard publik | ✓ | ✓ | ✓ | ✓ | ✓ |
| Detail wilayah | ✓ | ✓ | ✓ | ✓ | ✓ |
| Analisis X–Y | ✓ | ✓ | ✓ | ✓ | ✓ |
| Export publik | Opsional | ✓ | ✓ | ✓ | ✓ |
| Tambah data manual | - | ✓ | ✓ | ✓ | ✓ |
| Edit data | - | ✓ | ✓ | ✓ | ✓ |
| Import data | - | ✓ | ✓ | ✓ | ✓ |
| Validasi data | - | - | ✓ | ✓ | ✓ |
| Master indikator | - | - | - | ✓ | ✓ |
| Master tahun | - | - | - | ✓ | ✓ |
| Data wilayah | - | - | - | ✓ | ✓ |
| Kelola pengguna | - | - | - | ✓ | ✓ |
| Role & permission | - | - | - | - | ✓ |
| Log aktivitas | - | Terbatas | Terbatas | ✓ | ✓ |
| Pengaturan sistem | - | - | - | Terbatas | ✓ |

---

# 8. Scope Fitur MVP

## 8.1 Modul Public Dashboard

- dashboard overview;
- peta Indonesia;
- switch provinsi / kabupaten-kota;
- filter tahun;
- filter indikator;
- filter kategori;
- filter wilayah;
- KPI summary;
- choropleth map;
- hover tooltip;
- click detail wilayah;
- chart tren;
- bar chart/ranking;
- radar chart;
- scatter plot X–Y;
- correlation summary;
- quadrant analysis;
- comparison wilayah;
- data table;
- export data;
- responsive layout.

---

## 8.2 Modul Backend

- login;
- dashboard admin;
- data wilayah;
- data indikator;
- master indikator;
- master tahun;
- import;
- validasi;
- user management;
- role & permission;
- activity log;
- settings.

---

# 9. Information Architecture

## 9.1 Public

```text
/
├── Dashboard
├── Peta
│   ├── Provinsi
│   └── Kabupaten/Kota
├── Indikator
│   ├── Daya Saing
│   ├── Ekonomi
│   ├── Sosial
│   ├── Kesehatan
│   ├── Kemiskinan
│   ├── Inovasi
│   └── Lainnya
├── Analisis
│   ├── Perbandingan Wilayah
│   └── Analisis X-Y
├── Data
│   └── Tabel Data
└── Tentang / Metodologi
```

---

## 9.2 Backend

```text
/admin
├── Dashboard
├── Kelola Data
│   ├── Data Wilayah
│   ├── Data IDSD
│   ├── Data KFD
│   ├── Data Kemiskinan
│   ├── Data EPPD
│   └── Data RPJMD
├── Master Data
│   ├── Master Indikator
│   └── Master Tahun
├── Data Management
│   ├── Import Data
│   └── Validasi Data
└── Sistem
    ├── Manajemen Pengguna
    ├── Role & Hak Akses
    ├── Log Aktivitas
    └── Pengaturan
```

Catatan:

Struktur sidebar boleh mengikuti contoh dari pihak atas karena sudah cukup logis, tetapi tampilan dan interaction pattern tidak wajib sama.

---

# 10. Public Dashboard — Detailed Requirement

## 10.1 Header

Harus menyediakan:

- logo/identitas aplikasi;
- nama dashboard;
- navigasi utama;
- pencarian opsional;
- tombol export jika dibutuhkan;
- mobile menu.

---

## 10.2 Filter Global

Filter utama:

```text
Tahun
Level Wilayah
Provinsi
Kabupaten/Kota
Kategori
Indikator
```

Semua filter harus bersifat terkoordinasi.

Contoh:

```text
User memilih:
Tahun = 2024
Indikator = Kemiskinan
Level = Provinsi
```

Maka:

- map;
- KPI;
- tabel;
- ranking;
- chart;
- tooltip;

semuanya harus menggunakan data 2024 dan indikator kemiskinan.

### Acceptance Criteria

- pergantian filter tidak menyebabkan reload penuh;
- state filter sinkron di semua visual;
- filter dapat di-reset;
- default filter harus masuk akal;
- filter yang tidak relevan dibuat disabled.

---

# 11. KPI Summary Cards

Minimal dapat menampilkan:

- jumlah wilayah;
- nilai rata-rata;
- nilai tertinggi;
- nilai terendah;
- perubahan dari tahun sebelumnya;
- completeness dataset.

Contoh:

```text
Rata-rata Nasional
3.42
▲ 0.11 dari 2023
```

KPI tidak boleh terlalu banyak.

Rekomendasi desktop:

- 4–6 cards.

Mobile:

- horizontal scroll atau grid 2 kolom.

---

# 12. Interactive Map

## 12.1 Map Mode

Dua mode:

```text
[ Provinsi ] [ Kabupaten/Kota ]
```

### Provinsi

Menampilkan seluruh provinsi Indonesia.

### Kabupaten/Kota

Dapat:

- menampilkan seluruh kab/kota;
- atau hanya wilayah dari provinsi terpilih untuk performa lebih baik.

Rekomendasi:

> Saat level kabupaten/kota dipilih, sistem meminta user memilih provinsi terlebih dahulu apabila performa seluruh 500+ polygon dianggap berat.

---

## 12.2 Choropleth

Warna polygon ditentukan berdasarkan nilai indikator.

Contoh:

```text
1.0 ─────────────── 5.0
low                 high
```

Color range harus:

- memiliki kontras cukup;
- tidak hanya bergantung pada merah-hijau;
- memiliki legend;
- menampilkan nilai minimum dan maksimum;
- mendukung `no data`.

---

## 12.3 No Data State

Wilayah tanpa data:

- warna abu netral;
- tooltip menunjukkan “Data belum tersedia”.

Jangan menampilkan nilai `0` untuk data yang sebenarnya missing.

---

## 12.4 Hover

Saat hover:

```text
DKI Jakarta

Indikator:
Indeks Daya Saing Daerah

Tahun:
2024

Nilai:
4.21

Kategori:
Tinggi

Perubahan:
+0.12
```

---

## 12.5 Click

Saat polygon diklik:

opsi UX yang direkomendasikan:

```text
klik polygon
   ↓
side panel / drawer
   ↓
ringkasan wilayah
   ↓
"Lihat Detail"
```

Side panel minimal:

- nama wilayah;
- kode wilayah;
- nilai indikator;
- ranking;
- perubahan;
- 3–6 KPI utama;
- mini trend;
- tombol detail.

---

# 13. Detail Wilayah

Route contoh:

```text
/region/31
/region/32
/region/3273
```

Isi halaman:

## Header

- nama wilayah;
- level;
- provinsi induk;
- tahun;
- sumber data.

## KPI

- IDSD;
- KFD;
- Kemiskinan;
- Inovasi;
- Kesehatan;
- Pertumbuhan Ekonomi.

## Trend

Line chart per indikator.

## Radar

Spider plot profil wilayah.

## Comparison

Tombol:

```text
Bandingkan Wilayah
```

## Metadata

- sumber;
- update terakhir;
- indikator tersedia;
- data completeness.

---

# 14. Radar / Spider Chart

Radar digunakan untuk melihat profil multiindikator.

Contoh dimensi:

- ekonomi;
- inovasi;
- kesehatan;
- sosial;
- daya saing;
- kapasitas fiskal.

### Normalisasi

Karena satuan indikator dapat berbeda, radar tidak boleh menggunakan raw value secara sembarangan.

Gunakan salah satu:

1. skor yang memang sudah berada pada skala sama;
2. normalisasi 0–100;
3. percentile.

Setiap axis harus memiliki label yang jelas.

---

# 15. Analisis X–Y

## 15.1 Tujuan

Membandingkan keterkaitan dua indikator.

UI:

```text
Sumbu X
[ Kapasitas Fiskal Daerah ]

Sumbu Y
[ Persentase Penduduk Miskin ]

Tahun
[ 2024 ]

Level
[ Provinsi ]
```

---

## 15.2 Scatter Plot

Setiap titik = wilayah.

Tooltip:

```text
Jawa Barat

KFD:
0.68

Kemiskinan:
7.46%

Tahun:
2024
```

---

## 15.3 Correlation

Minimal mendukung:

```text
Pearson r
```

Opsional fase lanjutan:

```text
Spearman rho
```

UI:

```text
Korelasi Pearson
r = -0.64
```

Jangan memberikan label kausal seperti:

```text
"KFD menurunkan kemiskinan"
```

Gunakan:

```text
"Terdapat hubungan negatif pada data yang dipilih."
```

---

## 15.4 Trend Line

Jika cukup data:

- regression line;
- optional R².

Jangan tampilkan jika sample terlalu kecil.

---

## 15.5 Quadrant Analysis

Scatter plot dibagi 4 kuadran.

Contoh:

```text
Q2 | Q1
---+---
Q3 | Q4
```

Threshold dapat menggunakan:

- mean;
- median;
- benchmark nasional.

Pilihan threshold sebaiknya terlihat di UI.

---

# 16. Comparison Wilayah

User dapat memilih maksimal:

```text
2–5 wilayah
```

Tampilan:

- KPI side-by-side;
- radar;
- grouped bar;
- trend line;
- table.

Contoh:

```text
Jawa Barat
Jawa Tengah
DKI Jakarta
```

Jika terlalu banyak wilayah pada mobile, gunakan:

- tabs;
- horizontal scroll;
- stacked layout.

---

# 17. Ranking

Ranking dapat menampilkan:

- 5 tertinggi;
- 5 terendah;
- ranking nasional;
- ranking dalam provinsi;
- perubahan ranking dari tahun sebelumnya.

Catatan:

Pastikan indikator memiliki metadata:

```text
higher_is_better
```

Karena kemiskinan berbeda dengan indeks inovasi.

Contoh:

```text
Inovasi:
higher = better

Kemiskinan:
lower = better
```

---

# 18. Data Table

Fitur minimum:

- search;
- sorting;
- filtering;
- pagination;
- selectable column;
- sticky header;
- export;
- responsive behavior.

Kolom contoh:

```text
Wilayah
Kode
Level
Indikator
Tahun
Nilai
Satuan
Kategori
Sumber
Tanggal Update
```

---

# 19. Backend Dashboard

Dashboard admin berfungsi sebagai overview sistem.

KPI:

- total wilayah;
- total record;
- total indikator;
- data valid;
- data error;
- data tidak lengkap;
- pengguna aktif.

Chart:

- trend data;
- distribusi indikator;
- completeness;
- activity.

Map:

- optional;
- dapat menampilkan coverage data.

Referensi screenshot pihak atas dapat digunakan sebagai inspirasi, namun admin dashboard boleh dibuat lebih ringkas agar informasi penting lebih cepat dibaca.

---

# 20. Data Wilayah

## 20.1 Provinsi

Field:

```text
id
code
name
island
capital
area_km2
population
spatial_status
created_at
updated_at
```

---

## 20.2 Kabupaten/Kota

Field:

```text
id
code
name
type
province_id
capital
area_km2
population
spatial_status
created_at
updated_at
```

---

## 20.3 Fitur

- search;
- filter;
- sort;
- CRUD;
- import;
- GeoJSON status;
- detail;
- spatial preview.

---

# 21. Spatial Data

## 21.1 Format

MVP:

```text
GeoJSON
```

Opsional:

```text
TopoJSON
```

untuk ukuran file lebih kecil.

---

## 21.2 Join Key

Wajib:

```text
region_code
```

Contoh:

```json
{
  "properties": {
    "region_code": "32",
    "name": "Jawa Barat"
  }
}
```

Data statistik harus menggunakan kode yang sama.

---

## 21.3 Spatial File Strategy

Rekomendasi:

```text
/public/maps/
├── indonesia-province.geojson
└── regency/
    ├── 11.geojson
    ├── 12.geojson
    ├── 31.geojson
    └── ...
```

Keuntungan:

- tidak load seluruh kabupaten Indonesia sekaligus;
- lebih cepat;
- cache-friendly.

---

# 22. Master Indikator

Setiap indikator memiliki:

```text
id
code
name
slug
category_id
unit
description
definition
source
higher_is_better
min_value
max_value
decimal_precision
is_active
available_from_year
created_at
updated_at
```

Contoh:

```text
Code:
KM-01

Name:
Persentase Penduduk Miskin

Unit:
%

Direction:
lower_is_better
```

---

# 23. Kategori Indikator

Contoh:

```text
Daya Saing
Ekonomi
Sosial
Kesehatan
Kemiskinan
Inovasi
Kapasitas Fiskal
EPPD
RPJMD
```

Database tidak boleh mengunci hanya kategori tersebut.

Harus bisa menambahkan kategori baru.

---

# 24. Master Tahun

Field:

```text
year
type
status
description
created_at
updated_at
```

Type:

```text
Historical
Planning
```

Status:

```text
Active
Archived
Planning
```

---

# 25. Data Value Model

Rekomendasi database menggunakan struktur generik.

JANGAN:

```text
idsd_values
poverty_values
innovation_values
health_values
...
```

Gunakan:

```text
indicator_values
```

Field:

```text
id
region_id
indicator_id
year_id
value
category
source_id
dataset_id
data_date
notes
created_by
created_at
updated_at
```

Constraint:

```text
UNIQUE(region_id, indicator_id, year_id, dataset_id)
```

Atau jika hanya satu sumber authoritative:

```text
UNIQUE(region_id, indicator_id, year_id)
```

---

# 26. Database Schema

## 26.1 Core Tables

```text
users
roles
permissions
user_roles
role_permissions

regions
region_spatial_files

indicator_categories
indicators
indicator_values

years

sources
datasets
imports
import_rows
validation_results

activity_logs
system_settings
```

---

# 27. Entity Relationship Overview

```text
REGIONS
   │
   ├────────────┐
   │            │
   ▼            ▼
VALUES       SPATIAL_FILES
   │
   ▼
INDICATORS
   │
   ▼
CATEGORIES

VALUES
   │
   ├── YEAR
   ├── SOURCE
   └── DATASET

DATASET
   │
   ▼
IMPORT
   │
   ▼
IMPORT_ROWS
   │
   ▼
VALIDATION_RESULTS
```

---

# 28. Suggested SQL Structures

## regions

```sql
CREATE TABLE regions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    level VARCHAR(30) NOT NULL,
    parent_id BIGINT NULL REFERENCES regions(id),
    island VARCHAR(100),
    capital VARCHAR(150),
    area_km2 NUMERIC(15,2),
    population BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## indicator_categories

```sql
CREATE TABLE indicator_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## indicators

```sql
CREATE TABLE indicators (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT REFERENCES indicator_categories(id),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    unit VARCHAR(50),
    description TEXT,
    definition TEXT,
    source_default VARCHAR(255),
    direction VARCHAR(20),
    min_value NUMERIC(20,6),
    max_value NUMERIC(20,6),
    decimal_precision INT DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## years

```sql
CREATE TABLE years (
    id BIGSERIAL PRIMARY KEY,
    year INT UNIQUE NOT NULL,
    type VARCHAR(30) DEFAULT 'historical',
    status VARCHAR(30) DEFAULT 'active',
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## datasets

```sql
CREATE TABLE datasets (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    source VARCHAR(255),
    year_id BIGINT REFERENCES years(id),
    original_filename VARCHAR(255),
    notes TEXT,
    imported_by BIGINT,
    imported_at TIMESTAMP,
    status VARCHAR(30) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## indicator_values

```sql
CREATE TABLE indicator_values (
    id BIGSERIAL PRIMARY KEY,
    region_id BIGINT NOT NULL REFERENCES regions(id),
    indicator_id BIGINT NOT NULL REFERENCES indicators(id),
    year_id BIGINT NOT NULL REFERENCES years(id),
    dataset_id BIGINT REFERENCES datasets(id),
    value NUMERIC(20,6),
    category VARCHAR(100),
    source VARCHAR(255),
    data_date DATE,
    notes TEXT,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

# 29. Index Database

Minimal:

```sql
CREATE INDEX idx_indicator_values_region
ON indicator_values(region_id);

CREATE INDEX idx_indicator_values_indicator
ON indicator_values(indicator_id);

CREATE INDEX idx_indicator_values_year
ON indicator_values(year_id);

CREATE INDEX idx_indicator_values_lookup
ON indicator_values(indicator_id, year_id, region_id);
```

Untuk query dashboard:

```text
indicator + year + level
```

akan sangat sering dipakai.

---

# 30. Data Import Workflow

```text
UPLOAD
  ↓
READ FILE
  ↓
PREVIEW
  ↓
COLUMN MAPPING
  ↓
VALIDATION
  ↓
ERROR REVIEW
  ↓
CONFIRM
  ↓
IMPORT
  ↓
AUDIT LOG
```

---

# 31. Supported Import

MVP:

```text
.xlsx
.xls
.csv
```

Maksimum awal:

```text
10–25 MB
```

Dapat dinaikkan berdasarkan kebutuhan deployment.

---

# 32. Import Template

Template ideal:

```text
YEAR
REGION_CODE
INDICATOR_CODE
VALUE
SOURCE
DATA_DATE
NOTES
```

Contoh:

```csv
2024,31,IDSD,4.21,BRIN,2024-12-31,
2024,32,IDSD,3.68,BRIN,2024-12-31,
```

---

# 33. Column Mapping

Jika file memiliki nama kolom berbeda:

```text
TAHUN
KODE_WILAYAH
SKOR
SUMBER
```

user dapat map:

```text
TAHUN → year
KODE_WILAYAH → region_code
SKOR → value
SUMBER → source
```

Sediakan:

```text
Auto Mapping
```

berdasarkan nama kolom yang mirip.

---

# 34. Validation Rules

## 34.1 Required

```text
year
region_code
indicator_code
value
```

---

## 34.2 Region Validation

Kode wilayah harus ditemukan.

Error:

```text
Kode wilayah tidak ditemukan.
```

---

## 34.3 Indicator Validation

Error:

```text
Kode indikator tidak ditemukan.
```

---

## 34.4 Value Range

Jika indikator memiliki range:

```text
IDSD:
1.00–5.00
```

maka:

```text
6.12
```

harus dianggap invalid.

---

## 34.5 Data Type

```text
value
```

harus numeric.

---

## 34.6 Duplicate

Deteksi:

```text
region + indicator + year
```

Jika existing:

pilihan:

```text
Skip
Update
Replace
```

Default disarankan:

```text
Update existing
```

tetapi harus dijelaskan sebelum import.

---

# 35. Validation Status

Gunakan:

```text
VALID
ERROR
DUPLICATE
EMPTY
WARNING
```

Visual:

- valid = green;
- error = red;
- duplicate = amber;
- empty = neutral/purple;
- warning = orange.

Jangan mengandalkan warna saja.

Tambahkan icon/text.

---

# 36. Validation Page

Harus dapat:

- filter status;
- filter jenis masalah;
- search;
- inspect row;
- edit row;
- ignore warning;
- bulk action;
- export validation report.

---

# 37. Error Detail

Contoh:

```text
Row:
25

Region:
Aceh

Indicator:
IDSD

Value:
6.12

Error:
Nilai harus berada dalam rentang 1.00–5.00
```

---

# 38. Import Transaction

Import harus menggunakan transaction.

Jika proses gagal fatal:

```text
ROLLBACK
```

Jangan menyimpan separuh data tanpa status jelas.

---

# 39. Audit Log

Semua perubahan penting dicatat.

Field:

```text
id
user_id
action
entity_type
entity_id
old_value
new_value
ip_address
user_agent
created_at
```

Action contoh:

```text
LOGIN
IMPORT_DATA
CREATE
UPDATE
DELETE
VALIDATE
EXPORT
RESET_PASSWORD
CHANGE_ROLE
```

---

# 40. Manajemen Pengguna

Field:

```text
name
username
email
nip
role
work_unit
status
last_login
created_at
updated_at
```

Fitur:

- tambah;
- edit;
- deactivate;
- reset password;
- assign role;
- lihat activity.

---

# 41. Authentication

MVP:

```text
email/username + password
```

Minimum requirement:

- hashed password;
- session;
- CSRF protection;
- rate limit login;
- password policy;
- inactive user blocked;
- secure cookie in production.

Opsional:

- SSO;
- LDAP;
- institutional login.

---

# 42. Framework Recommendation

## Rekomendasi Utama

```text
Next.js
TypeScript
PostgreSQL
Prisma
Tailwind CSS
shadcn/ui
MapLibre GL JS
Apache ECharts
TanStack Table
Zod
```

---

# 43. Kenapa Pakai Framework

Aplikasi ini memiliki:

- dashboard;
- routing;
- auth;
- map state;
- chart state;
- filter state;
- API;
- import;
- validation;
- role;
- table;
- server-side logic.

Jika menggunakan vanilla:

```text
HTML + CSS + JS + PHP procedural
```

risiko 1 bulan:

- struktur cepat berantakan;
- logic tersebar;
- sulit maintain;
- UI state lebih rawan bug;
- debugging lebih sulit.

Framework mempercepat development.

---

# 44. Kenapa Next.js

Karena kebutuhan:

- frontend interaktif;
- backend API;
- server rendering;
- routing;
- middleware;
- TypeScript;
- React ecosystem.

Dalam satu project:

```text
UI
API
Auth
Data Fetching
Backend Logic
```

---

# 45. Alternatif Laravel

Gunakan:

```text
Laravel + Inertia + React
```

jika server pihak BRIN:

- hanya mendukung PHP;
- environment existing sudah Laravel/PHP;
- deployment Node tidak diperbolehkan.

Jika bebas dan VPS tersedia:

```text
Next.js
```

lebih praktis untuk dashboard interaktif ini.

---

# 46. Database Recommendation

## PostgreSQL

Rekomendasi utama.

Alasan:

- relational;
- kuat untuk analytical query;
- indexing bagus;
- JSON support;
- siap PostGIS jika dibutuhkan;
- cocok untuk structured government data.

MVP tidak harus menggunakan PostGIS.

Spatial dapat menggunakan GeoJSON statis.

---

# 47. ORM

```text
Prisma
```

Tujuan:

- schema jelas;
- migration;
- typed query;
- cepat digunakan dalam vibe coding;
- mengurangi raw SQL.

Raw SQL tetap boleh untuk query analytics kompleks.

---

# 48. Chart Library

## Apache ECharts

Dipakai untuk:

- line;
- bar;
- scatter;
- radar;
- heatmap;
- mark line;
- tooltip;
- zoom;
- multi-series.

Alasan:

dashboard analitik akan membutuhkan chart lebih advanced daripada dashboard CRUD biasa.

---

# 49. Map Library

## MapLibre GL JS

Dipakai untuk:

- choropleth;
- hover;
- click;
- GeoJSON;
- polygon;
- dynamic styling;
- zoom/pan;
- layer control.

---

# 50. Table Library

## TanStack Table

Dipakai untuk:

- sorting;
- filtering;
- pagination;
- column visibility;
- row selection.

---

# 51. Styling

```text
Tailwind CSS
+
shadcn/ui
```

shadcn digunakan sebagai fondasi komponen.

Jangan menggunakan desain default mentah.

---

# 52. Design Direction

## Style

```text
Professional
Modern
Government Analytics
Data-focused
Clean
Dense but readable
Neutral
```

---

# 53. Anti “AI-ish” Design Rules

Hindari:

- gradient biru-ungu berlebihan;
- glassmorphism;
- glowing cards;
- rounded 24–32px di semua komponen;
- hero marketing yang tidak relevan;
- emoji random;
- sparkle icon;
- card terlalu banyak;
- shadow tebal;
- lorem ipsum;
- copywriting generik seperti “Empowering Tomorrow”.

---

# 54. Recommended Visual Language

Background:

```text
#F6F8FB
```

Surface:

```text
#FFFFFF
```

Primary:

```text
BRIN navy / deep blue
```

Accent:

```text
Blue
Green
Orange
Purple
Red
```

Accent digunakan untuk status/visualisasi, bukan dekorasi.

Border:

```text
#E4E8F0
```

Text:

```text
#172033
```

Muted:

```text
#697386
```

---

# 55. Border Radius

Rekomendasi:

```text
6–10px
```

Card utama:

```text
8–12px
```

Jangan membuat semua elemen terlalu bulat.

---

# 56. Typography

Rekomendasi:

```text
Inter
Geist
Plus Jakarta Sans
```

Gunakan maksimum:

- 1 font family utama;
- 4–5 hierarchy ukuran.

---

# 57. Spacing

Gunakan grid:

```text
4
8
12
16
20
24
32
40
48
```

Jangan menggunakan spacing random.

---

# 58. Desktop Layout

```text
┌───────┬─────────────────────────────────────────────┐
│       │ Topbar                                      │
│ Side  ├─────────────────────────────────────────────┤
│ Bar   │ Filters                                     │
│       ├─────────────────────────┬───────────────────┤
│       │ Map                     │ Summary / Ranking │
│       ├─────────────────────────┴───────────────────┤
│       │ Charts                                      │
│       ├─────────────────────────────────────────────┤
│       │ Table                                       │
└───────┴─────────────────────────────────────────────┘
```

---

# 59. Responsive

## Desktop

```text
>= 1280
```

full dashboard.

## Tablet

```text
768–1279
```

- sidebar collapsible;
- cards 2–3 columns;
- map full width;
- charts stacked.

## Mobile

```text
< 768
```

- bottom/nav drawer;
- filter drawer;
- card grid;
- map;
- charts single column;
- data table card mode atau horizontal scroll.

---

# 60. Loading State

Gunakan:

- skeleton;
- chart placeholder;
- map loading;
- progress import.

Jangan hanya:

```text
Loading...
```

---

# 61. Empty State

Contoh:

```text
Belum ada data untuk kombinasi filter ini.

Coba:
- pilih tahun lain;
- pilih indikator lain;
- ubah wilayah.
```

---

# 62. Error State

Contoh:

```text
Data gagal dimuat.

[ Coba Lagi ]
```

Untuk error API:

- logging;
- human-readable message;
- detail teknis tidak diekspos ke public.

---

# 63. Search

Search global backend dapat mencari:

- wilayah;
- indikator;
- menu;
- dataset.

Gunakan debouncing.

---

# 64. API Design

Contoh:

```http
GET /api/regions
GET /api/regions/{code}
GET /api/indicators
GET /api/years
```

Dashboard:

```http
GET /api/dashboard
```

Map:

```http
GET /api/map
    ?year=2024
    &indicator=IDSD
    &level=province
```

Trend:

```http
GET /api/trend
    ?region=32
    &indicator=IDSD
```

Scatter:

```http
GET /api/analysis/scatter
    ?x=KFD
    &y=KM-01
    &year=2024
    &level=province
```

Comparison:

```http
GET /api/analysis/compare
    ?regions=31,32,33
    &year=2024
```

---

# 65. Admin API

```http
POST /api/admin/import
POST /api/admin/validate
POST /api/admin/indicators
PATCH /api/admin/indicators/{id}
DELETE /api/admin/indicators/{id}

POST /api/admin/regions
PATCH /api/admin/regions/{id}

POST /api/admin/users
PATCH /api/admin/users/{id}
```

---

# 66. API Response Standard

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data tidak valid",
    "details": []
  }
}
```

---

# 67. Folder Structure

```text
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx
│   │   ├── map/
│   │   ├── regions/
│   │   └── analysis/
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── regions/
│   │   ├── indicators/
│   │   ├── years/
│   │   ├── import/
│   │   ├── validation/
│   │   └── users/
│   └── api/
│
├── components/
│   ├── charts/
│   ├── map/
│   ├── dashboard/
│   ├── filters/
│   ├── table/
│   ├── admin/
│   └── ui/
│
├── lib/
│   ├── db/
│   ├── auth/
│   ├── analytics/
│   ├── import/
│   ├── validation/
│   ├── geo/
│   └── utils/
│
├── hooks/
├── stores/
├── schemas/
├── types/
└── constants/
```

---

# 68. State Management

MVP tidak perlu Redux jika tidak diperlukan.

Gunakan:

```text
URL Search Params
+
React state
+
server state
```

Opsional:

```text
Zustand
```

untuk filter global kompleks.

Rekomendasi:

filter dashboard disimpan di URL.

Contoh:

```text
/dashboard?year=2024&indicator=IDSD&level=province
```

Keuntungan:

- shareable;
- refresh-safe;
- bookmarkable.

---

# 69. Caching

Cache:

- master region;
- indicator;
- year;
- GeoJSON;
- dashboard aggregates.

Jangan cache:

- user-specific admin action;
- import status yang sedang berjalan terlalu lama.

---

# 70. Performance Target

Target realistis:

- first load dashboard `< 3s` di koneksi wajar;
- filter update `< 1s` jika data sudah cached;
- table interaction terasa instant;
- map hover tanpa lag;
- API umum `< 500–800ms` jika query normal.

---

# 71. Performance Strategy

- lazy load chart berat;
- load GeoJSON berdasarkan level;
- simplify polygon;
- cache master data;
- database index;
- aggregate query;
- pagination server-side;
- compress static JSON;
- avoid over-fetching.

---

# 72. GeoJSON Optimization

Jangan langsung memakai file polygon dengan detail ekstrem.

Lakukan:

```text
simplify geometry
```

untuk dashboard.

Simpan file high-resolution hanya jika diperlukan untuk detail.

---

# 73. Data Completeness

Sistem menghitung:

```text
expected_records
actual_records
missing_records
completion_percentage
```

Contoh:

```text
IDSD
98%
```

---

# 74. Data Quality

Dashboard internal dapat menampilkan:

- valid;
- missing;
- duplicate;
- invalid;
- stale.

---

# 75. Security

Minimum:

- hashed passwords;
- RBAC;
- CSRF;
- XSS prevention;
- SQL injection prevention;
- file extension validation;
- file MIME validation;
- upload size limit;
- rate limiting;
- secure cookies;
- audit log;
- no secret in repository;
- `.env`;
- HTTPS production.

---

# 76. Upload Security

File import tidak boleh langsung dieksekusi.

Lakukan:

1. validate extension;
2. validate MIME;
3. randomize temporary filename;
4. parse sebagai spreadsheet;
5. jangan menyimpan macro/executable;
6. hapus temp file setelah proses.

---

# 77. Backup

Minimal:

- daily database backup;
- retention 7–30 hari;
- manual backup sebelum bulk import;
- restore procedure documented.

---

# 78. Testing Strategy

## Unit

- normalisasi;
- correlation;
- validation;
- category calculation.

## Integration

- API;
- database;
- import.

## UI

- filter;
- pagination;
- hover;
- drawer;
- form.

## E2E

Flow:

```text
login
→ import
→ validation
→ save
→ dashboard
→ filter
→ verify map
```

---

# 79. Critical Test Cases

### Import

- file valid;
- file kosong;
- wrong extension;
- invalid code wilayah;
- duplicate;
- numeric invalid;
- missing year.

### Map

- no data;
- partial data;
- province click;
- district map.

### Analysis

- X = Y;
- insufficient sample;
- missing values;
- negative correlation;
- zero variance.

---

# 80. Analytics Edge Cases

Correlation tidak boleh dihitung jika:

- sample terlalu kecil;
- salah satu variabel tidak memiliki variance;
- data terlalu banyak missing.

Tampilkan:

```text
Korelasi tidak dapat dihitung untuk pilihan ini.
```

---

# 81. Accessibility

Minimum:

- keyboard navigation;
- label form;
- aria;
- focus state;
- contrast;
- tooltip accessible;
- status tidak bergantung warna saja;
- chart memiliki summary text.

---

# 82. Export

Public:

```text
CSV
XLSX
```

Backend:

```text
CSV
XLSX
Validation report
```

Optional:

```text
PNG chart
PDF summary
```

---

# 83. Logging

Gunakan 3 jenis:

```text
application log
security log
audit log
```

Jangan masukkan:

- password;
- token;
- secret;
- sensitive data;

ke log.

---

# 84. Deployment Architecture

Rekomendasi:

```text
Internet
   ↓
Nginx
   ↓
Next.js
   ↓
PostgreSQL
```

Opsional container:

```text
Docker
├── app
├── database
└── nginx
```

---

# 85. Environment

## Development

```text
Local
```

## Staging

```text
UAT
```

## Production

```text
Live
```

Jangan deploy langsung dari development ke production tanpa staging jika memungkinkan.

---

# 86. Environment Variables

```env
DATABASE_URL=
AUTH_SECRET=
NEXT_PUBLIC_APP_URL=
UPLOAD_MAX_SIZE=
LOG_LEVEL=
```

Jika map tile eksternal digunakan:

```env
MAP_TILE_URL=
MAP_API_KEY=
```

---

# 87. Git Workflow

```text
main
develop
feature/*
fix/*
```

Contoh:

```text
feature/map-drilldown
feature/import-validation
fix/scatter-tooltip
```

---

# 88. Commit

Gunakan:

```text
feat:
fix:
refactor:
docs:
test:
chore:
```

---

# 89. Vibe Coding Rules

Ini penting agar agent AI tidak membuat arsitektur berubah-ubah.

## Agent wajib:

1. baca PRD;
2. baca database schema;
3. baca design system;
4. baca current task;
5. tidak mengganti stack tanpa instruksi;
6. tidak membuat library tambahan jika belum perlu;
7. tidak membuat fitur di luar scope;
8. tidak melakukan refactor besar tanpa alasan;
9. selalu mempertahankan types;
10. selalu menjalankan lint/typecheck/test setelah perubahan penting.

---

# 90. Recommended Project Docs

```text
/docs
├── PRD.md
├── ARCHITECTURE.md
├── DATABASE.md
├── DESIGN_SYSTEM.md
├── API.md
├── DATA_IMPORT.md
├── SECURITY.md
├── DEVELOPMENT_PLAN.md
└── AGENT_RULES.md
```

---

# 91. Agent Guardrails

Tambahkan pada `AGENT_RULES.md`:

```text
- Do not change framework.
- Do not replace PostgreSQL.
- Do not change MapLibre.
- Do not change ECharts.
- Do not add Firebase.
- Do not add MongoDB.
- Do not implement AI features.
- Do not use excessive gradients.
- Do not use glassmorphism.
- Do not use random placeholder data in production paths.
- Prefer reusable typed components.
- Preserve responsive behavior.
```

---

# 92. Development Workflow

```text
REQUIREMENT FREEZE
       ↓
DATA SAMPLE
       ↓
DATABASE
       ↓
GEOJSON
       ↓
API FOUNDATION
       ↓
DESIGN SYSTEM
       ↓
DASHBOARD
       ↓
MAP
       ↓
CHARTS
       ↓
IMPORT
       ↓
VALIDATION
       ↓
ADMIN
       ↓
TEST
       ↓
UAT
       ↓
DEPLOY
```

---

# 93. Timeline 4 Minggu

## Minggu 1 — Foundation

### Hari 1–2

- requirement freeze;
- sample dataset;
- final tech stack;
- repo;
- project setup.

### Hari 3–4

- database schema;
- seed wilayah;
- indicator master;
- year master.

### Hari 5–7

- GeoJSON;
- API foundation;
- auth;
- design system;
- layout.

### Target

```text
Login jalan
Database jalan
Layout jalan
Map Indonesia tampil
```

---

# 94. Minggu 2 — Public Dashboard

- global filters;
- KPI;
- choropleth;
- hover;
- click;
- province drilldown;
- detail wilayah;
- line chart;
- bar chart;
- data table.

### Target

Public dashboard usable.

---

# 95. Minggu 3 — Analytics & Data Management

- radar;
- scatter X–Y;
- correlation;
- quadrant;
- comparison wilayah;
- import;
- mapping;
- validation;
- manual data edit.

### Target

Feature complete.

---

# 96. Minggu 4 — Backend, QA & Deployment

- user management;
- log activity;
- permission;
- responsive;
- optimization;
- test;
- UAT;
- bugfix;
- deployment;
- documentation.

### Rule

Tidak menambah major feature baru di minggu 4.

---

# 97. Prioritas Jika Waktu Terlambat

## P0 — Wajib

- database;
- map;
- filters;
- indicators;
- trends;
- scatter;
- table;
- import;
- validation;
- auth.

## P1

- radar;
- comparison;
- ranking;
- audit log.

## P2

- announcement;
- advanced search;
- PDF;
- advanced settings.

---

# 98. Backend UI Recommendation

Contoh dari pihak atas memiliki arah yang cukup baik untuk backend karena:

- sidebar jelas;
- data management terpisah;
- master data terpisah;
- status data terlihat;
- import wizard tersedia;
- validation screen tersedia.

Namun disarankan melakukan simplifikasi:

### Pertahankan

- left sidebar;
- filter bar;
- status KPI;
- data table;
- detail panel;
- stepper import;
- validation summary.

### Improvisasi

- kurangi card dekoratif;
- whitespace lebih konsisten;
- tidak semua halaman wajib punya 4 KPI;
- detail panel muncul sesuai konteks;
- table density dapat lebih tinggi;
- warna status dibuat konsisten;
- ukuran header dikurangi jika menghabiskan ruang.

---

# 99. Public UI Recommendation

Public dashboard sebaiknya **tidak terlihat seperti backend**.

Gunakan layout:

```text
Header
↓
Global Filter
↓
Map + Ranking
↓
Trend + Distribution
↓
X–Y Analysis
↓
Table
```

Navigasi publik dibuat lebih sederhana daripada sidebar admin.

---

# 100. Example Public Dashboard

```text
┌─────────────────────────────────────────────────┐
│ Dashboard Kinerja Daerah                        │
│ Tahun 2024 | Provinsi | IDSD                    │
├──────────────────────────────┬──────────────────┤
│                              │ Ranking          │
│                              │ 1. DKI           │
│          MAP                 │ 2. DIY           │
│                              │ 3. Kaltim        │
│                              │                  │
├──────────────────────────────┴──────────────────┤
│ KPI                                              │
├───────────────────────┬─────────────────────────┤
│ Trend                 │ Radar / Distribution    │
├───────────────────────┴─────────────────────────┤
│ Analisis X-Y                                    │
├─────────────────────────────────────────────────┤
│ Table                                            │
└─────────────────────────────────────────────────┘
```

---

# 101. Dashboard Interaction

Jika user hover map:

```text
show tooltip
```

Jika user click map:

```text
select region
→ update chart
→ update detail panel
```

Jika user mengganti indikator:

```text
update:
map
legend
KPI
ranking
trend
table
```

---

# 102. Deep Linking

URL harus dapat menyimpan state.

Contoh:

```text
/map?year=2024&indicator=IDSD&province=32
```

Supaya pengguna dapat membagikan analisis.

---

# 103. Metadata

Setiap chart/data harus memiliki:

```text
Sumber
Tahun
Update terakhir
Unit
Definisi
```

Definisi tidak harus selalu terlihat.

Bisa melalui:

```text
info tooltip
```

---

# 104. Source Management

Table:

```text
sources
```

Field:

```text
id
name
organization
url
notes
```

Contoh:

```text
BRIN
BPS
Kemendagri
Kemenkeu
```

---

# 105. Indicator Formula

Jika ada indikator hasil kalkulasi:

tambahkan:

```text
calculation_type
formula
```

Tetapi jangan menjalankan formula arbitrary dari admin pada MVP.

Gunakan formula yang dikontrol developer.

---

# 106. Data Category Threshold

Contoh IDSD:

```text
1.00–2.00 Rendah
2.01–3.50 Sedang
3.51–5.00 Tinggi
```

Threshold jangan hardcode dalam komponen.

Simpan sebagai konfigurasi indikator.

---

# 107. Optional Schema Threshold

```text
indicator_thresholds

id
indicator_id
label
min_value
max_value
sort_order
```

---

# 108. Data Provenance

Setiap record idealnya dapat dilacak:

```text
value
↓
dataset
↓
file import
↓
user
↓
import time
```

Penting untuk data institusional.

---

# 109. Data Versioning

Minimal:

jangan langsung kehilangan nilai lama saat update manual.

Opsi:

```text
indicator_value_history
```

Field:

```text
value_id
old_value
new_value
changed_by
changed_at
reason
```

Jika timeline terlalu pendek, audit log JSON cukup untuk MVP.

---

# 110. Delete Strategy

Master data:

```text
soft delete / inactive
```

lebih aman daripada hard delete.

Nilai yang sudah dipakai sebaiknya tidak dapat dihapus tanpa confirmation.

---

# 111. Confirmation

Action kritis:

- delete;
- deactivate;
- replace import;
- role change.

Harus menggunakan dialog.

---

# 112. Toast

Gunakan feedback:

```text
Data berhasil disimpan.
Data gagal diperbarui.
Import selesai: 548 data berhasil, 4 data gagal.
```

---

# 113. Form UX

- label selalu terlihat;
- required marker;
- inline validation;
- helper text;
- disable submit saat invalid;
- loading state;
- prevent double submit.

---

# 114. CRUD Data

Manual add flow:

```text
Pilih Tahun
↓
Pilih Wilayah
↓
Pilih Indikator
↓
Masukkan Nilai
↓
Sumber
↓
Metadata
↓
Preview
↓
Save
```

Wizard seperti referensi boleh digunakan jika data memiliki banyak subkomponen.

Untuk CRUD sederhana jangan pakai wizard jika hanya 5–7 field.

---

# 115. 12 Pilar / Subindicator

Jika IDSD memiliki subindikator:

struktur:

```text
indicator
└── parent_indicator_id
```

Contoh:

```text
IDSD
├── Institusi
├── Infrastruktur
├── TIK
├── Ekonomi
└── ...
```

---

# 116. Hierarchical Indicator

Tambahkan field:

```text
parent_id
level
```

agar satu sistem dapat mendukung:

```text
Index
Pillar
Subpillar
Metric
```

---

# 117. Suggested Indicator Table Extended

```text
indicators

id
code
name
slug
category_id
parent_id
level
unit
direction
description
definition
min_value
max_value
is_active
```

---

# 118. API Pagination

Query:

```text
?page=1
&limit=25
&sort=name
&order=asc
```

Response:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 552,
    "totalPages": 23
  }
}
```

---

# 119. Query Filter Standard

```text
year
region
province
level
indicator
category
source
status
```

---

# 120. Technical Error Handling

Error categories:

```text
VALIDATION_ERROR
AUTH_ERROR
FORBIDDEN
NOT_FOUND
CONFLICT
IMPORT_ERROR
INTERNAL_ERROR
```

---

# 121. Monitoring

MVP minimal:

- application error log;
- database health;
- disk usage;
- uptime.

Optional:

- Sentry;
- uptime monitor.

---

# 122. Browser Support

Minimal:

- Chrome latest;
- Edge latest;
- Firefox latest;
- Safari recent.

Prioritas:

Chrome/Edge desktop.

---

# 123. Mobile Support

Mobile bukan fokus utama analisis kompleks, tetapi:

- dashboard harus dapat dibuka;
- map usable;
- filter usable;
- chart readable;
- admin basic usable.

---

# 124. Documentation Handover

Sebelum selesai:

```text
README.md
DEPLOYMENT.md
DATABASE.md
IMPORT_GUIDE.md
ADMIN_GUIDE.md
```

---

# 125. Data Requirement dari Pihak BRIN

Sebelum development penuh, minta:

1. sample dataset asli;
2. daftar indikator;
3. definisi indikator;
4. range indikator;
5. satuan;
6. source;
7. kode wilayah;
8. tahun tersedia;
9. GeoJSON/shapefile;
10. contoh output/dashboard yang dianggap benar;
11. server/deployment constraint;
12. requirement public/internal;
13. role pengguna;
14. format import final.

---

# 126. Requirement Freeze Checklist

Sebelum coding besar:

```text
[ ] Stack disetujui
[ ] Data sample diterima
[ ] Region code dipastikan
[ ] GeoJSON tersedia
[ ] Indicator schema dipastikan
[ ] Tahun dipastikan
[ ] Role dipastikan
[ ] Hosting dipastikan
[ ] Public/private dipastikan
[ ] Design direction dipastikan
```

---

# 127. Definition of Done — MVP

MVP dianggap selesai jika:

- login admin berfungsi;
- role minimum berfungsi;
- data wilayah tersedia;
- GeoJSON tampil;
- map hover/click berfungsi;
- filter tahun/indikator berfungsi;
- chart berfungsi;
- scatter X–Y berfungsi;
- detail wilayah berfungsi;
- compare berfungsi;
- import CSV/XLSX berfungsi;
- validation berfungsi;
- data valid dapat disimpan;
- public dashboard responsive;
- error/loading state tersedia;
- UAT selesai;
- production deploy berhasil.

---

# 128. Acceptance Criteria — Map

```text
Given user memilih tahun 2024
And indikator IDSD
When map dimuat
Then semua wilayah dengan data harus memiliki warna sesuai skala
And wilayah tanpa data harus terlihat berbeda
And hover menampilkan informasi
And click memilih wilayah
```

---

# 129. Acceptance Criteria — Scatter

```text
Given user memilih X = KFD
And Y = Kemiskinan
And level = Provinsi
When data dimuat
Then setiap provinsi valid muncul sebagai titik
And tooltip menampilkan nama dan nilai
And correlation dihitung dari record yang valid
And missing values diabaikan
```

---

# 130. Acceptance Criteria — Import

```text
Given admin upload XLSX
When file dibaca
Then preview tampil
And mapping dapat diperiksa
And invalid rows ditandai
And user dapat memperbaiki data
And valid rows dapat diimport
And import tercatat di log
```

---

# 131. Acceptance Criteria — Responsive

```text
Given layar mobile
When dashboard dibuka
Then tidak ada komponen keluar viewport
And filter tetap dapat digunakan
And map dapat di-scroll/zoom
And chart tetap readable
```

---

# 132. Risiko Proyek

## R1 — Format Data Berubah

Mitigasi:

- flexible column mapping;
- sample data sejak awal.

## R2 — Kode Wilayah Tidak Konsisten

Mitigasi:

- master region;
- validation;
- mapping table.

## R3 — GeoJSON Berat

Mitigasi:

- simplify;
- split per provinsi;
- lazy load.

## R4 — Scope Creep

Mitigasi:

- P0/P1/P2;
- requirement freeze.

## R5 — AI Agent Mengubah Stack

Mitigasi:

- AGENT_RULES.md;
- technical docs.

## R6 — Deployment Restriction

Mitigasi:

- konfirmasi server pada minggu pertama.

---

# 133. Recommended Final Stack

```text
Frontend / Full-stack:
Next.js + TypeScript

Styling:
Tailwind CSS + shadcn/ui

Database:
PostgreSQL

ORM:
Prisma

Map:
MapLibre GL JS

Chart:
Apache ECharts

Table:
TanStack Table

Validation:
Zod

Spreadsheet:
SheetJS / ExcelJS

Auth:
Auth.js atau custom credential session yang aman

Deployment:
Docker + Nginx + PostgreSQL
```

---

# 134. Architecture Summary

```text
                 BRIN DATA
                 XLSX / CSV
                     │
                     ▼
                Import Engine
                     │
               Data Validation
                     │
                     ▼
                PostgreSQL
                     │
                   Prisma
                     │
                     ▼
                  Next.js
         ┌───────────┼────────────┐
         │           │            │
         ▼           ▼            ▼
      MapLibre    ECharts      TanStack
         │           │            │
         └───────────┼────────────┘
                     ▼
              Dashboard UI
```

---

# 135. Final Product Positioning

Aplikasi sebaiknya diposisikan sebagai:

> **Platform Analisis Spasial dan Kinerja Pembangunan Daerah**

Bukan hanya:

> “Website data BRIN”

Fokus pembeda produk:

1. **peta sebagai media eksplorasi wilayah;**
2. **scatter X–Y sebagai media analisis antarindikator;**
3. **comparison sebagai media evaluasi antarwilayah;**
4. **import + validation sebagai fondasi kualitas data;**
5. **metadata dan provenance sebagai fondasi kredibilitas data.**

---

# 136. Prioritas Utama Selama Pengembangan

Jika harus memilih antara visual ekstra dan fondasi data:

```text
DATA QUALITY
>
FILTER CONSISTENCY
>
MAP
>
ANALYTICS
>
UI DECORATION
```

Artinya:

lebih baik dashboard sederhana tetapi data akurat daripada dashboard sangat cantik dengan query yang tidak konsisten.

---

# 137. Catatan Terhadap Referensi UI dari Pihak Atas

Contoh backend yang diberikan dapat dijadikan referensi untuk:

- struktur sidebar;
- master indicator;
- master year;
- import wizard;
- validation page;
- detail side panel;
- user management;
- admin dashboard;
- spatial preview.

Namun implementasi final boleh:

- lebih minimal;
- lebih clean;
- lebih modern;
- mengurangi elemen yang repetitif;
- memperbaiki hierarchy;
- mengurangi tinggi header;
- memperbaiki spacing;
- membuat chart lebih fokus;
- menggunakan komponen reusable.

Tidak ada kewajiban menyalin screenshot 1:1.

---

# 138. Recommended Development Principle

```text
Build the data system first.
Then build the visualization.
Then polish the UI.
```

Urutan yang salah:

```text
UI cantik
→ dummy data
→ chart
→ baru memikirkan database
```

Urutan yang benar:

```text
Dataset
→ schema
→ API
→ map
→ chart
→ UI polish
```

---

# 139. MVP Final Checklist

## Foundation

```text
[ ] Next.js project
[ ] TypeScript
[ ] PostgreSQL
[ ] Prisma
[ ] Auth
[ ] RBAC
```

## Data

```text
[ ] Regions
[ ] Indicators
[ ] Years
[ ] Sources
[ ] Values
[ ] Datasets
```

## Spatial

```text
[ ] Province GeoJSON
[ ] Regency GeoJSON
[ ] Hover
[ ] Click
[ ] Drilldown
```

## Dashboard

```text
[ ] KPI
[ ] Filters
[ ] Ranking
[ ] Trend
[ ] Radar
[ ] Scatter
[ ] Table
```

## Analysis

```text
[ ] Compare regions
[ ] X-Y analysis
[ ] Correlation
[ ] Quadrant
```

## Data Management

```text
[ ] Manual CRUD
[ ] Import
[ ] Preview
[ ] Mapping
[ ] Validation
[ ] Error review
```

## System

```text
[ ] Users
[ ] Roles
[ ] Activity log
```

## Quality

```text
[ ] Responsive
[ ] Loading
[ ] Empty state
[ ] Error state
[ ] Accessibility
[ ] Security
[ ] Performance
[ ] Backup
```

---

# 140. Suggested Next Step

Setelah dokumen ini disetujui:

```text
1. Dapatkan sample data
2. Finalisasi schema
3. Buat DATABASE.md
4. Buat DESIGN_SYSTEM.md
5. Buat API.md
6. Buat AGENT_RULES.md
7. Setup repository
8. Mulai implementasi minggu pertama
```

---

# 141. Kesimpulan

Untuk target satu bulan dengan metode vibe coding, aplikasi ini masih realistis selama pengembangan difokuskan pada:

- data management yang terstruktur;
- interactive spatial dashboard;
- analisis indikator;
- import & validation;
- UI modern namun tidak berlebihan;
- scope MVP yang disiplin.

Stack yang paling direkomendasikan:

```text
Next.js + TypeScript
PostgreSQL + Prisma
MapLibre GL JS
Apache ECharts
TanStack Table
Tailwind CSS + shadcn/ui
```

Pendekatan ini memberikan keseimbangan antara:

- kecepatan pengembangan;
- maintainability;
- performa;
- fleksibilitas;
- UX;
- scalability.

Arah desain backend dari contoh pihak atas sudah cukup bagus sebagai **referensi struktur**, tetapi final UI disarankan dibuat lebih konsisten, lebih ringan, dan lebih fokus pada aktivitas pengguna daripada meniru tampilan contoh secara persis.

---

**End of PRD**
