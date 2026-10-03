"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SelectField } from '@/components/ui-patterns';
import { provinceOptions } from '@/lib/regions';
import { validateSettings, type SettingsDraft } from '@/lib/system-validation';
import { MasterField, focusInvalid } from './master-shared';
import { api, RequestError } from '@/lib/api-client';

type SystemSettings={name:string;description:string;publicRegistrationOpen:boolean;year:number;province:string;pageSize:number;version:number;updatedAt:string;pendingRegistrations:number;activeAccounts:number};
const initial:SettingsDraft={name:'PRPDN',description:'Data pembangunan daerah',publicRegistrationOpen:true,year:'2024',province:'all',pageSize:'15'};
const toDraft=({name,description,publicRegistrationOpen,year,province,pageSize}:SystemSettings):SettingsDraft=>({name,description,publicRegistrationOpen,year:String(year),province,pageSize:String(pageSize)});

export default function SettingsPage(){
  const router=useRouter();const [saved,setSaved]=useState<SystemSettings|null>(null);const [draft,setDraft]=useState(initial);const [errors,setErrors]=useState<Partial<Record<keyof SettingsDraft,string>>>({});const [message,setMessage]=useState('Memuat pengaturan…');const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);
  useEffect(()=>{let current=true;api<SystemSettings>('/api/admin/settings/').then(value=>{if(!current)return;setSaved(value);setDraft(toDraft(value));setMessage(`Terakhir diperbarui ${new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Jakarta'}).format(new Date(value.updatedAt))} WIB.`);}).catch(cause=>{if(current)setError(cause instanceof RequestError?cause.message:'Pengaturan belum dapat dimuat.');}).finally(()=>{if(current)setLoading(false);});return()=>{current=false;};},[]);
  const changed=!!saved&&Object.keys(initial).some(key=>draft[key as keyof SettingsDraft]!==toDraft(saved)[key as keyof SettingsDraft]);
  function cancel(){if(saved)setDraft(toDraft(saved));setErrors({});setError('');setMessage('Perubahan formulir dibatalkan.');}
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();const next=validateSettings(draft);setErrors(next);const first=Object.keys(next)[0];if(first){focusInvalid(event.currentTarget,first);return;}if(!saved)return;setSaving(true);setError('');try{const result=await api<Omit<SystemSettings,'pendingRegistrations'|'activeAccounts'>>('/api/admin/settings/','PATCH',{...draft,year:Number(draft.year),pageSize:Number(draft.pageSize),name:draft.name.trim(),description:draft.description.trim(),version:saved.version});const updated={...saved,...result};setSaved(updated);setDraft(toDraft(updated));setMessage('Pengaturan berhasil disimpan dan diterapkan.');router.refresh();}catch(cause){setError(cause instanceof RequestError?cause.message:'Pengaturan belum tersimpan. Coba kembali.');}finally{setSaving(false);}}
  return <div className="data-page system-page"><PageHeader title="Pengaturan sistem" parent="Sistem" description="Kelola akses akun dan konfigurasi yang langsung mengubah perilaku PRPDN."/>
    {error&&<p className="auth-form-error" role="alert">{error}</p>}
    {loading?<div className="data-panel data-loading" role="status">Memuat pengaturan…</div>:<form className="system-settings" onSubmit={submit}>
      <section className="data-panel"><div className="data-panel-heading"><div><h2>Akses & keamanan akun</h2><p>Kontrol siapa yang dapat mendaftar dan pantau akun yang perlu ditinjau.</p></div></div><div className="system-settings-fields">
        <label className="settings-registration-toggle"><input type="checkbox" checked={draft.publicRegistrationOpen} onChange={event=>setDraft({...draft,publicRegistrationOpen:event.target.checked})} /><span><strong>Pendaftaran publik dibuka</strong><small>{draft.publicRegistrationOpen?'Pengunjung dapat mengirim permintaan akun baru.':'Pendaftaran ditutup; pengunjung tidak dapat membuat akun baru.'} Setiap pendaftar tetap menunggu persetujuan Admin atau Super Admin sebelum bisa masuk.</small></span><span className={draft.publicRegistrationOpen?'settings-state-open':'settings-state-closed'}>{draft.publicRegistrationOpen?'Dibuka':'Ditutup'}</span></label>
        <div className="settings-account-stats"><div><strong>{saved?.pendingRegistrations??0}</strong><span>Menunggu persetujuan</span><Link href="/admin/users/">Tinjau pendaftar</Link></div><div><strong>{saved?.activeAccounts??0}</strong><span>Akun aktif</span><Link href="/admin/users/">Kelola pengguna</Link></div><div><strong>Wajib</strong><span>Persetujuan akun baru</span><small>Aktivasi manual sebelum login</small></div></div>
      </div></section>
      <section className="data-panel"><div className="data-panel-heading"><div><h2>Identitas ruang administrasi</h2><p>Nama dan deskripsi ini tampil pada navigasi dan bagian bawah ruang administrasi.</p></div></div><div className="system-settings-fields">
        <MasterField name="name" label="Nama aplikasi" required maxLength={80} value={draft.name} error={errors.name} onChange={e=>setDraft({...draft,name:e.target.value})}/>
        <MasterField name="description" label="Deskripsi singkat" required maxLength={200} value={draft.description} error={errors.description} onChange={e=>setDraft({...draft,description:e.target.value})}/>
      </div></section>
      <section className="data-panel"><div className="data-panel-heading"><div><h2>Nilai awal analisis</h2><p>Dipakai saat pertama membuka halaman data analitis. Pengguna tetap dapat mengganti filter di tiap halaman.</p></div></div><div className="system-settings-fields system-settings-grid">
        <SelectField label="Tahun awal" value={draft.year} onValueChange={year=>setDraft({...draft,year})} options={['2024','2023','2022'].map(value=>({value,label:value}))}/>
        <SelectField label="Provinsi awal" value={draft.province} onValueChange={province=>setDraft({...draft,province})} options={provinceOptions}/>
        <SelectField label="Jumlah baris tabel analitis" value={draft.pageSize} onValueChange={pageSize=>setDraft({...draft,pageSize})} options={['10','15','25'].map(value=>({value,label:`${value} baris`}))}/>
      </div></section>
      <div className="system-settings-footer"><p role="status">{message}</p><div className="system-actions"><Button type="button" variant="outline" disabled={!changed||saving} onClick={cancel}>Batalkan perubahan</Button><Button type="submit" disabled={!changed||saving}>{saving?'Menyimpan…':'Simpan pengaturan'}</Button></div></div>
    </form>}
  </div>;
}
