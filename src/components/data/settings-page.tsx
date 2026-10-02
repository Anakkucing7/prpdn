"use client";
import { useState, useRef } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui-patterns';
import { provinceOptions } from '@/lib/regions';
import { validateSettings, type SettingsDraft } from '@/lib/system-validation';
import { MasterField, focusInvalid } from './master-shared';
import { SystemNotice, SystemConfirm } from './system-shared';

const initial:SettingsDraft={name:'PRPDN',description:'Data pembangunan daerah',year:'2024',province:'all',pageSize:'15'};
export default function SettingsPage(){
  const [saved,setSaved]=useState(initial);const [draft,setDraft]=useState(initial);const [errors,setErrors]=useState<Partial<Record<keyof SettingsDraft,string>>>({});const [confirm,setConfirm]=useState(false);const [message,setMessage]=useState('');const saveButton=useRef<HTMLButtonElement>(null);
  const changed=Object.keys(initial).some(key=>draft[key as keyof SettingsDraft]!==saved[key as keyof SettingsDraft]);
  function cancel(){setDraft(saved);setErrors({});setMessage('Perubahan formulir dibatalkan.');}
  return <div className="data-page system-page"><PageHeader title="Pengaturan" parent="Sistem" description="Rancangan identitas aplikasi dan preferensi awal analisis."/><SystemNotice/>
    <form noValidate className="system-settings" onSubmit={event=>{event.preventDefault();const next=validateSettings(draft);setErrors(next);const first=Object.keys(next)[0];if(first){focusInvalid(event.currentTarget,first);return;}setConfirm(true);}}>
      <section className="data-panel"><div className="data-panel-heading"><div><h2>Identitas aplikasi</h2><p>Pratinjau konfigurasi yang kelak disimpan melalui backend.</p></div></div><div className="system-settings-fields">
        <MasterField name="name" label="Nama aplikasi" required maxLength={80} value={draft.name} error={errors.name} onChange={e=>setDraft({...draft,name:e.target.value})}/>
        <MasterField name="description" label="Deskripsi singkat" required maxLength={200} value={draft.description} error={errors.description} onChange={e=>setDraft({...draft,description:e.target.value})}/>
      </div></section>
      <section className="data-panel"><div className="data-panel-heading"><div><h2>Preferensi analisis</h2><p>Nilai awal yang diusulkan; ketersediaan periode tetap mengikuti setiap dataset.</p></div></div><div className="system-settings-fields system-settings-grid">
        <SelectField label="Tahun awal analisis" value={draft.year} onValueChange={year=>setDraft({...draft,year})} options={['2024','2023','2022'].map(value=>({value,label:value}))}/>
        <SelectField label="Provinsi awal" value={draft.province} onValueChange={province=>setDraft({...draft,province})} options={provinceOptions}/>
        <SelectField label="Jumlah baris tabel" value={draft.pageSize} onValueChange={pageSize=>setDraft({...draft,pageSize})} options={['10','15','25'].map(value=>({value,label:`${value} baris`}))}/>
      </div><p className="system-context">Preferensi tersimpan hanya di halaman ini. Tidak mengubah portal publik, tabel, atau filter halaman lain. Tahun pilihan mengikuti rentang data IDSD pada dashboard saat ini.</p></section>
      <div className="system-settings-footer"><p role="status">{message|| (changed?'Ada perubahan yang belum disimpan.':'Belum ada perubahan pada formulir.')}</p><div className="system-actions"><Button type="button" variant="outline" disabled={!changed} onClick={cancel}>Batal</Button><Button ref={saveButton} type="submit" disabled={!changed}>Simpan sementara</Button></div></div>
    </form>
    <p className="data-source">Konfigurasi produksi akan disimpan melalui API dengan validasi dan otorisasi server. Batas upload ditentukan backend; kredensial, API key, dan konfigurasi infrastruktur tidak dikelola pada halaman ini.</p>
    {confirm&&<SystemConfirm title="Simpan sementara?" description="Nilai formulir menjadi rancangan tersimpan pada halaman ini. Layanan publik tidak berubah." onCancel={()=>{setConfirm(false);saveButton.current?.focus();}} onConfirm={()=>{setSaved({...draft,name:draft.name.trim(),description:draft.description.trim()});setDraft({...draft,name:draft.name.trim(),description:draft.description.trim()});setConfirm(false);setMessage('Pengaturan disimpan secara lokal. Memuat ulang akan mengembalikan nilai awal.');}}/>}
  </div>;
}
