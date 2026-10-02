"use client";
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { SelectField, StatusBadge } from '@/components/ui-patterns';
import { DataFilters, NoResults, Pagination } from './data-controls';
import { SystemDetail } from './system-shared';
import { MasterField } from './master-shared';
import { api, RequestError } from '@/lib/api-client';

type ActivityRow={id:string;actorId:string|null;actorName:string;action:string;module:string;entity:string;result:string;before:unknown;after:unknown;createdAt:string};
type ActivityResponse={rows:ActivityRow[];total:number;page:number;size:number;restricted:boolean};
const dateFormat=new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Jakarta'});
const options=(values:string[])=>[{value:'all',label:'Semua'},...Array.from(new Set(values)).sort().map(value=>({value,label:value}))];
const serialize=(value:unknown)=>value==null?'—':typeof value==='string'?value:JSON.stringify(value,null,2);

export default function ActivityPage(){
  const [query,setQuery]=useState('');const [module,setModule]=useState('all');const [action,setAction]=useState('all');const [actor,setActor]=useState('all');
  const [start,setStart]=useState('');const [end,setEnd]=useState('');const [sort,setSort]=useState('newest');const [page,setPage]=useState(1);
  const [data,setData]=useState<ActivityResponse|null>(null);const [error,setError]=useState('');const [loading,setLoading]=useState(true);
  const invalidRange=!!(start&&end&&start>end);
  useEffect(()=>{
    let current=true;
    if(invalidRange)return;
    const params=new URLSearchParams({page:String(page),sort});
    if(query.trim())params.set('q',query.trim());if(module!=='all')params.set('module',module);if(action!=='all')params.set('action',action);if(actor!=='all')params.set('actor',actor);if(start)params.set('start',start);if(end)params.set('end',end);
    api<ActivityResponse>(`/api/admin/activity/?${params}`).then(result=>{if(current)setData(result);}).catch(cause=>{if(current)setError(cause instanceof RequestError?cause.message:'Log aktivitas belum dapat dimuat.');}).finally(()=>{if(current)setLoading(false);});
    return()=>{current=false;};
  },[query,module,action,actor,start,end,sort,page,invalidRange]);
  function reset(){setQuery('');setModule('all');setAction('all');setActor('all');setStart('');setEnd('');setSort('newest');setPage(1);}
  const rows=invalidRange?[]:data?.rows??[];
  return <div className="data-page system-page"><PageHeader title="Log Aktivitas" parent="Sistem" description="Telusuri tindakan dan perubahan yang tercatat oleh layanan PRPDN."/>
    <DataFilters query={query} onQuery={value=>{setQuery(value);setPage(1);}} onReset={reset} summary={`${data?.total??0} aktivitas · waktu WIB`} searchLabel="Cari aktivitas" searchPlaceholder="Pengguna, tindakan, modul, atau objek">
      <SelectField label="Modul" value={module} onValueChange={value=>{setModule(value);setPage(1);}} options={options(rows.map(row=>row.module))}/>
      <SelectField label="Tindakan" value={action} onValueChange={value=>{setAction(value);setPage(1);}} options={options(rows.map(row=>row.action))}/>
      <SelectField label="Pengguna" value={actor} onValueChange={value=>{setActor(value);setPage(1);}} options={[{value:'all',label:'Semua pengguna'},...Array.from(new Map(rows.filter(row=>row.actorId).map(row=>[row.actorId!,row.actorName])).entries()).map(([value,label])=>({value,label}))]}/>
      <MasterField label="Dari tanggal (WIB)" type="date" value={start} max={end||undefined} onChange={event=>{setStart(event.target.value);setPage(1);}}/>
      <MasterField label="Sampai tanggal (WIB)" type="date" value={end} min={start||undefined} error={invalidRange?'Tanggal akhir harus sama atau setelah tanggal awal.':undefined} onChange={event=>{setEnd(event.target.value);setPage(1);}}/>
    </DataFilters>
    {error&&<p className="auth-form-error" role="alert">{error}</p>}
    <section className="data-panel"><div className="data-panel-heading"><div><h2>Aktivitas tercatat</h2><p>Jejak audit tersedia bagi Admin dan Super Admin untuk akuntabilitas perubahan.</p></div><div className="data-sort-field"><SelectField label="Urutkan waktu" value={sort} onValueChange={value=>{setSort(value);setPage(1);}} options={[{value:'newest',label:'Terbaru dahulu'},{value:'oldest',label:'Terlama dahulu'}]}/></div></div>
      {loading?<div className="data-loading" role="status">Memuat log aktivitas…</div>:rows.length?<div className="table-scroll" role="region" tabIndex={0} aria-label="Log aktivitas, dapat digulir horizontal"><table className="data-table system-log-table"><thead><tr>{['Waktu (WIB)','Pengguna','Tindakan / modul','Hasil','Detail'].map(label=><th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{dateFormat.format(new Date(row.createdAt))}</td><td>{row.actorName}</td><td><strong className="table-primary">{row.action}</strong><span className="table-secondary">{row.module}</span></td><td><StatusBadge tone={row.result==='Berhasil'?'success':row.result==='Gagal'?'error':'neutral'}>{row.result}</StatusBadge></td><td><SystemDetail title={row.action} description={`${row.module} · ${row.actorName}`} label={`Detail aktivitas ${row.id}`}><dl className="facts">{Object.entries({ID:row.id,Pengguna:row.actorName,Waktu:`${dateFormat.format(new Date(row.createdAt))} WIB`,Modul:row.module,Objek:row.entity,Hasil:row.result,Sebelum:serialize(row.before),Sesudah:serialize(row.after)}).map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl></SystemDetail></td></tr>)}</tbody></table></div>:<NoResults onReset={reset}/>}
      {!loading&&<Pagination page={page} total={invalidRange?0:data?.total??0} size={data?.size??15} onPage={setPage}/>}</section>
  </div>;
}
