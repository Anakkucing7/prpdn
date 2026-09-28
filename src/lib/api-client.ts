export class RequestError extends Error {
  constructor(message:string,public fields:Record<string,string[]>={},public status=0){super(message);}
}
export async function api<T>(path:string,method='GET',value?:unknown):Promise<T>{
  const response=await fetch(path,{method,credentials:'same-origin',cache:'no-store',headers:value instanceof FormData?undefined:{'Content-Type':'application/json'},body:value===undefined?undefined:value instanceof FormData?value:JSON.stringify(value)});
  const data=await response.json();
  if(!response.ok)throw new RequestError(data.error||data.message||'Permintaan gagal. Silakan coba kembali.',data.fields,response.status);
  return data as T;
}
