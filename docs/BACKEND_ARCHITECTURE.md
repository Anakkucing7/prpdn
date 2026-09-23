# Arah arsitektur produksi PRPDN

Keputusan Phase 5.5: database produksi menggunakan **MySQL**, dengan **Prisma ORM** dan **Backend/API**. Dokumen ini menggantikan rekomendasi PostgreSQL/PostGIS dan batas upload tetap pada draft PRD sebelumnya, khusus untuk arah arsitektur tersebut. Kebutuhan produk lainnya tetap mengikuti PRD.

## Batas fase

- **Phase 1–5 saat ini:** prototipe frontend Next.js, fixture lokal, dan state komponen. CRUD, review, dan hasil import bersifat demo. File pilihan hanya digunakan untuk metadata; preview memakai sampel, bukan hasil parsing file.
- **Fase backend mendatang:** API nyata, Prisma, MySQL, CRUD persisten, parsing spreadsheet, serta validasi dan tinjauan berbasis database.
- Phase 5.5 hanya menyelaraskan dokumentasi dan batasan UI. Tidak memasang Prisma/MySQL, membuat API, autentikasi, upload nyata, atau migrasi. Tidak memulai Phase 6.

## Alur dan pemetaan

```text
Next.js frontend → Backend/API → Prisma ORM → MySQL
```

Frontend tidak mengakses database secara langsung. API bertanggung jawab atas otorisasi, validasi server, transaksi, dan respons kesalahan. Bentuk deployment Backend/API ditentukan pada fase backend; dokumen ini tidak mewajibkan layanan terpisah.

| Modul | Implementasi produksi yang dituju |
| --- | --- |
| Master Tahun | UI CRUD → API CRUD → Prisma → MySQL |
| Master Indikator | UI CRUD → API CRUD → Prisma → MySQL |
| Data Wilayah / IDSD | API query → Prisma → MySQL menggantikan fixture statis, termasuk filter dan pagination sesuai kebutuhan |
| Import Data | Upload → parse → validasi/staging → preview → persetujuan → penyimpanan transaksi ke MySQL melalui Prisma |
| Validasi Data | Temuan, koreksi, keputusan review, dan jejak sumber disimpan melalui API/Prisma di MySQL |

Pertahankan komponen, formulir, tabel, drawer, dan alur CRUD yang sudah dibangun. Hubungkan operasi state demo ke API pada fase backend; UI tidak perlu dibangun ulang. Tambahkan penanganan loading, error, konflik, serta hasil server pada integrasi tersebut. Validasi frontend membantu pengguna, tetapi keputusan akhir harus ditegakkan server.

Fixture tetap berguna untuk demo dan pengujian; fixture bukan sumber data operasional produksi. Data mentah dan provenance harus tetap dapat ditelusuri. Koreksi tidak boleh diam-diam mengganti data sumber, dan hasil validasi harus terkait dengan batch/baris yang benar-benar diunggah.

## Import administratif reguler

Format utama adalah **.xlsx / .xls / .csv**. Batas 10 MB pada prototipe telah dihapus; itu bukan batas produk. Ukuran upload produksi akan dikonfigurasi dan ditegakkan oleh backend, diselaraskan dengan infrastruktur deployment serta kemampuan pemrosesan. UI nantinya menampilkan batas yang berlaku dari konfigurasi tersebut. Tidak ada angka batas produksi yang ditetapkan dalam fase ini.

Backend nantinya memeriksa jenis/isi file, memproses ke staging, memvalidasi field wajib, referensi, format dan duplikat terhadap database, lalu menampilkan preview dan temuan sebelum persetujuan. Kebijakan skip/update/replace harus eksplisit; penyimpanan dan audit menggunakan transaksi sesuai rancangan backend. Prototipe saat ini tidak menjalankan alur produksi ini.

## Jalur SQL terbatas — belum diimplementasikan

Import SQL adalah jalur terpisah untuk **Super Admin / DBA**, bukan bagian dari import administratif reguler. Administrator data biasa menggunakan spreadsheet/CSV. Pemilihan file SQL tidak didukung UI import saat ini.

Jalur mendatang tidak boleh mengeksekusi SQL unggahan secara langsung, termasuk hanya berdasarkan ekstensi, daftar kata terlarang, atau konfirmasi pengguna. Diperlukan otorisasi server, parsing dan inspeksi statement, daftar operasi/tabel/kolom yang diizinkan, staging atau dry-run, preview, persetujuan eksplisit, serta audit dan strategi pemulihan sebelum penulisan data.

Statement berbahaya seperti `DROP`, `TRUNCATE`, `ALTER`, `GRANT`, `REVOKE`, dan `CREATE USER` **tidak boleh diterima melalui import administratif normal**. Jalur SQL terbatas juga tidak otomatis mengizinkannya karena pengguna berperan Super Admin/DBA. Perubahan skema/hak akses harus melalui prosedur migrasi atau administrasi database yang terpisah, bukan upload data biasa.

## Prinsip pemeliharaan data

Setelah skema stabil, administrator harus dapat menambah dan memperbarui record dataset reguler melalui CRUD atau import **tanpa mengedit source code aplikasi atau membangun ulang frontend**. Halaman membaca data dari API; perubahan record harus terlihat melalui query/refresh atau invalidasi cache yang sesuai.

Perubahan skema, relasi, constraint, dan kebutuhan domain baru tetap menjadi tanggung jawab developer melalui perubahan Prisma schema, migrasi MySQL yang direview, pengujian, dan deployment. Administrasi data rutin berbeda dari perubahan struktur aplikasi/database.
