"use client";
import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { SelectField, StatusBadge } from '@/components/ui-patterns';
import { demoUsers, roles, type DemoUser } from '@/data/system-demo';
import { validateUser, type UserDraft } from '@/lib/system-validation';
import { matchesQuery } from '@/lib/regions';
import { MasterField, MasterForm, focusInvalid } from './master-shared';
import { DataFilters, NoResults, Pagination } from './data-controls';
import { SystemNotice, SystemDialog, SystemConfirm, SystemDetail } from './system-shared';

function UserForm({record,records,onSave,onCancel}:{record:DemoUser|null;records:DemoUser[];onSave:(draft:UserDraft)=>void;onCancel:()=>void}) {
  const [draft,setDraft]=useState<UserDraft>(record ?? {name:'',username:'',email:'',workUnit:'',role:'Internal Viewer'});
  const [errors,setErrors]=useState<Partial<Record<keyof UserDraft,string>>>({});
  return <MasterForm onCancel={onCancel} onSubmit={event=>{event.preventDefault();const next=validateUser(draft,records.filter(r=>r.id!==record?.id));setErrors(next);const first=Object.keys(next)[0];if(first){focusInvalid(event.currentTarget,first);return;}onSave(draft);}}>
    <MasterField name="name" label="Nama" required maxLength={100} value={draft.name} error={errors.name} onChange={e=>setDraft({...draft,name:e.target.value})}/>
    <MasterField name="username" label="Username" required maxLength={40} value={draft.username} error={errors.username} onChange={e=>setDraft({...draft,username:e.target.value})}/>
    <MasterField name="email" label="Email contoh" type="email" required maxLength={254} placeholder="nama@example.com" value={draft.email} error={errors.email} onChange={e=>setDraft({...draft,email:e.target.value})}/>
    <MasterField name="workUnit" label="Unit kerja (opsional)" maxLength={120} value={draft.workUnit} onChange={e=>setDraft({...draft,workUnit:e.target.value})}/>
    <SelectField label="Role *" value={draft.role} onValueChange={role=>setDraft({...draft,role:role as UserDraft['role']})} options={roles.map(role=>({value:role,label:role}))}/>
    <p className="muted-note">Gunakan identitas contoh. Status pengguna baru: Aktif sementara. Tidak ada undangan, email, atau kredensial yang dikirim.</p>
  </MasterForm>;
}

