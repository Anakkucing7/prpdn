import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { parse } from 'dotenv';

const file=resolve('.env');
let content=readFileSync(file,'utf8');
if(parse(content).DATABASE_URL)throw new Error('DATABASE_URL already configured; existing database configuration was preserved.');
if(existsSync('.local/mysql-init.sql')||existsSync('.local/mysql-admin.cnf'))throw new Error('Existing local MySQL setup found; do not regenerate credentials.');
const password=()=>randomBytes(32).toString('hex');
const root=password(),runtime=password(),migrator=password();
const sql=[
  `ALTER USER 'root'@'localhost' IDENTIFIED BY '${root}';`,
  'CREATE DATABASE prpdn CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;',
  'CREATE DATABASE prpdn_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;',
  `CREATE USER 'prpdn'@'127.0.0.1' IDENTIFIED BY '${runtime}';`,
  `CREATE USER 'prpdn_migrate'@'127.0.0.1' IDENTIFIED BY '${migrator}';`,
  "GRANT SELECT, INSERT, UPDATE, DELETE ON prpdn.* TO 'prpdn'@'127.0.0.1';",
  "GRANT SELECT, INSERT, UPDATE, DELETE ON prpdn_test.* TO 'prpdn'@'127.0.0.1';",
  "GRANT ALL PRIVILEGES ON prpdn.* TO 'prpdn_migrate'@'127.0.0.1';",
  "GRANT ALL PRIVILEGES ON prpdn_test.* TO 'prpdn_migrate'@'127.0.0.1';",
].join('\n');
writeFileSync('.local/mysql-init.sql',sql,{mode:0o600});
writeFileSync('.local/mysql-admin.cnf',`[client]\nhost=127.0.0.1\nport=3308\nuser=root\npassword=${root}\n`,{mode:0o600});
const values={DATABASE_URL:`mysql://prpdn:${runtime}@127.0.0.1:3308/prpdn`,DIRECT_URL:`mysql://prpdn_migrate:${migrator}@127.0.0.1:3308/prpdn`,BOOTSTRAP_ADMIN_EMAIL:'admin@prpdn.local',BOOTSTRAP_ADMIN_PASSWORD:password()};
for(const [key,value] of Object.entries(values)){const line=`${key}="${value}"`;content=new RegExp(`^${key}=.*$`,'m').test(content)?content.replace(new RegExp(`^${key}=.*$`,'m'),line):content+'\n'+line+'\n';}
writeFileSync(file,content,{mode:0o600});
console.log('Local MySQL bootstrap prepared. Credentials are stored only in ignored local files.');
