import 'server-only';
import {z} from 'zod';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import {db} from '../db';
import {HttpError} from '../access';
import {Prisma} from '@/generated/prisma/client';
import {datasets,sqlColumns,sqlHeader,sqlPrefix,type TransferDataset} from '@/lib/data-transfer';
import {datasetPermission,type Actor} from './imports';
import {auditJson} from './masters';

const querySchema=z.object({dataset:z.enum(Object.keys(datasets) as [TransferDataset,...TransferDataset[]]),format:z.enum(['csv','xlsx','pdf','sql']),year:z.string().regex(/^(all|missing|\d{4})$/).default('all'),level:z.enum(['all','PROV','KABKOTA']).default('all'),province:z.string().max(10).default('all'),region:z.string().max(10).default('all'),indicator:z.string().max(191).default('all'),pillar:z.string().regex(/^(all|\d+)$/).default('all'),period:z.string().max(30).default('all'),category:z.string().max(100).default('all'),sheet:z.string().max(80).default('all'),quality:z.enum(['all','notes','missing']).default('all'),q:z.string().max(100).default(''),sort:z.enum(['name','high','low','year']).default('name')}).strict();
const safeCell=(value:unknown)=>typeof value==='string'&&/^[\s]*[=+@-]/.test(value)&&! /^-?\d+(\.\d+)?$/.test(value)?`'${value}`:value;
export async function exportData(query:URLSearchParams,actor:Actor){
 const filters=querySchema.parse(Object.fromEntries(query));datasetPermission(actor,filters.dataset,'view');
 if(actor.roleId==='public-viewer')throw new HttpError(403,'Ekspor administratif tidak tersedia untuk akun publik.');
 if(filters.format==='sql'&&actor.roleId!=='super-admin')throw new HttpError(403,'Ekspor SQL hanya untuk Super Admin.');
 const clauses:Prisma.ObservationWhereInput[]=[{dataset:filters.dataset}];
 if(filters.year!=='all')clauses.push({year:filters.year==='missing'?null:Number(filters.year)});
 if(filters.level!=='all')clauses.push({region:{level:filters.level==='PROV'?'PROV':{not:'PROV'}}});
 if(filters.province!=='all')clauses.push(filters.province==='unmatched'?{regionCode:null}:{region:{provinceCode:filters.province}});
 if(filters.region!=='all')clauses.push({regionCode:filters.region});
 for(const field of ['indicator','category'] as const)if(filters[field]!=='all')clauses.push({[field]:filters[field]==='missing'?null:filters[field]});
 if(filters.period!=='all')clauses.push({period:filters.period});
 if(filters.sheet!=='all')clauses.push({sourceSheet:filters.sheet});
 if(filters.pillar!=='all')clauses.push({pillarId:Number(filters.pillar)});
 if(filters.quality==='missing')clauses.push(filters.dataset==='rpjmd'?{OR:[{value:null},{endValue:null}]}:{value:null});
 if(filters.quality==='notes')clauses.push({NOT:{issues:{equals:[]}}});
 if(filters.q)clauses.push({OR:[{sourceCode:{contains:filters.q}},{sourceName:{contains:filters.q}},{region:{name:{contains:filters.q}}}]});
 const orderBy:Prisma.ObservationOrderByWithRelationInput[]=filters.sort==='high'?[{value:'desc'},{sourceName:'asc'}]:filters.sort==='low'?[{value:'asc'},{sourceName:'asc'}]:filters.sort==='year'?[{year:'desc'},{sourceName:'asc'}]:[{sourceName:'asc'},{year:'asc'}];
 const limit=filters.format==='pdf'?2000:100000;
 const records=await db().observation.findMany({where:{AND:clauses},orderBy,take:limit+1,include:{region:{select:{name:true,level:true,provinceCode:true}},pillar:{select:{name:true}}}});
 if(records.length>limit)throw new HttpError(422,`Ekspor ${filters.format.toUpperCase()} maksimal ${limit.toLocaleString('id-ID')} baris per permintaan. Persempit filter.`);
 const table=records.map(r=>({dataset:r.dataset,code:r.regionCode??r.sourceCode,name:r.sourceName,region_name:r.region?.name??null,level:r.region?.level??null,province:r.region?.provinceCode??null,year:r.year,period:r.period,pillarId:r.pillarId,pillar:r.pillar?.name??null,indicator:r.indicator,unit:r.unit,value:r.value?.toString()??null,endValue:r.endValue?.toString()??null,category:r.category,population:(r.raw as Record<string,unknown>).jumlah_penduduk_miskin??null,povertyLine:(r.raw as Record<string,unknown>).garis_kemiskinan??null,sourceSheet:r.sourceSheet,sourceRow:r.sourceRow,sourceFile:r.sourceFile}));
 let buffer:Buffer,mime:string;
 if(filters.format==='sql'){
  const encode=(value:unknown)=>value===null||value===undefined?'NULL':String(value)===''?"''":`CONVERT(0x${Buffer.from(String(value)).toString('hex')} USING utf8mb4)`;
  buffer=Buffer.from([sqlHeader,...records.map(r=>sqlPrefix+sqlColumns.map(c=>encode(['raw','issues','metadata'].includes(c)?JSON.stringify(r[c]):r[c])).join(',')+');')].join('\n'));
  mime='application/sql';
 }else if(filters.format==='pdf'){
  buffer=await new Promise<Buffer>((resolve,reject)=>{
   const doc=new PDFDocument({size:'A4',layout:'landscape',margin:36,bufferPages:true,info:{Title:`PRPDN - ${datasets[filters.dataset]}`,Author:'PRPDN'}}),chunks:Buffer[]=[];
   doc.on('data',chunk=>chunks.push(chunk));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);
   const stamp=new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta'});
   doc.fillColor('#12354e').fontSize(20).text('PRPDN');doc.fontSize(14).text(datasets[filters.dataset]);
   doc.moveDown(.5).fillColor('#475569').fontSize(9).text(`Dibuat ${stamp} WIB | ${table.length} observasi | ${records.filter(r=>r.value!==null).length} nilai tersedia | ${new Set(records.flatMap(r=>r.regionCode?[r.regionCode]:[])).size} wilayah`);
   const context=Object.entries(filters).filter(([k,v])=>!['format','dataset'].includes(k)&&v!=='all'&&v!=='').map(([k,v])=>`${k}: ${v}`).join(' | ');
   doc.text(`Filter: ${context||'Seluruh data dataset'}`);doc.moveDown();
   doc.fillColor('#1e293b').fontSize(8);
   const columns=[64,162,72,181,100,191];
   doc.table({columnStyles:columns,defaultStyle:{border:0,padding:6},rowStyles:i=>i===0?{backgroundColor:'#e6edf3',font:{bold:true}}:{border:{bottom:0.5},borderColor:'#d7dfe8'},data:[['Kode','Wilayah','Tahun / periode','Indikator / satuan','Nilai / akhir','Kategori / sumber'],...table.map(r=>[r.code??'-',r.name,`${r.year??'-'}${r.period?` / ${r.period}`:''}`,`${r.indicator??r.pillar??datasets[filters.dataset]} / ${r.unit??'-'}`,`${r.value??'Tidak tersedia'}${r.endValue!==null?` / ${r.endValue}`:''}`,`${r.category??'-'}\n${r.sourceSheet}, baris ${r.sourceRow??'-'}`])]});
   doc.moveDown().fontSize(8).fillColor('#475569').text(`Sumber: ${[...new Set(records.map(r=>r.sourceFile))].join('; ')||'Tidak ada record sesuai filter'}. Nilai kosong bukan nol. Data diekspor dari database saat laporan dibuat.`);
   const pages=doc.bufferedPageRange();for(let i=0;i<pages.count;i++){doc.switchToPage(i);doc.fontSize(8).text(`PRPDN | ${i+1} / ${pages.count}`,36,doc.page.height-25,{lineBreak:false});}
   doc.end();
  });mime='application/pdf';
 }else{
  const clean=table.map(r=>Object.fromEntries(Object.entries(r).map(([key,value])=>[key,safeCell(value)])));
  const headers=['dataset','code','name','region_name','level','province','year','period','pillarId','pillar','indicator','unit','value','endValue','category','population','povertyLine','sourceSheet','sourceRow','sourceFile'];
  const sheet=XLSX.utils.json_to_sheet(clean,{header:headers});sheet['!cols']=headers.map(h=>({wch:['name','region_name','indicator','sourceFile'].includes(h)?36:18}));
  if(filters.format==='csv'){buffer=Buffer.from('\ufeff'+XLSX.utils.sheet_to_csv(sheet,{forceQuotes:true}));mime='text/csv; charset=utf-8';}
  else{const workbook=XLSX.utils.book_new();XLSX.utils.book_append_sheet(workbook,sheet,'Data PRPDN');buffer=XLSX.write(workbook,{type:'buffer',bookType:'xlsx'});mime='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';}
 }
 await db().auditLog.create({data:{actorId:actor.id,actorName:actor.name,action:`EXPORT_${filters.format.toUpperCase()}`,module:filters.dataset==='idsd-pillar'?'idsd':filters.dataset,entity:filters.dataset,after:auditJson({filters,count:records.length})}});
 return {buffer,mime,filename:`prpdn-${filters.dataset}-${filters.year}.${filters.format}`};
}
