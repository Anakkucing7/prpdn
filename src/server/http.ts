import { ZodError } from 'zod';
import { Prisma } from '@/generated/prisma/client';
import { HttpError } from './access';
export function json(value:unknown,status=200){return Response.json(value,{status,headers:{'Cache-Control':'no-store'}});}
export function apiError(error:unknown){
  if(error instanceof HttpError)return json({error:error.message},error.status);
  if(error instanceof ZodError)return json({error:'Periksa isian formulir.',fields:error.flatten().fieldErrors},422);
  if(error instanceof Prisma.PrismaClientKnownRequestError){
    if(error.code==='P2002')return json({error:'Data dengan identitas yang sama sudah ada.'},409);
    if(error.code==='P2003')return json({error:'Data masih dirujuk oleh record lain dan tidak dapat dihapus.'},409);
    if(['P2025','P2034'].includes(error.code))return json({error:'Data berubah atau tidak ditemukan. Muat ulang sebelum mencoba kembali.'},409);
  }
  // Do not expose SQL, credentials, or request payloads in responses/logs.
const e = error as {
  name?: unknown;
  code?: unknown;
  message?: unknown;
  cause?: {
    name?: unknown;
    code?: unknown;
    message?: unknown;
  };
};

console.error('PRPDN request failed:', {
  name: typeof e?.name === 'string' ? e.name : 'UnknownError',
  code: typeof e?.code === 'string' ? e.code : null,
  causeName: typeof e?.cause?.name === 'string' ? e.cause.name : null,
  causeCode: typeof e?.cause?.code === 'string' ? e.cause.code : null,
  message:
    typeof e?.message === 'string'
      ? e.message.slice(0, 250)
      : null,
});
  return json({error:'Layanan data belum dapat diakses. Periksa koneksi database atau coba kembali.'},503);
}
export async function body(request:Request){
  if(!request.headers.get('content-type')?.includes('application/json'))throw new HttpError(415,'Gunakan JSON untuk permintaan ini.');
  const limit=1024*1024;
  if(Number(request.headers.get('content-length'))>limit)throw new HttpError(413,'Payload formulir terlalu besar.');
  const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Payload kosong.');
  const chunks:Uint8Array[]=[];let size=0;
  try{while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;if(size>limit){await reader.cancel();throw new HttpError(413,'Payload formulir terlalu besar.');}chunks.push(chunk.value);}}finally{reader.releaseLock();}
  const text=Buffer.concat(chunks).toString('utf8');
  try{return JSON.parse(text) as unknown;}catch{throw new HttpError(400,'JSON tidak valid.');}
}
