import 'server-only';
import { headers } from 'next/headers';
import { auth } from './auth';
import { db } from './db';
import { permitted, type Permission, type PermissionModule, type Permissions } from '@/lib/permissions';
export class HttpError extends Error { constructor(public status:number,message:string){super(message);} }
export async function sessionUser(requestHeaders?:Headers){
  const session=await auth().api.getSession({headers:requestHeaders??await headers()});
  if(!session)throw new HttpError(401,'Silakan masuk untuk melanjutkan.');
  const user=await db().user.findUnique({where:{id:session.user.id},include:{role:true}});
  if(!user?.active||user.approvalStatus!=='APPROVED')throw new HttpError(401,'Akun belum aktif atau belum disetujui.');
  return user;
}
export async function authorize(module:PermissionModule,permission:Permission='view',requestHeaders?:Headers){
  const user=await sessionUser(requestHeaders);
  if(!permitted(user.role.permissions as Permissions,module,permission))throw new HttpError(403,'Anda tidak memiliki izin untuk tindakan ini.');
  return user;
}
export function sameOrigin(request:Request){
  const origin=request.headers.get('origin');
  if(!origin||origin!==new URL(process.env.BETTER_AUTH_URL!).origin||request.headers.get('sec-fetch-site')==='cross-site')throw new HttpError(403,'Permintaan lintas situs ditolak.');
}
