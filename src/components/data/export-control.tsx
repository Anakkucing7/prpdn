"use client";
import {useRef,useState} from 'react';
import {Download,LoaderCircle} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {SelectField} from '@/components/ui-patterns';
import {Dialog,DialogTrigger,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from '@/components/ui/dialog';
import {datasets,type TransferDataset} from '@/lib/data-transfer';
import './workflow-pages.css';

const formatNotes:Record<string,string>={xlsx:'Spreadsheet untuk pengolahan dan pemeriksaan lanjutan.',csv:'Tabel teks untuk pertukaran data antarperangkat lunak.',pdf:'Dokumen untuk membaca dan membagikan tabel.',sql:'Data analitis format PRPDN. Akses diperiksa oleh server.'};
const scopeLabels:Record<string,string>={year:'Tahun',level:'Level wilayah',province:'Kode provinsi',region:'Kode kabupaten/kota',indicator:'Indikator',category:'Kategori',quality:'Kualitas sumber',q:'Pencarian',sheet:'Sheet',sort:'Urutan',period:'Periode'};

export function ExportControl({dataset,filters}:{dataset:TransferDataset;filters:Record<string,string>}){
 const [format,setFormat]=useState('xlsx'),[target,setTarget]=useState<TransferDataset>(dataset),[error,setError]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[open,setOpen]=useState(false);
 const pending=useRef(false);
 async function download(){
  if(pending.current)return;
  pending.current=true;setBusy(true);setError('');setMessage('');
  try{const response=await fetch(`/api/admin/export/?${new URLSearchParams({...filters,dataset:target,format})}`,{cache:'no-store'});if(!response.ok){const result=await response.json();throw new Error(result.error||'Ekspor gagal.');}const url=URL.createObjectURL(await response.blob());const anchor=document.createElement('a');anchor.href=url;anchor.download=response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1]||`prpdn-${dataset}.${format}`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),30000);setMessage('File siap. Permintaan unduhan telah dikirim ke browser.');}catch(e){setError(e instanceof Error?e.message:'Ekspor gagal.');}finally{pending.current=false;setBusy(false);}
 }
 const scope=Object.entries(filters).filter(([key,value])=>key!=='sort'&&value!==''&&value!=='all');
 return <Dialog open={open} onOpenChange={value=>{if(!pending.current){setOpen(value);if(value){setError('');setMessage('');}}}}>
  <DialogTrigger asChild><Button variant="outline"><Download/>Ekspor data</Button></DialogTrigger>
  <DialogContent className="workflow-export-dialog" showCloseButton={!busy} onEscapeKeyDown={event=>{if(busy)event.preventDefault();}} onPointerDownOutside={event=>{if(busy)event.preventDefault();}}>
   <DialogHeader><DialogTitle>Ekspor {datasets[dataset]}</DialogTitle><DialogDescription>Seluruh baris yang sesuai filter diekspor, bukan hanya halaman tabel yang terlihat.</DialogDescription></DialogHeader>
   <section className="workflow-export-scope" aria-label="Cakupan ekspor"><h3>Cakupan data</h3><p>{datasets[target]}</p>{scope.length?<dl>{scope.map(([key,value])=><div key={key}><dt>{scopeLabels[key]||key}</dt><dd>{value==='missing'?'Belum terisi':value==='PROV'?'Provinsi':value==='KABKOTA'?'Kabupaten/Kota':value}</dd></div>)}</dl>:<p>Semua data pada dataset ini.</p>}</section>
   {dataset==="idsd"&&<SelectField label="Isi ekspor" value={target} disabled={busy} onValueChange={v=>{setTarget(v as TransferDataset);setMessage('');setError('');}} options={[{value:"idsd",label:"Skor total IDSD"},{value:"idsd-pillar",label:"Skor 12 pilar IDSD"}]}/>}
   <SelectField label="Format file" value={format} disabled={busy} onValueChange={value=>{setFormat(value);setMessage('');setError('');}} options={['xlsx','csv','pdf','sql'].map(value=>({value,label:value==='sql'?'SQL PRPDN · khusus Super Admin':value.toUpperCase()}))}/>
   <p className="workflow-export-note">{formatNotes[format]} Maksimal {format==='pdf'?'2.000':'100.000'} baris per permintaan.{format==='sql'&&' Tidak berisi akun, sesi, atau kredensial.'}</p>
   {error&&<div role="alert" className="workflow-error"><strong>Ekspor belum berhasil</strong><p>{error}</p></div>}
   <p role="status" className="workflow-export-feedback">{busy?'Menyiapkan file. Tunggu hingga proses selesai…':message}</p>
   <DialogFooter><Button variant="outline" disabled={busy} onClick={()=>setOpen(false)}>Tutup</Button><Button disabled={busy} onClick={()=>void download()}>{busy?<LoaderCircle className="animate-spin" aria-hidden="true"/>:<Download aria-hidden="true"/>}{busy?'Menyiapkan file…':`Unduh ${format.toUpperCase()}`}</Button></DialogFooter>
  </DialogContent>
 </Dialog>;
}
