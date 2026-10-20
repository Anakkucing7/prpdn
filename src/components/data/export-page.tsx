"use client";

import {useState} from 'react';
import Link from 'next/link';
import {PageHeader} from '@/components/page-header';
import {SelectField} from '@/components/ui-patterns';
import {Button} from '@/components/ui/button';
import {datasets,type TransferDataset} from '@/lib/data-transfer';
import {ExportControl} from './export-control';

export default function ExportPage(){
 const [dataset,setDataset]=useState<TransferDataset>('idsd');
 return <div className="data-page workflow-page">
  <PageHeader title="Ekspor Data" parent="Pengelolaan Data" description="Unduh data analitis dalam format XLSX, CSV, PDF, atau SQL PRPDN sesuai hak akses akun."/>
  <section className="data-panel">
   <div className="data-panel-heading"><div><h2>Pilih data untuk diekspor</h2><p>Ekspor dari halaman ini mencakup seluruh tahun dan wilayah pada dataset terpilih.</p></div></div>
   <div className="workflow-setup-body">
    <SelectField label="Dataset" value={dataset} onValueChange={value=>setDataset(value as TransferDataset)} options={Object.entries(datasets).map(([value,label])=>({value,label}))}/>
    <p className="muted-note">PDF maksimal 2.000 baris; format lainnya maksimal 100.000 baris. SQL khusus Super Admin. Untuk memilih tahun atau wilayah tertentu, buka halaman data dan gunakan tombol ekspor di sana.</p>
    <div className="workflow-actions"><ExportControl key={dataset} dataset={dataset} filters={{}}/><Button variant="outline" asChild><Link href={`/admin/${dataset==='idsd-pillar'?'idsd':dataset}/`}>Buka data & filter</Link></Button></div>
   </div>
  </section>
 </div>;
}
