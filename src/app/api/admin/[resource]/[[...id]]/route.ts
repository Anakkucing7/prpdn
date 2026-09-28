import { authorize, sameOrigin, HttpError } from '@/server/access';
import { body, json, apiError } from '@/server/http';
import { listMasters, mutateMaster } from '@/server/services/masters';
import { listUsers, saveUser, listRoles, saveRole, saveSettings, activity } from '@/server/services/system';
import { db } from '@/server/db';
import { permissionModules, type PermissionModule } from '@/lib/permissions';

export const runtime='nodejs';
type Context={params:Promise<{resource:string;id?:string[]}>};
async function handle(request:Request,{params}:Context){
  try{
    const {resource,id:parts}=await params;
    if(!permissionModules.includes(resource as PermissionModule)||parts&&parts.length!==1)throw new HttpError(404,'Layanan tidak ditemukan.');
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
      if(resource==='settings')return json(await db().systemSetting.findUniqueOrThrow({where:{id:'general'}}));
    }else{
      const input=await body(request);
      if(resource==='years'||resource==='indicators'){
        if(request.method==='POST'?!!id:!id||!/^\d+$/.test(id))throw new HttpError(400,'Identitas master tidak valid.');
        return json(await mutateMaster(resource,request.method,id?Number(id):undefined,input,user));
      }
      if(resource==='users'&&((request.method==='POST'&&!id)||(request.method==='PATCH'&&id)))return json(await saveUser(id,input,user));
      if(resource==='roles'&&request.method==='PATCH'&&id)return json(await saveRole(id,input,user));
      if(resource==='settings'&&request.method==='PATCH'&&!id)return json(await saveSettings(input,user));
    }
    throw new HttpError(405,'Operasi tidak tersedia.');
  }catch(error){return apiError(error);}
}
export {handle as GET,handle as POST,handle as PATCH,handle as DELETE};
