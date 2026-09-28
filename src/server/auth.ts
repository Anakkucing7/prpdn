import 'server-only';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { username } from 'better-auth/plugins';
import { APIError } from 'better-auth/api';
import { db } from './db';

function createAuth() {
  const secret=process.env.BETTER_AUTH_SECRET;
  const baseURL=process.env.BETTER_AUTH_URL;
  if(!secret||secret.length<32||!baseURL)throw new Error('Konfigurasi autentikasi belum lengkap.');
  return betterAuth({
    appName:'PRPDN', secret, baseURL, trustedOrigins:[new URL(baseURL).origin],
    database:prismaAdapter(db(),{provider:'mysql'}),
    emailAndPassword:{enabled:true,minPasswordLength:12,maxPasswordLength:128,autoSignIn:false},
    session:{expiresIn:60*60*8,updateAge:60*30,cookieCache:{enabled:false}},
    user:{additionalFields:{roleId:{type:'string',defaultValue:'public-viewer',input:false},active:{type:'boolean',defaultValue:true,input:false},workUnit:{type:'string',defaultValue:'',input:false}}},
    rateLimit:{enabled:true,storage:'database',window:60,max:100,customRules:{'/sign-in/email':{window:60,max:5},'/sign-in/username':{window:60,max:5},'/sign-up/email':{window:3600,max:5}}},
    plugins:[username({minUsernameLength:3,maxUsernameLength:40,usernameValidator:value=>/^[a-zA-Z0-9._-]+$/.test(value)})],
    databaseHooks:{session:{create:{
      before:async session=>{const user=await db().user.findUnique({where:{id:session.userId},select:{active:true}});if(!user?.active)throw new APIError('UNAUTHORIZED',{message:'Akun tidak aktif.'});return {data:session};},
      after:async session=>{await db().$transaction(async tx=>{const user=await tx.user.update({where:{id:session.userId},data:{lastLogin:new Date()}});await tx.auditLog.create({data:{actorId:user.id,actorName:user.name,action:'LOGIN',module:'auth',entity:user.id}});});},
    }}} ,
  });
}
let instance:ReturnType<typeof createAuth>|undefined;
export function auth(){return instance??=createAuth();}
