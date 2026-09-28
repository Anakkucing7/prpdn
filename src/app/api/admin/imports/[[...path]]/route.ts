import {authorize,sameOrigin,HttpError} from '@/server/access';
import {apiError,body,json} from '@/server/http';
import {parseUpload,importLimits} from '@/server/services/import-files';
import {stageFile,batchDetail,batchHistory,reviewRow,finishBatch} from '@/server/services/imports';
import {db} from '@/server/db';
import {permitted,type Permissions} from '@/lib/permissions';
export const runtime='nodejs';
export const maxDuration=180;
type Context={params:Promise<{path?:string[]}>};
async function handle(request:Request,{params}:Context){
 let actor:Awaited<ReturnType<typeof authorize>>|undefined;
 try{
  const path=(await params).path??[];
  if(path.length>2)throw new HttpError(404,'Layanan tidak ditemukan.');
  const action=path[1],write=request.method!=='GET';
  if(write)sameOrigin(request);
  actor=await authorize(action==='review'||action==='finish'?'validation':new URL(request.url).searchParams.get('workspace')==='validation'?'validation':'import',action==='finish'?'approve':write?'manage':'view',request.headers);
  if(request.method==='GET'&&path[0]==='config')return json({...importLimits(),sql:actor.roleId==='super-admin',review:permitted(actor.role.permissions as Permissions,'validation','manage'),approve:permitted(actor.role.permissions as Permissions,'validation','approve')});
  if(request.method==='POST'&&path[0]==='upload'){
   const parsed=await parseUpload(request,actor.roleId==='super-admin');
   if(new URL(request.url).searchParams.get('stage')!=='true')return json(parsed);
   let mapping:unknown;try{mapping=JSON.parse(request.headers.get('x-column-mapping')||'{}');}catch{throw new HttpError(422,'Pemetaan kolom tidak valid.');}
   return json(await stageFile(parsed,new URL(request.url).searchParams.get('dataset'),mapping,actor),201);
  }
  if(request.method==='GET'&&!path.length)return json(await batchHistory(actor,Math.max(1,Math.min(100000,Number(new URL(request.url).searchParams.get('page'))||1))));
  if(request.method==='GET'&&path.length===1)return json(await batchDetail(path[0],actor,new URL(request.url).searchParams));
  if(request.method==='PATCH'&&action==='review')return json(await reviewRow(path[0],await body(request),actor));
  if(request.method==='POST'&&action==='finish')return json(await finishBatch(path[0],await body(request),actor));
  throw new HttpError(405,'Operasi tidak tersedia.');
 }catch(error){
  if(actor&&request.method!=='GET')await db().auditLog.create({data:{actorId:actor.id,actorName:actor.name,action:'IMPORT_ACTION_REJECTED',module:'import',entity:'request',result:'Gagal',after:{reason:error instanceof HttpError?error.message:'Validasi atau transaksi gagal'}}}).catch(()=>{});
  return apiError(error);
 }
}
export {handle as GET,handle as POST,handle as PATCH};
