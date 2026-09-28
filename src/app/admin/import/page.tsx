import ImportPage from '@/components/data/import-page';
import {authorize,HttpError} from '@/server/access';
import {importLimits} from '@/server/services/import-files';
import {redirect} from 'next/navigation';
import {ValidationWorkspace} from '@/components/data/validation-workspace';
import '@/components/data/data-pages.css';
import '@/components/data/workflow-pages.css';
export const metadata = { title: 'Import Data' };
export default async function Page({searchParams}:{searchParams:Promise<{batch?:string}>}) {
 let actor;try{actor=await authorize('import');}catch(e){if(e instanceof HttpError&&e.status===401)redirect('/login?next=/admin/import/');if(e instanceof HttpError&&e.status===403)return <p role="alert">Anda tidak memiliki izin Import Data.</p>;throw e;}
 const {batch}=await searchParams;
 return batch?<ValidationWorkspace id={batch} review={false} approve={false} workspace="import"/>:<ImportPage limits={importLimits()} sql={actor.roleId==='super-admin'}/>;
}
