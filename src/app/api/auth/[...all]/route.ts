import { auth } from '@/server/auth';
import { apiError } from '@/server/http';
export const runtime='nodejs';
async function handler(request:Request){try{const url=new URL(request.url);url.pathname=url.pathname.replace(/\/$/,'');return await auth().handler(new Request(url,request));}catch(error){return apiError(error);}}
export { handler as GET, handler as POST };
