"use client";
import {useId,useRef,useState} from 'react';
import Link from 'next/link';
import {FileSpreadsheet,LoaderCircle} from 'lucide-react';
import {PageHeader} from '@/components/page-header';
import {Button} from '@/components/ui/button';
import {SelectField,StatusBadge} from '@/components/ui-patterns';
import {datasets,datasetFields,requiredFields,transferFields,suggestedMapping,defaultSheets,type TransferDataset,type Mapping,type TransferRow} from '@/lib/data-transfer';
import {BatchHistory} from './validation-workspace';
type Preview={sheets:string[];sheet?:string;columns?:string[];rows?:{rowNumber:number;data:TransferRow}[];total?:number;sql:boolean};

function formatPreviewValue(value: unknown) {
  if (value === null || value === '') return 'Kosong';

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (Number.isInteger(value)) return String(value);

    return value.toLocaleString('id-ID', {
      useGrouping: false,
      maximumFractionDigits: 2,
    });
  }

  return String(value);
}
export default function ImportPage({limits,sql}:{limits:{bytes:number;rows:number};sql:boolean}){
 const [dataset,setDataset]=useState<TransferDataset>('idsd'),[file,setFile]=useState<File|null>(null),[preview,setPreview]=useState<Preview|null>(null),[sheet,setSheet]=useState(''),[mapping,setMapping]=useState<Mapping>({}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[batch,setBatch]=useState<string|null>(null);
 const pending=useRef(false),helpId=useId();
 const [operation,setOperation]=useState<'preview'|'stage'>('preview');
 async function upload(selected:File,selectedSheet?:string,stage=false){
  if(pending.current)return;
  pending.current=true;setOperation(stage?'stage':'preview');
  setBusy(true);setError('');
  try{
   const query=new URLSearchParams({dataset,...(selectedSheet?{sheet:selectedSheet}:{}),...(stage?{stage:'true'}:{})});
   const response=await fetch(`/api/admin/imports/upload/?${query}`,{method:'POST',headers:{'Content-Type':'application/octet-stream','X-File-Name':encodeURIComponent(selected.name),'X-Column-Mapping':JSON.stringify(mapping)},body:selected});
   const result=await response.json();if(!response.ok)throw new Error(result.error||'Berkas tidak dapat diproses.');
   if(stage){setBatch(result.id);setFile(null);setPreview(null);}
   else{setPreview(result);setSheet(result.sheet||'');setMapping(result.columns?suggestedMapping(result.columns,dataset):{});}
  }catch(e){setError(e instanceof Error?e.message:'Koneksi terputus. Coba kembali.');}finally{pending.current=false;setBusy(false);}
 }
 return <div className="data-page workflow-page"><PageHeader title="Import Data" parent="Pengelolaan Data" description="Unggah spreadsheet, petakan kolom, lalu kirim baris untuk pemeriksaan sebelum disimpan sebagai data analitis."/>
  <ol className="workflow-steps" aria-label="Tahapan import">{['Pilih berkas','Preview & pemetaan','Tinjauan tersimpan','Persetujuan & penyimpanan'].map((label,i)=><li key={label} aria-current={(batch?2:preview?.rows?1:0)===i?'step':undefined}><span>{i+1}</span>{label}</li>)}</ol>
  {batch?<section className="data-panel workflow-result" role="status"><StatusBadge tone="success">Tersimpan untuk ditinjau</StatusBadge><h2>Batch import berhasil dibuat</h2><p>Baris sumber, hasil pemeriksaan, dan pemetaan tersimpan di database. Data analitis belum berubah sampai batch disetujui.</p><div className="workflow-actions"><Button asChild><Link href={`/admin/validation/?batch=${batch}`}>Buka Validasi Data</Link></Button><Button variant="outline" onClick={()=>setBatch(null)}>Import berkas lain</Button></div></section>:<section className="data-panel workflow-setup" aria-busy={busy}><div className="data-panel-heading"><div><h2>Konfigurasi import</h2><p>Nilai dan kode diambil dari file yang Anda unggah.</p></div><StatusBadge>Spreadsheet{sql?' / SQL PRPDN':''}</StatusBadge></div><div className="workflow-setup-body">
   <div className="workflow-config"><SelectField label="Dataset tujuan" value={dataset} disabled={busy} onValueChange={v=>{setDataset(v as TransferDataset);setMapping(suggestedMapping(preview?.columns??[],v as TransferDataset));}} options={Object.entries(datasets).map(([value,label])=>({value,label}))}/>{preview&&!preview.sql&&<SelectField label="Sheet sumber" value={sheet||'none'} disabled={busy} onValueChange={v=>{if(file)void upload(file,v);}} options={[{value:'none',label:'Pilih sheet'},...preview.sheets.map(value=>({value,label:value===defaultSheets[dataset]?`${value} · sesuai dataset`:value}))]}/>}</div>
   <div className="workflow-upload" data-selected={!!file}><FileSpreadsheet aria-hidden="true"/><div><h3>{file?.name||'Pilih berkas spreadsheet'}</h3><p id={helpId}>.xlsx, .xls, .csv{sql?', atau .sql format PRPDN (Super Admin)':''}. Batas server saat ini {(limits.bytes/1048576).toLocaleString('id-ID')} MB dan {limits.rows.toLocaleString('id-ID')} baris per sheet. File sumber tidak diubah.</p><div className="workflow-actions"><label className="workflow-file-button" aria-disabled={busy}>{file?'Ganti berkas':'Pilih berkas'}<input type="file" aria-label="Pilih berkas import" aria-describedby={helpId} accept={sql?'.xlsx,.xls,.csv,.sql':'.xlsx,.xls,.csv'} disabled={busy} onChange={e=>{const selected=e.target.files?.[0];e.target.value='';if(selected){setFile(selected);setPreview(null);setSheet('');setMapping({});void upload(selected);}}}/></label>{file&&<div className="workflow-file-status"><span>{file.size<1024?`${file.size} B`:`${(file.size/1024).toLocaleString('id-ID',{maximumFractionDigits:1})} KB`}</span><StatusBadge tone={error?'error':busy?'neutral':preview?.rows?'success':'neutral'}>{error?'Perlu diperiksa':busy?'Sedang diproses':preview?.rows?'Preview tersedia':'Berkas dipilih'}</StatusBadge></div>}</div></div></div>
   <p className="muted-note">Gunakan kode wilayah dari master. Kode yang tidak dikenal, konflik data, dan nilai kosong akan ditandai untuk tinjauan. SQL hanya menerima format ekspor PRPDN; tidak ada eksekusi SQL bebas.</p>
  </div></section>}
  {busy&&<div role="status" className="workflow-processing"><LoaderCircle size={20} className="animate-spin" aria-hidden="true"/><div><strong>{operation==='stage'?'Menyimpan batch untuk tinjauan…':'Membaca berkas dan menyiapkan preview…'}</strong><p>Tunggu hingga proses selesai sebelum mengirim kembali.</p></div></div>}{error&&<div className="workflow-error" role="alert"><strong>Import belum dapat diproses</strong><p>{error}</p><small>Periksa pesan di atas sebelum mencoba kembali. Data analitis baru disimpan setelah persetujuan batch.</small></div>}
  {preview?.rows&&file&&<section className="data-panel"><div className="data-panel-heading"><div><h2>Preview & pemetaan kolom</h2><p>{preview.sheet} · hingga {preview.total?.toLocaleString('id-ID')} baris sumber · menampilkan {preview.rows.length} baris pertama</p></div></div>
   {!preview.sql&&<div className="workflow-mapping">{datasetFields(dataset).map(field=><SelectField key={field} label={`${transferFields[field]}${requiredFields(dataset).includes(field)?' *':''}`} value={mapping[field]||'none'} disabled={busy} onValueChange={v=>setMapping({...mapping,[field]:v==='none'?'':v})} options={[{value:'none',label:'Tidak dipetakan'},...(preview.columns??[]).map(value=>({value,label:value}))]}/>)}<p className="muted-note">{requiredFields(dataset).filter(field=>mapping[field]).length} dari {requiredFields(dataset).length} kolom wajib dipetakan. Nilai sel kosong dipertahankan; angka 0 tidak diubah. Desimal memakai titik atau koma tanpa pemisah ribuan.</p></div>}
   <div className="table-scroll" tabIndex={0} role="region" aria-label="Preview isi file"><table className="data-table workflow-preview"><thead><tr><th scope="col">Baris</th>{(preview.columns??[]).map(c=><th scope="col" key={c}>{c}</th>)}</tr></thead><tbody>{preview.rows.map(row=><tr key={row.rowNumber}><td>{row.rowNumber}</td>{(preview.columns??[]).map(c=><td key={c}>{formatPreviewValue(row.data[c])}</td>)}</tr>)}</tbody></table></div><div className="workflow-setup-body"><p className="muted-note">Langkah berikutnya membuat batch untuk ditinjau; belum menambahkan observasi ke data analitis.</p><Button disabled={busy} onClick={()=>void upload(file,sheet,true)}>{busy?'Sedang memproses…':'Validasi & simpan untuk tinjauan'}</Button></div>
  </section>}
  <BatchHistory key={batch||'history'} workspace="import"/>
 </div>;
}
