import AuthDemo from '@/components/public/auth-demo';
import { db } from '@/server/db';
export const metadata = { title: 'Daftar' };
export const dynamic='force-dynamic';
export default async function Register() {
  const settings=await db().systemSetting.findUnique({where:{id:'general'},select:{publicRegistrationOpen:true}});
  return <AuthDemo registrationOpen={settings?.publicRegistrationOpen??false} />;
}
