/** Integration QA. Requires the app pointed at prpdn_test, never prpdn. */
import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import * as XLSX from 'xlsx';
import {hashPassword} from 'better-auth/crypto';
import {db} from '../src/server/db';

const url=new URL(process.env.DATABASE_URL!);url.pathname='/prpdn_test';process.env.DATABASE_URL=url.toString();
const prisma=db(),base=process.env.BETTER_AUTH_URL!,run=randomUUID().slice(0,8);
const output=join(tmpdir(),'prpdn-phase7-qa');mkdirSync(output,{recursive:true});
const reports:string[]=[];
let cookie='';
async function call(path:string,method='GET',value?:unknown,headers:Record<string,string>={}){
 return fetch(base+path,{method,headers:{Origin:base,Cookie:cookie,...(value!==undefined?{'Content-Type':'application/json'}:{}),...headers},body:value===undefined?undefined:JSON.stringify(value)});
}
async function result<T>(response:Response,status=200):Promise<T>{const data=await response.json();assert.equal(response.status,status,JSON.stringify(data));return data as T;}
async function login(email:string,password:string){const response=await call('/api/auth/sign-in/email','POST',{email,password});await result(response);cookie=response.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');assert(cookie);return cookie;}
async function upload(name:string,buffer:Buffer,sheet?:string,stage=false,mapping:Record<string,string>={code:'code',year:'year',value:'value'},dataset='idsd'){
 return fetch(base+`/api/admin/imports/upload/?${new URLSearchParams({dataset,...(sheet?{sheet}:{}),...(stage?{stage:'true'}:{})})}`,{method:'POST',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/octet-stream','X-File-Name':encodeURIComponent(name),'X-Column-Mapping':JSON.stringify(mapping)},body:new Uint8Array(buffer)});
}
type Batch={id:string;version:number;status:string;rows:{id:string;rowNumber:number;version:number;original:Record<string,unknown>;normalized:{value:string|null;code:string};decision:string;findings:{code:string}[]}[]};
async function detail(id:string){return result<Batch>(await call(`/api/admin/imports/${id}/?workspace=validation`));}
async function decide(batch:Batch,index:number,decision:string,corrected?:Record<string,unknown>){const row=batch.rows[index];return call(`/api/admin/imports/${batch.id}/review/`,'PATCH',{batchVersion:batch.version,rowId:row.id,version:row.version,decision,reviewNote:'Pengujian integrasi pada database QA terisolasi.',...(corrected?{corrected}:{})});}
async function main(){
 assert.equal(await prisma.observation.count({where:{batchId:null}}),24106,'Seed workbook test must exist.');
 assert.equal((await call('/api/admin/imports/')).status,401);assert.equal((await call('/api/admin/export/?dataset=idsd&format=csv')).status,401);reports.push('Unauthenticated import/export blocked');
 const adminId=randomUUID(),adminEmail=`qa-${run}-admin@example.invalid`,adminPassword=randomUUID()+randomUUID();
 await prisma.user.create({data:{id:adminId,name:'Administrator QA',email:adminEmail,roleId:'super-admin',accounts:{create:{id:randomUUID(),providerId:'credential',accountId:adminId,password:await hashPassword(adminPassword)}}}});
 writeFileSync(join(output,'credentials.json'),JSON.stringify({email:adminEmail,password:adminPassword}));
 await login(adminEmail,adminPassword);const adminCookie=cookie;
 const me=await result<{user:{id:string}}>(await call('/api/auth/get-session'));assert(await prisma.session.findFirst({where:{userId:me.user.id}}),'App must use QA DB; abort if connected to production');
 // Only previous batches created by this QA script in prpdn_test are cleaned up; seeded rows have no batchId.
 const previous=await prisma.importBatch.findMany({where:{creator:{email:{startsWith:'qa-',endsWith:'@example.invalid'}}},select:{id:true}});
 await prisma.observation.deleteMany({where:{batchId:{in:previous.map(b=>b.id)}}});
 await prisma.importBatch.deleteMany({where:{id:{in:previous.map(b=>b.id)}}});
 const seedBefore=await prisma.observation.count({where:{batchId:null}});
 const workbook=readFileSync('data/Dataset Dashboard 040526.xlsx');
 const detected=await result<{sheets:string[]}>(await upload('Dataset Dashboard 040526.xlsx',workbook));assert(detected.sheets.includes('fact_total_idsd'));
 const preview=await result<{rows:unknown[];total:number;columns:string[]}>(await upload('Dataset Dashboard 040526.xlsx',workbook,'fact_total_idsd'));assert(preview.rows.length>0&&preview.total>=1649);reports.push('Actual project XLSX detected and previewed');
 assert.equal((await upload('unsafe.exe',Buffer.from('abc'))).status,415);
 assert.equal((await upload('unsafe.sql',Buffer.from('DROP TABLE Observation;'))).status,422);
 for(const sql of ['CREATE USER attacker','GRANT ALL ON *.* TO attacker','LOAD DATA LOCAL INFILE','ALTER USER root','INSTALL PLUGIN x'])assert.equal((await upload('unsafe.sql',Buffer.from('-- PRPDN-DATA-V1\n'+sql))).status,422);
 const config=await result<{bytes:number}>(await call('/api/admin/imports/config/'));
 const oversized=new Uint8Array(config.bytes+1);assert.equal((await upload('large.csv',Buffer.from(oversized))).status,413);reports.push('Extension, size, unsafe SQL rejected');
 const csv=Buffer.from('code,year,value\n11,2025,0\n12,2025,\n99999,2025,3.4\n13,2025,3.7\n13,2025,3.8\n14,2025,abc\n11,2024,3.1\n');
 const csvPreview=await result<{sheets:string[]}>(await upload('qa.csv',csv));const sheet=csvPreview.sheets[0];
 assert.equal((await upload('qa.csv',csv,sheet,true,{code:'missing',year:'year',value:'value'})).status,422);
 const staged=await result<{id:string}>(await upload(`qa-${run}.csv`,csv,sheet,true),201);let batch=await detail(staged.id);
 assert.equal(batch.rows.length,7);assert.equal(batch.rows[0].normalized.value,'0');assert.equal(batch.rows[1].normalized.value,null);assert(batch.rows[2].findings.some(f=>f.code==='REGION'));assert(batch.rows[3].findings.some(f=>f.code==='DUPLICATE'));assert(batch.rows[5].findings.some(f=>f.code==='NUMBER'));assert(batch.rows[6].findings.some(f=>f.code==='DB_CONFLICT'));
 const originalVersion=batch;
 await result(await decide(batch,0,'ACCEPT'));assert.equal((await decide(originalVersion,0,'ACCEPT')).status,409);batch=await detail(batch.id);
 await result(await decide(batch,1,'ACCEPT'));batch=await detail(batch.id);
 await result(await decide(batch,2,'ACCEPT',{code:'15',year:'2025',value:'3.4'}));batch=await detail(batch.id);assert.equal(batch.rows[2].original.code,'99999');
 await result(await decide(batch,3,'ACCEPT'));batch=await detail(batch.id);
 await result(await decide(batch,4,'REJECT'));batch=await detail(batch.id);
 await result(await decide(batch,5,'REJECT'));batch=await detail(batch.id);
 await result(await decide(batch,6,'REJECT'));batch=await detail(batch.id);assert.equal(batch.status,'READY');
 await result(await decide(batch,0,'PENDING'));batch=await detail(batch.id);assert.equal(batch.status,'REVIEW');
 assert.equal((await call(`/api/admin/imports/${batch.id}/finish/`,'POST',{version:batch.version,action:'COMMIT',note:'QA'})).status,409);
 await result(await decide(batch,0,'ACCEPT'));batch=await detail(batch.id);
 await result(await call(`/api/admin/imports/${batch.id}/finish/`,'POST',{version:batch.version,action:'COMMIT',note:'QA'}));assert.equal(await prisma.observation.count({where:{batchId:batch.id}}),4);
 assert.equal((await call(`/api/admin/imports/${batch.id}/finish/`,'POST',{version:batch.version,action:'COMMIT',note:'QA'})).status,409);
 assert.equal((await prisma.observation.findFirstOrThrow({where:{batchId:batch.id,regionCode:'11'}})).value?.toString(),'0');
 assert.equal((await prisma.observation.findFirstOrThrow({where:{batchId:batch.id,regionCode:'12'}})).value,null);reports.push('Persistent correction/review, versions, return/reject/approve, zero/null and atomic commit');
 const conflictCsv=Buffer.from('code,year,value\n16,2025,3.3\n17,2025,3.4\n');const conflict=await result<{id:string}>(await upload(`conflict-${run}.csv`,conflictCsv,sheet,true),201);let cb=await detail(conflict.id);await result(await decide(cb,0,'ACCEPT'));cb=await detail(cb.id);await result(await decide(cb,1,'ACCEPT'));cb=await detail(cb.id);
 const winner=await result<{id:string}>(await upload(`winner-${run}.csv`,Buffer.from('code,year,value\n17,2025,3.6\n'),sheet,true),201);let wb=await detail(winner.id);await result(await decide(wb,0,'ACCEPT'));wb=await detail(wb.id);await result(await call(`/api/admin/imports/${wb.id}/finish/`,'POST',{version:wb.version,action:'COMMIT',note:'QA'}));
 assert.equal((await call(`/api/admin/imports/${cb.id}/finish/`,'POST',{version:cb.version,action:'COMMIT',note:'QA'})).status,409);assert.equal(await prisma.observation.count({where:{batchId:cb.id}}),0);assert.equal((await detail(cb.id)).status,'READY');reports.push('Changed conflict rolls entire batch back');
 const smallBook=XLSX.utils.book_new();XLSX.utils.book_append_sheet(smallBook,XLSX.utils.json_to_sheet([{code:'18',year:2025,value:3.5}]),'Data');
 for(const ext of ['xlsx','xls'] as const){const buffer=XLSX.write(smallBook,{bookType:ext==='xls'?'biff8':'xlsx',type:'buffer'});const resultFile=await result<{id:string}>(await upload(`qa-${run}.${ext}`,buffer,'Data',true),201);const b=await detail(resultFile.id);assert.equal(b.rows[0].normalized.value,'3.5');await result(await call(`/api/admin/imports/${b.id}/finish/`,'POST',{version:b.version,action:'REJECT',note:'QA format parser'}));}
 reports.push('XLS and XLSX staging; reject batch persisted');
 for(const format of ['csv','xlsx','pdf','sql']){const response=await call(`/api/admin/export/?dataset=idsd&year=2024&province=11&level=PROV&format=${format}`);assert.equal(response.status,200,await (response.ok?Promise.resolve(''):response.text()));const buffer=Buffer.from(await response.arrayBuffer());writeFileSync(join(output,`idsd-aceh.${format}`),buffer);if(format==='pdf')assert.equal(buffer.subarray(0,4).toString(),'%PDF');else if(format==='sql'){assert(buffer.toString().startsWith('-- PRPDN-DATA-V1'));assert(!buffer.toString().includes('Session'));const s=await result<{id:string}>(await upload('roundtrip.sql',buffer,'PRPDN',true),201);const b=await detail(s.id);assert(b.rows[0].findings.some(f=>f.code==='DB_CONFLICT'));}else {const book=XLSX.read(buffer,{type:'buffer'});const rows=XLSX.utils.sheet_to_json<Record<string,unknown>>(book.Sheets[book.SheetNames[0]]);assert(rows.length===1);assert.equal(Number(rows[0].year),2024);assert.equal(String(rows[0].code),'11');}}
 reports.push('CSV/XLSX/PDF/controlled SQL exports from current filtered DB; SQL roundtrip blocks duplicate');
 const password='QA-'+randomUUID();
 for(const roleId of ['operator','public-viewer']){const id=randomUUID(),email=`qa-${run}-${roleId}@example.invalid`;await prisma.user.create({data:{id,name:'QA '+roleId,email,roleId,accounts:{create:{id:randomUUID(),providerId:'credential',accountId:id,password:await hashPassword(password)}}}});await login(email,password);if(roleId==='public-viewer'){assert.equal((await call('/api/admin/imports/')).status,403);assert.equal((await call('/api/admin/export/?dataset=idsd&format=csv')).status,403);}else{assert.equal((await upload('forbidden.sql',Buffer.from('-- PRPDN-DATA-V1'))).status,403);assert.equal((await call('/api/admin/export/?dataset=idsd&format=sql')).status,403);assert.equal((await decide(cb,0,'REJECT')).status,403);}}
 cookie=adminCookie;assert.equal((await call('/api/admin/imports/'+batch.id+'/finish/','POST',{version:1,action:'COMMIT',note:''},{Origin:'https://evil.invalid'})).status,403);
 assert(await prisma.auditLog.count({where:{action:'IMPORT_COMMITTED'}})>0);assert(await prisma.auditLog.count({where:{action:'ROW_ACCEPT'}})>0);assert(await prisma.auditLog.count({where:{action:'EXPORT_PDF'}})>0);assert.equal(await prisma.observation.count({where:{batchId:null}}),seedBefore);reports.push('Server RBAC, SQL privilege, CSRF, audit; 24,106 seed observations preserved');
 writeFileSync(join(output,'result.json'),JSON.stringify({reports,batch:batch.id,output},null,2));console.log(JSON.stringify({passed:reports,output},null,2));
}
main().finally(()=>prisma.$disconnect());
