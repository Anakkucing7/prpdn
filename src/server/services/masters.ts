import 'server-only';
import { z } from 'zod';
import { db } from '../db';
import { HttpError } from '../access';
import { Prisma, type User } from '@/generated/prisma/client';

const optionalText=(max:number)=>z.string().trim().max(max).nullable().optional();
const optionalNumber=z.number().finite().nullable().optional();
export const yearSchema=z.object({year:z.number().int().min(1000).max(9999),sequence:z.number().int().min(1).max(100).nullable().optional(),version:z.number().int().positive().optional()}).strict();
export const indicatorSchema=z.object({id:z.number().int().positive(),name:z.string().trim().min(1).max(500),groupCode:optionalText(80),groupName:optionalText(500),unit:optionalText(100),baseline:optionalNumber,target:optionalNumber,period:optionalText(191),start:z.number().int().min(1000).max(9999).nullable().optional(),end:z.number().int().min(1000).max(9999).nullable().optional(),version:z.number().int().positive().optional()}).strict().refine(r=>!r.start||!r.end||r.end>=r.start,{path:['end'],message:'Tahun akhir harus sama atau setelah tahun awal.'});
export const auditJson=(value:unknown)=>JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
export async function listMasters(resource:'years'|'indicators'){
  return resource==='years'?db().year.findMany({orderBy:{year:'asc'}}):db().indicator.findMany({orderBy:{id:'asc'}});
}
export async function mutateMaster(resource:'years'|'indicators',method:string,id:number|undefined,payload:unknown,user:User){
  return db().$transaction(async tx=>{
    const model=resource==='years'?tx.year:tx.indicator;
    const before=id===undefined?null:await (resource==='years'?tx.year.findUnique({where:{id}}):tx.indicator.findUnique({where:{id}}));
    if(method!=='POST'&&!before)throw new HttpError(404,'Record tidak ditemukan.');
    const parsed=method==='DELETE'?z.object({version:z.number().int().positive()}).strict().parse(payload):resource==='years'?yearSchema.parse(payload):indicatorSchema.parse(payload);
    if(before&&parsed.version!==before.version)throw new HttpError(409,'Data telah berubah. Muat ulang sebelum menyimpan.');
    if(resource==='indicators'&&id!==undefined&&'id' in parsed&&parsed.id!==id)throw new HttpError(422,'ID indikator tidak dapat diubah.');
    let result:unknown;
    if(method==='DELETE'){
      if(resource==='years')await tx.year.delete({where:{id,version:parsed.version}});
      else await tx.indicator.delete({where:{id,version:parsed.version}});
      result={deleted:true};
    } else if(resource==='years'){
      const {version,...value}=yearSchema.parse(payload);
      void version;
      result=method==='POST'?await tx.year.create({data:value}):await tx.year.update({where:{id,version:parsed.version},data:{...value,version:{increment:1}}});
    } else {
      const {version,...value}=indicatorSchema.parse(payload);
      void version;
      result=method==='POST'?await tx.indicator.create({data:value}):await tx.indicator.update({where:{id,version:parsed.version},data:{...value,version:{increment:1}}});
    }
    await tx.auditLog.create({data:{actorId:user.id,actorName:user.name,action:method==='POST'?'CREATE':method==='DELETE'?'DELETE':'UPDATE',module:resource,entity:String(id??(result as {id:number}).id),before:before?auditJson(before):Prisma.DbNull,after:method==='DELETE'?Prisma.DbNull:auditJson(result)}});
    void model;
    return result;
  });
}
