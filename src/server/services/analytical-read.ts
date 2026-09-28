import 'server-only';
import {db} from '../db';
import type {AnalyticalData,AnalyticalModule} from '@/lib/analytical';
import type source from '@/data/idsd.json';
export async function readAnalytical(dataset:AnalyticalModule):Promise<AnalyticalData>{
 const [rows,metadata]=await Promise.all([db().observation.findMany({where:{dataset},orderBy:{sourceRow:'asc'}}),db().datasetMetadata.findUnique({where:{key:dataset}})]);
 const meta=metadata?.value as Pick<AnalyticalData,'excluded'|'definitions'|'rawNote'>|null;
 return {excluded:meta?.excluded??[],definitions:meta?.definitions,rawNote:meta?.rawNote,records:rows.map(r=>({id:r.id,sheet:r.sourceSheet,row:r.sourceRow??0,sourceCode:r.sourceCode,code:r.regionCode,name:r.sourceName,year:r.year,period:r.period,value:r.value===null?null:Number(r.value),end:r.endValue===null?null:Number(r.endValue),category:r.category,indicator:r.indicator,unit:r.unit,issues:r.issues as string[],raw:r.raw as AnalyticalData['records'][number]['raw']}))};
}
export type IdsdData={records:(Omit<typeof source.records[number],'id'>&{id:string|number;sourceRow:number|null;sourceSheet:string;sourceFile:string})[];definitions:typeof source.definitions;years:number[];pillars:Record<string,{id:number;value:number|null;rows:number[];conflict:boolean;mapped:boolean}[]>};
export async function readIdsd():Promise<IdsdData>{
 const [rows,pillars,definitions]=await Promise.all([db().observation.findMany({where:{dataset:'idsd'}}),db().observation.findMany({where:{dataset:'idsd-pillar'}}),db().pillar.findMany({orderBy:{id:'asc'}})]);
 const regions=await db().region.findMany({select:{code:true,level:true,provinceCode:true}}),regionMap=new Map(regions.map(r=>[r.code,r]));
 const result:IdsdData={records:[],years:[...new Set(rows.flatMap(r=>r.year===null?[]:[r.year]))].sort(),pillars:{},definitions:definitions.map(p=>({id:p.id,name:p.name,group:p.groupName}))};
 result.records=rows.map(r=>{const original=r.metadata as Record<string,unknown>,region=r.regionCode?regionMap.get(r.regionCode):undefined;return {id:r.id,sourceRow:r.sourceRow,sourceSheet:r.sourceSheet,sourceFile:r.sourceFile,year:r.year!,code:r.regionCode??original.code as string|null??null,sourceCode:r.sourceCode??'',name:r.sourceName,value:r.value===null?null:Number(r.value),match:r.regionCode?'code':String(original.match??'unmatched'),level:region?.level??String(original.level??'PROV'),sourceLevel:region?.level??original.sourceLevel as string|null??null,provinceCode:region?.provinceCode??original.provinceCode as string|null??null};});
 for(const row of pillars){if(!row.regionCode||row.year===null||row.pillarId===null)continue;const meta=row.metadata as Record<string,unknown>,key=`${row.regionCode}:${row.year}`;(result.pillars[key]??=[]).push({id:row.pillarId,value:row.value===null?null:Number(row.value),rows:Array.isArray(meta.rows)?meta.rows as number[]:[row.sourceRow??0],conflict:!!meta.conflict,mapped:!!meta.mapped});}
 return result;
}
