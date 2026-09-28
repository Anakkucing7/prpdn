"use client";
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { SelectField, StatusBadge } from '@/components/ui-patterns';
import { demoActivities, demoUsers } from '@/data/system-demo';
import { matchesQuery } from '@/lib/regions';
import { DataFilters, NoResults, Pagination } from './data-controls';
import { MasterField } from './master-shared';
import { SystemNotice, SystemDetail } from './system-shared';

const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' });
const actorName = (id:string) => demoUsers.find(user => user.id === id)?.name ?? id;
const options = (values:string[]) => [{value:'all',label:'Semua'}, ...Array.from(new Set(values)).sort().map(value => ({value,label:value}))];

export default function ActivityPage() {
  const [query,setQuery]=useState(''); const [module,setModule]=useState('all'); const [action,setAction]=useState('all'); const [actor,setActor]=useState('all');
  const [start,setStart]=useState(''); const [end,setEnd]=useState(''); const [sort,setSort]=useState('newest'); const [page,setPage]=useState(1);
  const invalidRange=!!(start&&end&&start>end);
  const rows=demoActivities.filter(row => !invalidRange && matchesQuery(query,actorName(row.actor),row.action,row.module,row.entity,row.description) && (module==='all'||row.module===module) && (action==='all'||row.action===action) && (actor==='all'||row.actor===actor) && (!start||row.timestamp.slice(0,10)>=start) && (!end||row.timestamp.slice(0,10)<=end)).sort((a,b)=>(Date.parse(a.timestamp)-Date.parse(b.timestamp))*(sort==='newest'?-1:1));
  const currentPage=Math.min(page,Math.max(1,Math.ceil(rows.length/8)));
  function reset(){setQuery('');setModule('all');setAction('all');setActor('all');setStart('');setEnd('');setSort('newest');setPage(1);}
  return <div className="data-page system-page"><PageHeader title="Log Aktivitas" parent="Sistem" description="Telusuri contoh jejak tindakan dan hasil pemeriksaan administratif."/><SystemNotice/>
    <DataFilters query={query} onQuery={v=>{setQuery(v);setPage(1);}} onReset={reset} summary={`${rows.length} aktivitas contoh sesuai filter · waktu WIB`} searchLabel="Cari aktivitas" searchPlaceholder="Pengguna, tindakan, modul, atau objek">
      <SelectField label="Modul" value={module} onValueChange={v=>{setModule(v);setPage(1);}} options={options(demoActivities.map(r=>r.module))}/>
      <SelectField label="Tindakan" value={action} onValueChange={v=>{setAction(v);setPage(1);}} options={options(demoActivities.map(r=>r.action))}/>
      <SelectField label="Pengguna" value={actor} onValueChange={v=>{setActor(v);setPage(1);}} options={[{value:'all',label:'Semua pengguna'},...demoUsers.map(u=>({value:u.id,label:u.name}))]}/>
      <MasterField label="Dari tanggal (WIB)" type="date" value={start} max={end||undefined} onChange={e=>{setStart(e.target.value);setPage(1);}}/>
      <MasterField label="Sampai tanggal (WIB)" type="date" value={end} min={start||undefined} error={invalidRange?'Tanggal akhir harus sama atau setelah tanggal awal.':undefined} onChange={e=>{setEnd(e.target.value);setPage(1);}}/>
    </DataFilters>
    <section className="data-panel"><div className="data-panel-heading"><div><h2>Aktivitas contoh</h2><p>Skenario tetap; tidak merekam interaksi Anda pada prototipe ini.</p></div><div className="data-sort-field"><SelectField label="Urutkan waktu" value={sort} onValueChange={v=>{setSort(v);setPage(1);}} options={[{value:'newest',label:'Terbaru dahulu'},{value:'oldest',label:'Terlama dahulu'}]}/></div></div>
      {rows.length?<div className="table-scroll" role="region" tabIndex={0} aria-label="Tabel aktivitas, dapat digulir horizontal"><table className="data-table system-log-table"><thead><tr>{['Waktu (WIB)','Pengguna','Tindakan / modul','Hasil','Detail'].map(label=><th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{rows.slice((currentPage-1)*8,currentPage*8).map(row=><tr key={row.id}><td>{dateFormat.format(new Date(row.timestamp))}</td><td>{actorName(row.actor)}</td><td><strong className="table-primary">{row.action}</strong><span className="table-secondary">{row.module}</span></td><td><StatusBadge tone={row.result==='Berhasil'?'success':row.result==='Gagal'?'error':'warning'}>{row.result}</StatusBadge></td><td><SystemDetail title={row.action} description={`${row.module} · aktivitas contoh`} label={`Detail aktivitas ${row.id}`}><StatusBadge>Contoh demo</StatusBadge><dl className="facts">{Object.entries({ID:row.id,Pengguna:actorName(row.actor),Waktu:`${dateFormat.format(new Date(row.timestamp))} WIB`,Modul:row.module,Objek:row.entity,Hasil:row.result,Sebelum:row.before,Sesudah:row.after}).map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><p>{row.description}</p><p className="muted-note">IP dan user agent tidak disediakan. Log produksi akan berasal dari backend dan dikaitkan dengan aktor, transaksi, serta waktu sebenarnya.</p></SystemDetail></td></tr>)}</tbody></table></div>:<NoResults onReset={reset}/>}
      <Pagination page={currentPage} total={rows.length} size={8} onPage={setPage}/></section>
  </div>;
}
