import { redirect } from 'next/navigation';
import { newsActor } from '@/server/services/news';
import { HttpError } from '@/server/access';
import NewsManager from '@/components/news/news-manager';
export const metadata = { title: 'News CMS' };
export const dynamic = 'force-dynamic';
export default async function Page() {
  try { await newsActor(); }
  catch (error) {
    if (error instanceof HttpError && error.status === 401) redirect('/login/?next=%2Fadmin%2Fnews%2F');
    if (error instanceof HttpError && error.status === 403) return <p role="alert">News CMS hanya tersedia bagi Administrator dan Super Admin.</p>;
    throw error;
  }
  return <NewsManager />;
}
