import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { db } from '../src/server/db';
import { initialPermissions, roleNames, type RoleId } from '../src/lib/permissions';
import { Prisma } from '../src/generated/prisma/client';

const read=(file:string)=>JSON.parse(readFileSync(file,'utf8'));
const json=(value:unknown)=>JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const prisma=db();
const workbook='Dataset Dashboard 040526.xlsx';
const analytical=read('src/data/analytical.json');
if(createHash('sha256').update(readFileSync(`data/${workbook}`)).digest('hex')!==analytical.sha256)throw new Error('Workbook changed. Regenerate analytical fixtures before seeding.');

async function seed(){
  await prisma.role.createMany({data:Object.entries(roleNames).map(([id,name])=>({id,name,permissions:initialPermissions(id as RoleId)})),skipDuplicates:true});
  await prisma.systemSetting.upsert({where:{id:'general'},create:{id:'general'},update:{}});
  const masters=read('src/data/masters.json');
  await prisma.year.createMany({data:masters.years.map((r:{id_waktu:number;tahun:number;tahun_ke_rpjmd:number|null;sourceRow:number})=>({id:r.id_waktu,year:r.tahun,sequence:r.tahun_ke_rpjmd,sourceRow:r.sourceRow,provenance:workbook})),skipDuplicates:true});
  const yearIds=new Map((await prisma.year.findMany()).map(r=>[r.year,r.id]));
  for(const r of masters.indicators)await prisma.indicator.upsert({where:{id:r.id_indikator_rpjmd},update:{},create:{id:r.id_indikator_rpjmd,name:r.nama_indikator,groupCode:r.kode_sasaran,groupName:r.nama_sasaran,unit:r.satuan,baseline:r.kondisi_awal,target:r.target_akhir,period:r.nama_periode,start:r.tahun_mulai,end:r.tahun_selesai,sourceRow:r.sourceRow,provenance:workbook}});
  const regions=read('src/data/regions.json');
  const spatial=read('src/data/spatial-reference.json');
  const boundaries=read('public/data/region-boundaries.json');
  const geometry=new Map<string,Prisma.InputJsonValue>(boundaries.features.map((f:{properties:{code:string};geometry:unknown})=>[f.properties.code,json(f.geometry)]));
  const official=new Map<string,{name:string;boundary:boolean;boundaryIssue:string|null}>(spatial.regions.map((r:{code:string})=>[r.code,r]));
  for(const r of [...regions].sort((a,b)=>a.code.length-b.code.length)){
    const ref=official.get(r.code);
    await prisma.region.upsert({where:{code:r.code},update:{},create:{code:r.code,name:ref?.name??r.name,level:r.level,provinceCode:r.provinceCode,parentCode:r.level==='PROV'?null:r.provinceCode,island:r.island,active:r.active,longitude:r.longitude,latitude:r.latitude,geometry:geometry.get(r.code)??Prisma.DbNull,sourceRow:r.sourceRow,metadata:json({...r,boundary:ref?.boundary??false,boundaryIssue:ref?.boundaryIssue??null,omittedRings:0})}});
  }
  const regionCodes=new Set((await prisma.region.findMany({select:{code:true}})).map(r=>r.code));
  for(const [dataset,data] of Object.entries(analytical.modules) as [string,{records:Record<string,unknown>[];excluded:unknown;rawNote?:string;definitions?:unknown}][]){
    const records:Prisma.ObservationCreateManyInput[]=data.records.map(r=>({id:`workbook:${String(r.id)}`,dataset,sourceSheet:String(r.sheet),sourceRow:Number(r.row),sourceFile:workbook,sourceCode:r.sourceCode as string|null,regionCode:r.code as string|null,sourceName:String(r.name),year:r.year as number|null,yearId:yearIds.get(r.year as number)??null,period:r.period as string|null,indicator:r.indicator as string|null,unit:r.unit as string|null,value:r.value as number|null,endValue:r.end as number|null,category:r.category as string|null,raw:json(r.raw),issues:json(r.issues),metadata:json({originalId:r.id})}));
    for(let i=0;i<records.length;i+=250)await prisma.observation.createMany({data:records.slice(i,i+250),skipDuplicates:true});
    await prisma.datasetMetadata.upsert({where:{key:dataset},create:{key:dataset,value:json({excluded:data.excluded,rawNote:data.rawNote,definitions:data.definitions,sha256:analytical.sha256})},update:{}});
  }
  const idsd=read('src/data/idsd.json');
  await prisma.pillar.createMany({data:idsd.definitions.map((r:{id:number;name:string;group:string})=>({id:r.id,name:r.name,groupName:r.group})),skipDuplicates:true});
  const scores:Prisma.ObservationCreateManyInput[]=idsd.records.map((r:{id:number;year:number;code:string|null;sourceCode:string;name:string;value:number|null;match:string})=>({id:`idsd-total:${r.id}`,dataset:'idsd',sourceSheet:'fact_total_idsd',sourceRow:r.id,sourceFile:workbook,sourceCode:r.sourceCode,regionCode:r.match==='code'&&r.code&&regionCodes.has(r.code)?r.code:null,sourceName:r.name,year:r.year,yearId:yearIds.get(r.year)??null,unit:'skor',value:r.value,raw:json(r),issues:json(r.match==='code'?[]:['Padanan kode sumber perlu ditinjau.']),metadata:json(r)}));
  for(const [key,values] of Object.entries(idsd.pillars) as [string,{id:number;value:number|null;rows:number[];conflict:boolean;mapped:boolean}[]][]){
    const [code,year]=key.split(':');
    for(const r of values)scores.push({id:`idsd-pillar:${key}:${r.id}`,dataset:'idsd-pillar',sourceSheet:code.length===2?'fact_skor_pilar':'fact_skor_pilar_kabkota',sourceRow:r.rows[0],sourceFile:workbook,sourceCode:code,regionCode:regionCodes.has(code)?code:null,sourceName:code,year:Number(year),yearId:yearIds.get(Number(year))??null,pillarId:r.id,unit:'skor',value:r.value,raw:json(r),issues:json(r.conflict?['Konflik nilai pilar pada sumber.']:[]),metadata:json(r)});
  }
  for(let i=0;i<scores.length;i+=250)await prisma.observation.createMany({data:scores.slice(i,i+250),skipDuplicates:true});
  await prisma.datasetMetadata.upsert({where:{key:'source'},create:{key:'source',value:{workbook,sha256:analytical.sha256,spatial:json({...spatial,regions:undefined})}},update:{}});
  console.log('Workbook seed complete; existing database records were preserved.',{regions:await prisma.region.count(),observations:await prisma.observation.count(),years:await prisma.year.count()});
}
seed().finally(()=>prisma.$disconnect());
