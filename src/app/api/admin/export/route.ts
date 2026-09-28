import {sessionUser} from '@/server/access';
import {apiError} from '@/server/http';
import {exportData} from '@/server/services/exports';
export const runtime='nodejs';
export async function GET(request:Request){try{
 const actor=await sessionUser(request.headers);
 const {buffer,mime,filename}=await exportData(new URL(request.url).searchParams,actor);
 return new Response(new Uint8Array(buffer),{headers:{'Content-Type':mime,'Content-Disposition':`attachment; filename="${filename}"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}catch(error){return apiError(error);}}
