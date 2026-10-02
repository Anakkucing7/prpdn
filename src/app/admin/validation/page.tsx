import ValidationPage from '@/components/data/validation-page';
import {authorize,HttpError} from '@/server/access';
import {permitted,type Permissions} from '@/lib/permissions';
import {redirect} from 'next/navigation';
import '@/components/data/data-pages.css';
import '@/components/data/workflow-pages.css';
export const metadata = { title: 'Validasi Data' };
export default async function Page({searchParams}:{searchParams:Promise<{batch?:string}>}) {
 let actor;try{actor=await authorize('validation');}catch(e){if(e instanceof HttpError&&e.status===401)redirect('/login?next=/admin/validation/');if(e instanceof HttpError&&e.status===403)return <p role="alert">Anda tidak memiliki izin Validasi Data.</p>;throw e;}
 const {batch}=await searchParams;
 return <ValidationPage batchId={batch} review={actor.roleId==='super-admin'||permitted(actor.role.permissions as Permissions,'validation','manage')} approve={actor.roleId==='super-admin'||permitted(actor.role.permissions as Permissions,'validation','approve')}/>;
}