export default function UsersPage() {
  const [records,setRecords]=useState(demoUsers);const [query,setQuery]=useState('');const [role,setRole]=useState('all');const [status,setStatus]=useState('all');const [sort,setSort]=useState('name');const [page,setPage]=useState(1);
  const [editing,setEditing]=useState<DemoUser|null|undefined>();const [opener,setOpener]=useState<HTMLElement|null>(null);const [draft,setDraft]=useState<UserDraft|null>(null);const [changing,setChanging]=useState<DemoUser|null>(null);const [message,setMessage]=useState('');const serial=useRef(0);
  const rows=records.filter(r=>matchesQuery(query,r.name,r.username,r.email,r.workUnit)&&(role==='all'||r.role===role)&&(status==='all'||r.status===status)).sort((a,b)=>sort==='role'?a.role.localeCompare(b.role)||a.name.localeCompare(b.name):a.name.localeCompare(b.name,'id')*(sort==='desc'?-1:1));
  const currentPage=Math.min(page,Math.max(1,Math.ceil(rows.length/5)));
  function reset(){setQuery('');setRole('all');setStatus('all');setSort('name');setPage(1);}
  function save(){if(!draft)return;const record:DemoUser={...draft,name:draft.name.trim(),username:draft.username.trim(),email:draft.email.trim(),workUnit:draft.workUnit.trim(),id:editing?.id??`local-${++serial.current}`,status:editing?.status??'Aktif',origin:editing?'Diubah lokal':'Ditambahkan lokal'};setRecords(editing?records.map(r=>r.id===editing.id?record:r):[...records,record]);setMessage(`${record.name} ${editing?'diubah':'ditambahkan'} sementara. Tidak tersimpan ke server.`);setDraft(null);setEditing(undefined);reset();}
  return <div className="data-page master-page system-page"><PageHeader title="Manajemen Pengguna" parent="Sistem" description="Kelola identitas contoh, role, dan status pengguna dalam prototipe." actions={<Button onClick={e=>{setOpener(e.currentTarget);setEditing(null);}}><Plus/>Tambah pengguna</Button>}/><SystemNotice/>
    <DataFilters query={query} onQuery={value=>{setQuery(value);setPage(1);}} onReset={reset} summary={`${rows.length} pengguna contoh sesuai filter`} searchLabel="Cari pengguna" searchPlaceholder="Nama, username, email, atau unit kerja">
      <SelectField label="Role" value={role} onValueChange={value=>{setRole(value);setPage(1);}} options={[{value:'all',label:'Semua role'},...roles.map(r=>({value:r,label:r}))]}/>
      <SelectField label="Status" value={status} onValueChange={value=>{setStatus(value);setPage(1);}} options={[{value:'all',label:'Semua status'},{value:'Aktif',label:'Aktif'},{value:'Nonaktif',label:'Nonaktif'}]}/>
    </DataFilters><p className="master-feedback" role="status">{message}</p>
    <section className="data-panel"><div className="data-panel-heading"><div><h2>Daftar pengguna</h2><p>{records.length} identitas contoh · bukan akun produksi</p></div><div className="data-sort-field"><SelectField label="Urutkan" value={sort} onValueChange={v=>{setSort(v);setPage(1);}} options={[{value:'name',label:'Nama A–Z'},{value:'desc',label:'Nama Z–A'},{value:'role',label:'Role'}]}/></div></div>
      {rows.length?<div className="table-scroll" role="region" tabIndex={0} aria-label="Tabel pengguna, dapat digulir horizontal"><table className="data-table system-user-table"><thead><tr><th scope="col">Pengguna</th><th scope="col">Role / unit kerja</th><th scope="col">Status</th><th scope="col">Asal data</th><th scope="col">Tindakan</th></tr></thead><tbody>{rows.slice((currentPage-1)*5,currentPage*5).map(r=><tr key={r.id}><td><strong className="table-primary">{r.name}</strong><span className="table-secondary">{r.username}</span><span className="table-secondary">{r.email}</span></td><td>{r.role}<span className="table-secondary">{r.workUnit||'Unit kerja belum diisi'}</span></td><td><StatusBadge tone={r.status==='Aktif'?'success':'neutral'}>{r.status}</StatusBadge></td><td><StatusBadge>{r.origin}</StatusBadge></td><td><div className="master-row-actions"><SystemDetail title={r.name} description="Profil pengguna" label={`Detail pengguna ${r.name}`}><StatusBadge>{r.origin}</StatusBadge><dl className="facts">{Object.entries({Username:r.username,Email:r.email,Role:r.role,Status:r.status,'Unit kerja':r.workUnit||'Belum diisi',NIP:'Tidak disediakan','Login terakhir':'Tidak tersedia; tidak ada autentikasi nyata'}).map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><section><h3 className="subheading">Reset kata sandi</h3><p className="muted-note">Belum tersedia. Reset aman, verifikasi identitas, sesi, dan pengiriman tautan harus ditangani layanan autentikasi/backend mendatang. Prototipe tidak menyimpan kata sandi.</p></section></SystemDetail><Button variant="link" aria-label={`Ubah pengguna ${r.name}`} onClick={e=>{setOpener(e.currentTarget);setEditing(r);}}>Ubah</Button><Button variant="link" aria-label={`${r.status==='Aktif'?'Nonaktifkan':'Aktifkan'} ${r.name}`} onClick={e=>{setOpener(e.currentTarget);setChanging(r);}}>{r.status==='Aktif'?'Nonaktifkan':'Aktifkan'}</Button></div></td></tr>)}</tbody></table></div>:<NoResults onReset={reset}/>}
      <Pagination page={currentPage} total={rows.length} size={5} onPage={setPage}/></section>
    {editing!==undefined&&<SystemDialog title={editing?'Ubah pengguna':'Tambah pengguna'} opener={opener} onClose={()=>setEditing(undefined)}><UserForm record={editing} records={records} onSave={setDraft} onCancel={()=>setEditing(undefined)}/></SystemDialog>}
    {draft&&<SystemConfirm title={editing?'Konfirmasi perubahan pengguna?':'Tambahkan pengguna?'} description={`${draft.name} akan memakai role ${draft.role}. Tidak memberi akses nyata.`} onCancel={()=>setDraft(null)} onConfirm={save}/>}
    {changing&&<SystemConfirm title={`${changing.status==='Aktif'?'Nonaktifkan':'Aktifkan'} ${changing.name}?`} description="Status tabel akan berubah. Tidak memutus atau membuka sesi nyata." onCancel={()=>{setChanging(null);opener?.focus();}} onConfirm={()=>{setRecords(records.map(r=>r.id===changing.id?{...r,status:r.status==='Aktif'?'Nonaktif':'Aktif',origin:'Diubah lokal'}:r));setMessage(`Status ${changing.name} diubah sementara.`);setChanging(null);opener?.focus();}}/>}
  </div>;
}
