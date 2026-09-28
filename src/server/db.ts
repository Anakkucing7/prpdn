import { PrismaClient } from '@/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalDb=globalThis as unknown as { prpdnDb?:PrismaClient };
export function db() {
  if(globalDb.prpdnDb)return globalDb.prpdnDb;
  if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL belum dikonfigurasi.');
  const url=new URL(process.env.DATABASE_URL);
  if(url.protocol!=='mysql:')throw new Error('DATABASE_URL harus menggunakan konektor MySQL.');
  const local=['127.0.0.1','localhost','::1'].includes(url.hostname);
  const adapter=new PrismaMariaDb({host:url.hostname,port:Number(url.port||3306),user:decodeURIComponent(url.username),password:decodeURIComponent(url.password),database:decodeURIComponent(url.pathname.slice(1)),connectionLimit:5,charset:'utf8mb4',...(local?{allowPublicKeyRetrieval:true}:{ssl:{rejectUnauthorized:true}})});
  globalDb.prpdnDb=new PrismaClient({adapter});
  return globalDb.prpdnDb;
}
