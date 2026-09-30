import { PrismaClient } from '@/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: decodeURIComponent(url.pathname.slice(1)),

  connectionLimit: 1,
  minimumIdle: 0,
  connectTimeout: 5000,
  acquireTimeout: 20000,
  idleTimeout: 30,

  charset: 'utf8mb4',

  ...(local
    ? { allowPublicKeyRetrieval: true }
    : { ssl: { rejectUnauthorized: true } }),
});
