import 'server-only';
import {mkdtemp,open,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {Worker} from 'node:worker_threads';
import {HttpError} from '../access';
import {sqlColumns,sqlHeader,sqlPrefix,type TransferRow} from '@/lib/data-transfer';

export function importLimits(){
 const positive=(name:string,fallback:number)=>{const n=Number(process.env[name]||fallback);if(!Number.isSafeInteger(n)||n<1)throw new Error(`Invalid ${name}`);return n;};
 return {bytes:positive('IMPORT_MAX_BYTES',104857600),rows:positive('IMPORT_MAX_ROWS',100000)};
}
export type ParsedFile={filename:string;size:number;sha256:string;sql:boolean;sheets:string[];sheet?:string;columns?:string[];rows?:{rowNumber:number;data:TransferRow}[];total?:number};
export async function parseUpload(request:Request,superAdmin:boolean):Promise<ParsedFile>{
 const filename=decodeURIComponent(request.headers.get('x-file-name')||'').replaceAll('\\','/').split('/').pop()||'';
 const extension=filename.split('.').pop()?.toLowerCase();
 if(filename.length>191||!extension||!['xlsx','xls','csv','sql'].includes(extension))throw new HttpError(415,'Pilih berkas .xlsx, .xls, .csv, atau SQL format PRPDN.');
 if(extension==='sql'&&!superAdmin)throw new HttpError(403,'Import SQL hanya tersedia untuk Super Admin.');
 const limits=importLimits();
 if(Number(request.headers.get('content-length'))>limits.bytes)throw new HttpError(413,'Ukuran file melebihi batas upload server.');
 if(!request.body)throw new HttpError(400,'Berkas kosong.');
 const directory=await mkdtemp(join(tmpdir(),'prpdn-upload-'));
 const path=join(directory,`upload.${extension}`),file=await open(path,'wx');
 const hash=createHash('sha256');let size=0;
 try{
  const reader=request.body.getReader();
  try{while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;if(size>limits.bytes){await reader.cancel();throw new HttpError(413,'Ukuran file melebihi batas upload server.');}hash.update(chunk.value);await file.writeFile(chunk.value);}}finally{reader.releaseLock();await file.close();}
  if(!size)throw new HttpError(400,'Berkas kosong.');
  const url=new URL(request.url),sheet=url.searchParams.get('sheet')||undefined;
  const result=await new Promise<Omit<ParsedFile,'filename'|'size'|'sha256'|'sql'>>((resolve,reject)=>{
   const worker=new Worker(join(process.cwd(),'scripts/parse-import.cjs'),{workerData:{path,extension,sheet,preview:url.searchParams.get('stage')!=='true',maxRows:limits.rows,sqlColumns,sqlHeader,sqlPrefix},resourceLimits:{maxOldGenerationSizeMb:512}});
   const timer=setTimeout(()=>{void worker.terminate();reject(new HttpError(422,'Pembacaan file melewati batas waktu. Bagi file menjadi sheet lebih kecil.'));},60000);
   worker.once('message',result=>{clearTimeout(timer);void worker.terminate();if(result.error)reject(new HttpError(422,result.error));else resolve(result);});
   worker.once('error',()=>{clearTimeout(timer);reject(new HttpError(422,'Berkas tidak dapat dibaca dalam batas memori server.'));});
   worker.once('exit',code=>{clearTimeout(timer);if(code!==0)reject(new HttpError(422,'Pembacaan berkas dihentikan.'));});
  });
  return {...result,filename,size,sha256:hash.digest('hex'),sql:extension==='sql'};
 }finally{await file.close().catch(()=>{});if(resolve(directory).startsWith(resolve(tmpdir())+sep)&&directory.includes('prpdn-upload-'))await rm(directory,{recursive:true,force:true});}
}
