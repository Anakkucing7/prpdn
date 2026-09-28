import { auth } from '@/server/auth';
import { apiError } from '@/server/http';
export const runtime='nodejs';
async function handler(request:Request){try{return await auth().handler(request);}catch(error){return apiError(error);}}
export { handler as GET, handler as POST };
