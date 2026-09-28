"use client";
import {PageHeader} from '@/components/page-header';
import {BatchHistory,ValidationWorkspace} from './validation-workspace';
export default function ValidationPage({batchId,review,approve}:{batchId?:string;review:boolean;approve:boolean}){
 return <div className="data-page workflow-page"><PageHeader title="Validasi Data" parent="Pengelolaan Data" description="Tinjau baris sumber, koreksi temuan, dan setujui batch sebelum data masuk ke tabel analitis."/>{batchId?<ValidationWorkspace id={batchId} review={review} approve={approve}/>:<BatchHistory workspace="validation"/>}</div>;
}
