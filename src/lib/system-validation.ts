import { roles, type DemoUser } from '../data/system-demo';
export type UserDraft = Pick<DemoUser,'name'|'username'|'email'|'workUnit'|'role'>;
export function validateUser(draft:UserDraft, others:DemoUser[]) {
  const errors:Partial<Record<keyof UserDraft,string>> = {};
  if (!draft.name.trim()) errors.name='Isi nama pengguna.';
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(draft.username.trim())) errors.username='Gunakan 3–40 huruf, angka, titik, garis bawah, atau tanda hubung.';
  else if(others.some(u=>u.username.toLowerCase()===draft.username.trim().toLowerCase())) errors.username='Username sudah digunakan dalam demo.';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) errors.email='Masukkan alamat email yang valid.';
  else if(others.some(u=>u.email.toLowerCase()===draft.email.trim().toLowerCase())) errors.email='Email sudah digunakan dalam demo.';
  if(!roles.includes(draft.role)) errors.role='Pilih role yang tersedia.';
  return errors;
}
export type SettingsDraft = { name:string; description:string; year:string; province:string; pageSize:string };
export function validateSettings(draft:SettingsDraft) {
  const errors:Partial<Record<keyof SettingsDraft,string>>={};
  if(!draft.name.trim() || draft.name.trim().length>80) errors.name='Isi nama aplikasi, maksimal 80 karakter.';
  if(!draft.description.trim() || draft.description.trim().length>200) errors.description='Isi deskripsi, maksimal 200 karakter.';
  if(!['2022','2023','2024'].includes(draft.year)) errors.year='Pilih tahun indikator yang tersedia.';
  if(!['10','15','25'].includes(draft.pageSize)) errors.pageSize='Pilih 10, 15, atau 25 baris.';
  return errors;
}
