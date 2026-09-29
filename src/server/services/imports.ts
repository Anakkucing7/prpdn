import 'server-only';
import {z} from 'zod';
import {Prisma,type User} from '@/generated/prisma/client';
import {db} from '../db';
import {HttpError} from '../access';
import {auditJson} from './masters';
import {datasets,type TransferDataset,type Mapping,type TransferRow,type Finding} from '@/lib/data-transfer';
import {normalize,references,validateMapping} from './import-rules';
import type {ParsedFile} from './import-files';
import {permitted,type Permissions} from '@/lib/permissions';

export type Actor=User&{role:{permissions:Prisma.JsonValue}};
export function datasetPermission(actor:Actor,dataset:string,action:'view'|'manage'){
 const key=dataset==='idsd-pillar'?'idsd':dataset;
 if(!Object.hasOwn(datasets,dataset)||!permitted(actor.role.permissions as Permissions,key as 'idsd',action))throw new HttpError(403,'Izin dataset tidak mencukupi.');
}
const datasetSchema=z.enum(Object.keys(datasets) as [TransferDataset,...TransferDataset[]]);
const mappingSchema=z.record(z.string(),z.string().max(191));
function status(findings:Finding[]){return findings.some(f=>f.severity==='ERROR')?'ERROR':findings.length?'WARNING':'VALID';}
function sqlRow(data:TransferRow):TransferRow{
 // Only analytical fields are decoded. IDs, prior decisions and metadata never grant authority.
 return {code:data.regionCode??data.sourceCode,name:data.sourceName,year:data.year,value:data.value,pillarId:data.pillarId,indicator:data.indicator,unit:data.unit,period:data.period,category:data.category,endValue:data.endValue};
}
export async function stageFile(file:ParsedFile,datasetInput:unknown,mappingInput:unknown,actor:Actor){
 const dataset=datasetSchema.parse(datasetInput);datasetPermission(actor,dataset,'manage');
 if(!file.rows?.length||!file.columns||!file.sheet)throw new HttpError(422,'Pilih sheet berisi record.');
 if(file.sql&&file.rows.some(r=>r.data.dataset!==dataset))throw new HttpError(422,'Dataset SQL harus sama dengan tujuan; satu dataset per batch.');
 let mapping=mappingSchema.parse(mappingInput) as Mapping;
 if(file.sql){mapping={code:'code',name:'name',year:'year',value:'value',...(dataset==='idsd-pillar'?{pillarId:'pillarId'}:{}),...(dataset==='rpjmd'?{indicator:'indicator',unit:'unit',category:'category',endValue:'endValue'}:{}),...(dataset==='poverty'?{period:'period'}:{}),...(['kfd','eppd'].includes(dataset)?{category:'category'}:{})};}
 else validateMapping(mapping,file.columns,dataset);
 const refs=await references();
 const prepared=file.rows.map(row=>{const source=file.sql?sqlRow(row.data):row.data;return {...row,source,...normalize(source,mapping,dataset,refs)};});
 const counts=new Map<string,number>();for(const row of prepared)counts.set(row.key,(counts.get(row.key)||0)+1);
 for(const row of prepared)if(counts.get(row.key)!>1)row.findings.push({severity:'WARNING',code:'DUPLICATE',message:'Identitas berulang dalam batch. Terima paling banyak satu baris dan tolak yang lain.'});
 return db().$transaction(async tx=>{
  const batch=await tx.importBatch.create({data:{filename:file.filename,sha256:file.sha256,size:file.size,dataset,sheet:file.sheet!,columns:file.sql?Object.keys(prepared[0].source):file.columns!,mapping:auditJson(mapping),creatorId:actor.id,status:'REVIEW'}});
  for(let i=0;i<prepared.length;i+=250)await tx.importRow.createMany({data:prepared.slice(i,i+250).map(r=>({batchId:batch.id,rowNumber:r.rowNumber,original:auditJson(r.data),corrected:file.sql?auditJson(r.source):Prisma.DbNull,normalized:auditJson(r.normalized),findings:auditJson(r.findings),status:status(r.findings)}))});
  await tx.auditLog.create({data:{actorId:actor.id,actorName:actor.name,action:file.sql?'SQL_IMPORT_STAGED':'IMPORT_STAGED',module:'import',entity:batch.id,after:{dataset,file:file.filename,sha256:file.sha256,rows:prepared.length}}});
  return {id:batch.id,version:batch.version};
 },{timeout:120000});
}
export async function batchAccess(id:string,actor:Actor,action:'view'|'manage'='view'){
 const batch=await db().importBatch.findUnique({where:{id}});if(!batch)throw new HttpError(404,'Batch tidak ditemukan.');
 if(batch.filename.toLowerCase().endsWith('.sql')&&actor.roleId!=='super-admin')throw new HttpError(403,'Batch SQL hanya dapat diakses Super Admin.');
 datasetPermission(actor,batch.dataset,action);return batch;
}
async function summary(id:string){
 const groups=await db().importRow.groupBy({by:['status','decision'],where:{batchId:id},_count:true});
 const counts={total:0,valid:0,warning:0,error:0,accepted:0,rejected:0,pending:0};
 for(const g of groups){counts.total+=g._count;if(g.status==='VALID')counts.valid+=g._count;if(g.status==='WARNING')counts.warning+=g._count;if(g.status==='ERROR')counts.error+=g._count;if(g.decision==='ACCEPT')counts.accepted+=g._count;else if(g.decision==='REJECT')counts.rejected+=g._count;else counts.pending+=g._count;}
 return counts;
}
export async function batchHistory(actor:Actor,page=1){
 const allowed=Object.keys(datasets).filter(d=>permitted(actor.role.permissions as Permissions,(d==='idsd-pillar'?'idsd':d) as 'idsd','view'));
 const where={dataset:{in:allowed},...(actor.roleId!=='super-admin'?{NOT:{filename:{endsWith:'.sql'}}}:{})};
 const [batches,total]=await Promise.all([db().importBatch.findMany({where,orderBy:{createdAt:'desc'},take:15,skip:(page-1)*15,include:{creator:{select:{name:true}}}}),db().importBatch.count({where})]);
 return {rows:await Promise.all(batches.map(async b=>({...b,counts:await summary(b.id)}))),total,page,size:15};
}
export async function batchDetail(id:string,actor:Actor,query:URLSearchParams){
 await batchAccess(id,actor);
 const page=z.coerce.number().int().min(1).max(100000).parse(query.get('page')||1),decision=z.enum(['all','PENDING','ACCEPT','REJECT']).parse(query.get('decision')||'all');
 const batch=await db().importBatch.findUniqueOrThrow({where:{id},include:{creator:{select:{name:true}}}});
 const where={batchId:id,...(decision!=='all'?{decision}:{})};
 const [rows,total,counts]=await Promise.all([db().importRow.findMany({where,orderBy:{rowNumber:'asc'},take:25,skip:(page-1)*25}),db().importRow.count({where}),summary(id)]);
 return {...batch,rows,total,counts,page,size:25};
}
const reviewSchema=z.object({batchVersion:z.number().int().positive(),rowId:z.string().max(191),version:z.number().int().positive(),decision:z.enum(['ACCEPT','REJECT','PENDING']),reviewNote:z.string().trim().max(2000),corrected:z.record(z.string().max(191),z.union([z.string().max(10000),z.number().finite(),z.null()])).optional()}).strict();
export async function reviewRow(id:string,input:unknown,actor:Actor){
 const payload=reviewSchema.parse(input);await batchAccess(id,actor);
 return db().$transaction(async tx=>{
  const batch=await tx.importBatch.update({where:{id,version:payload.batchVersion,status:{in:['REVIEW','READY']}},data:{version:{increment:1}}});
  const row=await tx.importRow.findUnique({where:{id:payload.rowId}});if(!row||row.batchId!==id)throw new HttpError(404,'Baris tidak ditemukan.');
  const corrected=payload.corrected??row.corrected??row.original;
  const {normalized,findings}=normalize(corrected as TransferRow,batch.mapping as Mapping,batch.dataset as TransferDataset,await references(tx));
  if(payload.decision==='ACCEPT'&&findings.some(f=>f.severity==='ERROR'))throw new HttpError(422,'Koreksi kesalahan sebelum menerima baris.');
  if((payload.decision==='REJECT'||payload.corrected||findings.length)&&!payload.reviewNote)throw new HttpError(422,'Catatan tinjauan wajib untuk penolakan, koreksi, atau peringatan.');
  await tx.importRow.update({where:{id:row.id,version:payload.version},data:{corrected:auditJson(corrected),normalized:auditJson(normalized),findings:auditJson(findings),status:status(findings),decision:payload.decision,reviewNote:payload.reviewNote,reviewedBy:actor.id,reviewedAt:new Date(),version:{increment:1}}});
  const pending=await tx.importRow.count({where:{batchId:id,decision:'PENDING'}}),accepted=await tx.importRow.count({where:{batchId:id,decision:'ACCEPT'}});
  await tx.importBatch.update({where:{id},data:{status:!pending&&accepted?'READY':'REVIEW'}});
  await tx.auditLog.create({data:{actorId:actor.id,actorName:actor.name,action:`ROW_${payload.decision}`,module:'validation',entity:row.id,before:auditJson({decision:row.decision,corrected:row.corrected}),after:auditJson({decision:payload.decision,corrected,reviewNote:payload.reviewNote})}});
  return {version:batch.version};
 },{timeout:30000});
}
export async function finishBatch(id:string,input:unknown,actor:Actor){
 const payload=z.object({version:z.number().int().positive(),action:z.enum(['COMMIT','REJECT']),note:z.string().trim().max(2000)}).strict().parse(input);
 await batchAccess(id,actor,'manage');
 if(payload.action==='REJECT'&&!payload.note)throw new HttpError(422,'Alasan penolakan batch wajib diisi.');
 return db().$transaction(async tx=>{
  // ponytail: serialize batch commits through one DB row; use per-dataset locks if import throughput requires it.
  await tx.datasetMetadata.upsert({where:{key:'import-commit-lock'},create:{key:'import-commit-lock',value:{}},update:{updatedAt:new Date()}});
  const batch=await tx.importBatch.update({where:{id,version:payload.version,status:{in:payload.action==='COMMIT'?['READY']:['REVIEW','READY']}},data:{status:payload.action==='COMMIT'?'IMPORTING':'REJECTED',version:{increment:1}}});
  const rows=await tx.importRow.findMany({where:{batchId:id},orderBy:{rowNumber:'asc'}});
  if(payload.action==='COMMIT'){
   if(rows.some(r=>r.decision==='PENDING')||!rows.some(r=>r.decision==='ACCEPT'))throw new HttpError(409,'Semua baris harus ditinjau dan minimal satu diterima.');
   const refs=await references(tx),keys=new Set<string>();
   const records:Prisma.ObservationCreateManyInput[]=[];
   for(const row of rows.filter(r=>r.decision==='ACCEPT')){
    const {normalized:n,findings,key}=normalize((row.corrected??row.original) as TransferRow,batch.mapping as Mapping,batch.dataset as TransferDataset,refs);
    if(findings.some(f=>f.severity==='ERROR')||keys.has(key))throw new HttpError(409,`Baris ${row.rowNumber} memiliki konflik atau referensi berubah. Kembalikan keputusan baris untuk ditinjau; tidak ada record yang disimpan.`);
    if(findings.length&&!row.reviewNote)throw new HttpError(409,`Baris ${row.rowNumber} memerlukan catatan tinjauan.`);
    keys.add(key);
    const original=row.original as Record<string,unknown>;
    const supplemental=batch.filename.toLowerCase().endsWith('.sql')&&typeof original.raw==='string'?JSON.parse(original.raw):{};
    records.push({dataset:n.dataset,sourceSheet:batch.sheet==='PRPDN'?String(original.sourceSheet).slice(0,80):batch.sheet,sourceRow:row.rowNumber,sourceFile:batch.filename,sourceCode:n.code,regionCode:n.code,sourceName:n.name,year:n.year,yearId:n.yearId,pillarId:n.pillarId,period:n.period,indicator:n.indicator,unit:n.unit,value:n.value,endValue:n.endValue,category:n.category,raw:auditJson({...supplemental,...row.original as object,...(n.population!==null?{jumlah_penduduk_miskin:Number(n.population)}:{}),...(n.povertyLine!==null?{garis_kemiskinan:Number(n.povertyLine)}:{})}),issues:auditJson(findings.map(f=>f.message)),metadata:{reviewer:row.reviewedBy,reviewNote:row.reviewNote,importRow:row.id},importKey:key,batchId:id});
   }
   for(let i=0;i<records.length;i+=250)await tx.observation.createMany({data:records.slice(i,i+250)});
  }
  const result=await tx.importBatch.update({where:{id},data:{status:payload.action==='COMMIT'?'COMPLETED':'REJECTED',approvedBy:actor.id,approvedAt:new Date()}});
  await tx.auditLog.create({data:{actorId:actor.id,actorName:actor.name,action:payload.action==='COMMIT'?'IMPORT_COMMITTED':'IMPORT_REJECTED',module:'validation',entity:id,after:{status:result.status,accepted:rows.filter(r=>r.decision==='ACCEPT').length,rejected:rows.filter(r=>r.decision==='REJECT').length,note:payload.note}}});
  return {status:result.status};
 },{isolationLevel:'ReadCommitted',timeout:120000});
}
