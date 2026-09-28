import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { db } from '../src/server/db';

const prisma=db();
async function bootstrap(){
  const email=process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password=process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if(!email||!password||password.length<12)throw new Error('Set BOOTSTRAP_ADMIN_EMAIL and a password of at least 12 characters in .env.');
  if(await prisma.user.count({where:{roleId:'super-admin'}}))throw new Error('A Super Admin already exists. Bootstrap will not overwrite or elevate an existing account.');
  const passwordHash=await hashPassword(password);
  await prisma.$transaction(async tx=>{
    const id=randomUUID();
    const user=await tx.user.create({data:{id,email,name:process.env.BOOTSTRAP_ADMIN_NAME||'Administrator PRPDN',username:'superadmin',displayUsername:'superadmin',roleId:'super-admin',emailVerified:false,accounts:{create:{id:randomUUID(),accountId:id,providerId:'credential',password:passwordHash}}}});
    await tx.auditLog.create({data:{actorId:id,actorName:user.name,action:'BOOTSTRAP',module:'users',entity:id}});
  });
  console.log('Initial Super Admin created. Credentials remain in the ignored .env file.');
}
bootstrap().finally(()=>prisma.$disconnect());
