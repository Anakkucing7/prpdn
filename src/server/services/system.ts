import 'server-only';
import { randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { z } from 'zod';
import { db } from '../db';
import { HttpError } from '../access';
import { auditJson } from './masters';
import { Prisma, type User } from '@/generated/prisma/client';
import { permissionModules, roleNames, type Permissions } from '@/lib/permissions';

const userSelect={id:true,name:true,username:true,email:true,workUnit:true,roleId:true,active:true,approvalStatus:true,lastLogin:true,createdAt:true,updatedAt:true} as const;
const userSchema=z.object({name:z.string().trim().min(1).max(100),username:z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,40}$/),email:z.email().trim().toLowerCase().max(191),workUnit:z.string().trim().max(120),roleId:z.enum(Object.keys(roleNames) as [string,...string[]]),active:z.boolean(),password:z.string().min(12).max(128).optional(),updatedAt:z.iso.datetime().optional()}).strict();
export async function listUsers(){return db().user.findMany({select:userSelect,orderBy:{createdAt:'desc'}});}
export async function saveUser(id:string|undefined,payload:unknown,actor:User){
  const value=userSchema.parse(payload);
  if(!id&&!value.password)throw new HttpError(422,'Kata sandi awal minimal 12 karakter wajib diisi.');
  if(id&&value.password)throw new HttpError(422,'Gunakan alur perubahan kata sandi yang terpisah.');
  const password=value.password?await hashPassword(value.password):undefined;
  return db().$transaction(async tx=>{
    const before=id?await tx.user.findUnique({where:{id},select:userSelect}):null;
    if(id&&!before)throw new HttpError(404,'Pengguna tidak ditemukan.');
    if(before&&value.updatedAt!==before.updatedAt.toISOString())throw new HttpError(409,'Pengguna telah berubah. Muat ulang sebelum menyimpan.');
    if(actor.roleId!=='super-admin'&&(value.roleId==='super-admin'||before?.roleId==='super-admin'))throw new HttpError(403,'Hanya Super Admin dapat mengelola akun Super Admin.');
    if(id===actor.id&&(!value.active||value.roleId!==actor.roleId))throw new HttpError(422,'Anda tidak dapat menonaktifkan atau mengubah role akun sendiri.');
    if(before?.roleId==='super-admin'&&before.active&&(!value.active||value.roleId!=='super-admin')&&await tx.user.count({where:{roleId:'super-admin',active:true}})<=1)throw new HttpError(409,'Minimal satu Super Admin aktif harus dipertahankan.');
    const fields={name:value.name,username:value.username,displayUsername:value.username,email:value.email,workUnit:value.workUnit,roleId:value.roleId,active:value.active,...(before&&before.email!==value.email?{emailVerified:false}:{})};
    const userId=id??randomUUID();
    const after=id?await tx.user.update({where:{id,updatedAt:before!.updatedAt},data:fields,select:userSelect}):await tx.user.create({data:{...fields,id:userId,accounts:{create:{id:randomUUID(),accountId:userId,providerId:'credential',password}}},select:userSelect});
    if(before&&(before.roleId!==after.roleId||before.active!==after.active||before.email!==after.email))await tx.session.deleteMany({where:{userId}});
    await tx.auditLog.create({data:{actorId:actor.id,actorName:actor.name,action:id?'UPDATE':'CREATE',module:'users',entity:userId,before:before?auditJson(before):Prisma.DbNull,after:auditJson(after)}});
    return after;
  },{isolationLevel:'Serializable'});
}
export async function reviewUserRegistration(id:string,status:'APPROVED'|'REJECTED',actor:User){
  if(!['administrator','super-admin'].includes(actor.roleId))throw new HttpError(403,'Persetujuan akun hanya dapat dilakukan Administrator atau Super Admin.');
  return db().$transaction(async tx=>{
    const before=await tx.user.findUnique({where:{id},select:userSelect});
    if(!before)throw new HttpError(404,'Pendaftar tidak ditemukan.');
    if(before.approvalStatus!=='PENDING')throw new HttpError(409,'Pendaftaran ini sudah ditinjau. Muat ulang daftar pengguna.');
    const after=await tx.user.update({where:{id,approvalStatus:'PENDING'},data:{approvalStatus:status,active:status==='APPROVED'},select:userSelect});
    await tx.session.deleteMany({where:{userId:id}});
    await tx.auditLog.create({data:{actorId:actor.id,actorName:actor.name,action:status==='APPROVED'?'APPROVE_REGISTRATION':'REJECT_REGISTRATION',module:'users',entity:id,before:auditJson(before),after:auditJson(after)}});
    return after;
  },{isolationLevel:'Serializable'});
}
export async function listRoles(){return db().role.findMany({orderBy:{name:'asc'}});}
export async function saveRole(id:string,payload:unknown,actor:User){
  if(actor.roleId!=='super-admin')throw new HttpError(403,'Perubahan hak akses memerlukan Super Admin.');
  if(['super-admin','public-viewer'].includes(id))throw new HttpError(422,'Role Super Admin dan Public Viewer merupakan batas akses tetap.');
  const input=z.object({version:z.number().int().positive(),permissions:z.partialRecord(z.enum(permissionModules),z.array(z.enum(['view','manage','approve'])).max(3))}).strict().parse(payload);
  const allowedActions=(key:string)=>key==='validation'?['view','manage','approve']:['dashboard','activity'].includes(key)?['view']:['view','manage'];
  for(const [key,actions] of Object.entries(input.permissions)){
    if(actions.some(a=>!allowedActions(key).includes(a))||(actions.includes('manage')&&!actions.includes('view'))||(actions.includes('approve')&&!actions.includes('manage')))throw new HttpError(422,'Kombinasi izin tidak valid. Kelola memerlukan Lihat, dan Setujui memerlukan Kelola.');
    if(key==='roles'&&actions.length)throw new HttpError(422,'Pengelolaan role hanya untuk Super Admin.');
  }
  return db().$transaction(async tx=>{
    const before=await tx.role.findUnique({where:{id}});if(!before)throw new HttpError(404,'Role tidak ditemukan.');
    const after=await tx.role.update({where:{id,version:input.version},data:{permissions:input.permissions as Permissions,version:{increment:1}}});
    await tx.session.deleteMany({where:{user:{roleId:id}}});
    await tx.auditLog.create({data:{actorId:actor.id,actorName:actor.name,action:'UPDATE_PERMISSIONS',module:'roles',entity:id,before:auditJson(before.permissions),after:auditJson(after.permissions)}});
    return after;
  });
}
const settingsSchema=z.object({name:z.string().trim().min(1).max(80),description:z.string().trim().min(1).max(200),year:z.number().int(),province:z.string().max(10),pageSize:z.union([z.literal(10),z.literal(15),z.literal(25)]),version:z.number().int().positive()}).strict();
export async function saveSettings(payload:unknown,actor:User){
  const value=settingsSchema.parse(payload);
  if(!await db().year.findUnique({where:{year:value.year}}))throw new HttpError(422,'Tahun tidak ada pada master.');
  if(value.province!=='all'&&!await db().region.findFirst({where:{code:value.province,level:'PROV'}}))throw new HttpError(422,'Provinsi tidak tersedia.');
  return db().$transaction(async tx=>{
    const before=await tx.systemSetting.findUnique({where:{id:'general'}});
    const after=await tx.systemSetting.update({where:{id:'general',version:value.version},data:{...value,version:{increment:1}}});
    await tx.auditLog.create({data:{actorId:actor.id,actorName:actor.name,action:'UPDATE',module:'settings',entity:'general',before:auditJson(before),after:auditJson(after)}});return after;
  });
}
export async function activity(query:URLSearchParams,user:User){
  const page=Math.max(1,Number(query.get('page'))||1),size=15;
  const date=(key:string)=>{const value=query.get(key);if(!value)return undefined;if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new HttpError(422,'Format tanggal tidak valid.');const parsed=new Date(`${value}T${key==='end'?'23:59:59.999':'00:00:00.000'}+07:00`);if(!Number.isFinite(parsed.getTime()))throw new HttpError(422,'Tanggal tidak valid.');return parsed;};
  const start=date('start'),end=date('end');if(start&&end&&start>end)throw new HttpError(422,'Tanggal akhir harus setelah tanggal awal.');
  const restricted=!['administrator','super-admin'].includes(user.roleId);
  const q=(query.get('q')||'').slice(0,100);
  const where:Prisma.AuditLogWhereInput={...(restricted?{actorId:user.id}:query.get('actor')?{actorId:query.get('actor')!}:{}),...(query.get('module')?{module:query.get('module')!}:{}),...(query.get('action')?{action:query.get('action')!}:{}),...(start||end?{createdAt:{gte:start,lte:end}}:{}),...(q?{OR:[{actorName:{contains:q}},{entity:{contains:q}},{action:{contains:q}},{module:{contains:q}}]}:{})};
  const [rows,total]=await Promise.all([db().auditLog.findMany({where,orderBy:{createdAt:query.get('sort')==='oldest'?'asc':'desc'},take:size,skip:(page-1)*size}),db().auditLog.count({where})]);
  return {rows,total,page,size,restricted};
}
