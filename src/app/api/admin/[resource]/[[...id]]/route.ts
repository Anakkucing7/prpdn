import { authorize, sameOrigin, HttpError } from '@/server/access';
import { body, json, apiError } from '@/server/http';
import { listMasters, mutateMaster } from '@/server/services/masters';
import { listUsers, saveUser, deleteUser, reviewUserRegistration, listRoles, saveRole, saveSettings, activity } from '@/server/services/system';
import { db } from '@/server/db';
import { permissionModules, type PermissionModule } from '@/lib/permissions';

export const runtime='nodejs';
type Context={params:Promise<{resource:string;id?:string[]}>};
async function handle(request:Request,{params}:Context){
  try{
    const {resource,id:parts}=await params;
    const approvalRoute=resource==='users'&&parts?.length===2&&parts[1]==='approval'&&request.method==='PATCH';
    if(!permissionModules.includes(resource as PermissionModule)||parts&&parts.length!==1&&!approvalRoute)throw new HttpError(404,'Layanan tidak ditemukan.');
    const write=request.method!=='GET';
    if(write)sameOrigin(request);
    const user=await authorize(resource as PermissionModule,write?'manage':'view',request.headers);
    const id=parts?.[0];
    if(!write){
      if(id)throw new HttpError(404,'Layanan tidak ditemukan.');
      if(resource==='years'||resource==='indicators')return json(await listMasters(resource));
      if(resource==='users')return json(await listUsers());
      if(resource==='roles')return json(await listRoles());
      if(resource==='activity')return json(await activity(new URL(request.url).searchParams,user));
      if(resource==='settings'){
        const [settings,pendingRegistrations,activeAccounts]=await Promise.all([
          db().systemSetting.findUniqueOrThrow({where:{id:'general'}}),
          db().user.count({where:{approvalStatus:'PENDING'}}),
          db().user.count({where:{active:true,approvalStatus:'APPROVED'}}),
        ]);
        return json({...settings,pendingRegistrations,activeAccounts});
      }
    }else{
      const input=request.method==='DELETE'?undefined:await body(request);
      if(approvalRoute){
        const value=input as {status?:unknown}|null;
        if(!value||!['APPROVED','REJECTED'].includes(String(value.status)))throw new HttpError(422,'Pilih status persetujuan yang valid.');
        return json(await reviewUserRegistration(parts![0],value.status as 'APPROVED'|'REJECTED',user));
      }
      if(resource==='years'||resource==='indicators'){
        if(request.method==='POST'?!!id:!id||!/^\d+$/.test(id))throw new HttpError(400,'Identitas master tidak valid.');
        return json(await mutateMaster(resource,request.method,id?Number(id):undefined,input,user));
      }
      if(resource==='users'&&((request.method==='POST'&&!id)||(request.method==='PATCH'&&id)))return json(await saveUser(id,input,user));
      if(resource==='users'&&request.method==='DELETE'&&id)return json(await deleteUser(id,user));
      if(resource==='roles'&&request.method==='PATCH'&&id)return json(await saveRole(id,input,user));
      if(resource==='settings'&&request.method==='PATCH'&&!id)return json(await saveSettings(input,user));
    }
    throw new HttpError(405,'Operasi tidak tersedia.');
  }catch(error){return apiError(error);}
}
export {handle as GET,handle as POST,handle as PATCH,handle as DELETE};
