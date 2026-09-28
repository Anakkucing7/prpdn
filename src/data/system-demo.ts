// Explicit demonstration records, not workbook data or production identities.
export const roles = ['Public Viewer', 'Internal Viewer', 'Operator', 'Validator', 'Administrator', 'Super Admin'] as const;
export type Role = typeof roles[number];
export type DemoUser = { id: string; name: string; username: string; email: string; workUnit: string; role: Role; status: 'Aktif' | 'Nonaktif'; origin: 'Contoh demo' | 'Diubah lokal' | 'Ditambahkan lokal' };
export const demoUsers: DemoUser[] = [
  { id:'demo-1', name:'Admin Demo', username:'admin.demo', email:'admin@example.com', workUnit:'Administrasi data (contoh)', role:'Administrator', status:'Aktif', origin:'Contoh demo' },
  { id:'demo-2', name:'Operator Demo', username:'operator.demo', email:'operator@example.com', workUnit:'Pengelolaan data (contoh)', role:'Operator', status:'Aktif', origin:'Contoh demo' },
  { id:'demo-3', name:'Validator Demo', username:'validator.demo', email:'validator@example.com', workUnit:'Peninjauan data (contoh)', role:'Validator', status:'Aktif', origin:'Contoh demo' },
  { id:'demo-4', name:'Viewer Internal Demo', username:'viewer.internal', email:'viewer@example.com', workUnit:'Riset (contoh)', role:'Internal Viewer', status:'Aktif', origin:'Contoh demo' },
  { id:'demo-5', name:'Super Admin Demo', username:'superadmin.demo', email:'superadmin@example.com', workUnit:'Administrasi sistem (contoh)', role:'Super Admin', status:'Aktif', origin:'Contoh demo' },
  { id:'demo-6', name:'Publik Demo', username:'publik.demo', email:'publik@example.com', workUnit:'', role:'Public Viewer', status:'Nonaktif', origin:'Contoh demo' },
];
export type PermissionLevel = 'Tidak' | 'Ya' | 'Terbatas' | 'Opsional';
export type PermissionRow = { module: string; action: string; levels: PermissionLevel[] };
// PRD sections 6–7. Viewer column is shared by Public and Internal Viewer;
// Internal Viewer has the additional restricted dataset access described in §6.2.
export const permissionRows: PermissionRow[] = [
  {module:'Portal publik / Dashboard',action:'Lihat',levels:['Ya','Ya','Ya','Ya','Ya','Ya']},
  {module:'Data Wilayah',action:'Lihat detail',levels:['Ya','Ya','Ya','Ya','Ya','Ya']},
  {module:'Dataset internal',action:'Lihat sesuai cakupan',levels:['Tidak','Terbatas','Terbatas','Terbatas','Ya','Ya']},
  {module:'Data IDSD / KFD / Kemiskinan / EPPD / RPJMD',action:'Tambah',levels:['Tidak','Tidak','Ya','Ya','Ya','Ya']},
  {module:'Data IDSD / KFD / Kemiskinan / EPPD / RPJMD',action:'Ubah',levels:['Tidak','Tidak','Ya','Ya','Ya','Ya']},
  {module:'Import Data',action:'Import',levels:['Tidak','Tidak','Ya','Ya','Ya','Ya']},
  {module:'Validasi Data',action:'Validasi',levels:['Tidak','Tidak','Tidak','Ya','Ya','Ya']},
  {module:'Master Indikator',action:'Kelola',levels:['Tidak','Tidak','Tidak','Tidak','Ya','Ya']},
  {module:'Master Tahun',action:'Kelola',levels:['Tidak','Tidak','Tidak','Tidak','Ya','Ya']},
  {module:'Data Wilayah',action:'Kelola',levels:['Tidak','Tidak','Tidak','Tidak','Ya','Ya']},
  {module:'Manajemen Pengguna',action:'Kelola pengguna',levels:['Tidak','Tidak','Tidak','Tidak','Ya','Ya']},
  {module:'Role & Hak Akses',action:'Kelola izin',levels:['Tidak','Tidak','Tidak','Tidak','Tidak','Ya']},
  {module:'Log Aktivitas',action:'Lihat',levels:['Tidak','Tidak','Terbatas','Terbatas','Ya','Ya']},
  {module:'Pengaturan',action:'Kelola',levels:['Tidak','Tidak','Tidak','Tidak','Terbatas','Ya']},
];
export type DemoActivity = { id:string; actor:string; action:string; module:string; timestamp:string; result:string; entity:string; before:string; after:string; description:string };
export const demoActivities: DemoActivity[] = [
  {id:'log-demo-01',actor:'demo-2',action:'IMPORT_DATA',module:'Import Data',timestamp:'2026-09-24T09:15:00+07:00',result:'Perlu tinjau',entity:'Batch contoh IDSD',before:'Belum ada preview',after:'Preview contoh siap ditinjau',description:'Skenario preview sampel; tidak ada unggahan atau penulisan database.'},
  {id:'log-demo-02',actor:'demo-3',action:'VALIDATE',module:'Validasi Data',timestamp:'2026-09-24T09:30:00+07:00',result:'Berhasil',entity:'Baris contoh IDSD',before:'Belum ditinjau',after:'Ditinjau dalam skenario',description:'Contoh keputusan pemeriksaan sumber, bukan hasil validasi produksi.'},
  {id:'log-demo-03',actor:'demo-1',action:'CREATE',module:'Master Tahun',timestamp:'2026-09-23T10:00:00+07:00',result:'Berhasil',entity:'Tahun contoh 2026',before:'Tidak ada',after:'2026',description:'Contoh penambahan tahun. Tidak mengubah master aktual.'},
  {id:'log-demo-04',actor:'demo-1',action:'UPDATE',module:'Master Indikator',timestamp:'2026-09-23T10:10:00+07:00',result:'Berhasil',entity:'Indikator contoh',before:'Nama contoh lama',after:'Nama contoh diperbarui',description:'Skenario perubahan metadata lokal.'},
  {id:'log-demo-05',actor:'demo-5',action:'CHANGE_ROLE',module:'Manajemen Pengguna',timestamp:'2026-09-23T11:00:00+07:00',result:'Berhasil',entity:'Akun contoh',before:'Internal Viewer',after:'Operator',description:'Contoh perubahan role; tidak memberi akses nyata.'},
  {id:'log-demo-06',actor:'demo-5',action:'UPDATE',module:'Role & Hak Akses',timestamp:'2026-09-22T13:00:00+07:00',result:'Berhasil',entity:'Matriks izin contoh',before:'Rancangan awal',after:'Rancangan ditinjau',description:'Contoh revisi rancangan izin tanpa enforcement.'},
  {id:'log-demo-07',actor:'demo-1',action:'UPDATE',module:'Pengaturan',timestamp:'2026-09-22T14:00:00+07:00',result:'Berhasil',entity:'Preferensi contoh',before:'Tahun 2023',after:'Tahun 2024',description:'Skenario pengubahan preferensi, tidak memengaruhi dashboard.'},
  {id:'log-demo-08',actor:'demo-2',action:'IMPORT_DATA',module:'Import Data',timestamp:'2026-09-21T08:00:00+07:00',result:'Gagal',entity:'Berkas contoh',before:'Berkas dipilih',after:'Format tidak didukung',description:'Skenario penolakan tipe file sebelum preview.'},
  {id:'log-demo-09',actor:'demo-1',action:'UPDATE',module:'Data KFD',timestamp:'2026-09-21T09:00:00+07:00',result:'Perlu tinjau',entity:'Observasi contoh',before:'Belum ditinjau',after:'Perlu verifikasi sumber',description:'Skenario audit masa depan, bukan perubahan pada workbook.'},
  {id:'log-demo-10',actor:'demo-3',action:'VALIDATE',module:'Data Kemiskinan',timestamp:'2026-09-21T10:00:00+07:00',result:'Perlu tinjau',entity:'Kode wilayah contoh',before:'Belum diperiksa',after:'Kode dan nama perlu ditinjau',description:'Contoh pencatatan masalah padanan wilayah.'},
  {id:'log-demo-11',actor:'demo-3',action:'VALIDATE',module:'Data EPPD',timestamp:'2026-09-20T10:00:00+07:00',result:'Berhasil',entity:'Status contoh',before:'Belum diperiksa',after:'Catatan sumber diperiksa',description:'Skenario pemeriksaan status Tidak Dinilai.'},
  {id:'log-demo-12',actor:'demo-3',action:'VALIDATE',module:'Data RPJMD',timestamp:'2026-09-20T11:00:00+07:00',result:'Perlu tinjau',entity:'Satuan contoh',before:'Belum diperiksa',after:'Satuan perlu dikonfirmasi',description:'Contoh audit metadata; tidak memperbaiki sumber otomatis.'},
];
