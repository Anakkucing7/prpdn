import Link from 'next/link';
import { publicNews } from '@/server/services/news';
import { NotchedNewsCard } from '@/components/news/notched-news-card';
import { Button } from '@/components/ui/button';
import '@/components/news/news.css';

export const metadata = { title: 'News · Riset dan Inovasi', description: 'Pilihan berita resmi BRIN tentang riset, kebijakan, inovasi, dan pembangunan Indonesia.' };
export const dynamic = 'force-dynamic';
export default async function NewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const value = (key: string) => typeof query[key] === 'string' ? query[key] as string : '';
  const q = value('q').trim().slice(0, 100), category = value('category').slice(0, 80);
  const page = Math.max(1, Math.min(10000, Math.floor(Number(value('page')) || 1)));
  const data = await publicNews(q, category, page);
  const pageHref = (next: number) => `/news/?${new URLSearchParams({ q, category, page: String(next) })}`;
  return <section className="research-news news-index"><div className="news-container">
    <div className="news-section-heading"><div><h1>News</h1><p>Perkembangan riset dan inovasi dalam konteks kebijakan dan pembangunan. Setiap artikel mengarah ke sumber resmi BRIN.</p></div><Link href="/">Kembali ke beranda</Link></div>
    <form action="/news/" method="GET" className="news-toolbar" role="search">
      <label htmlFor="news-search">Cari berita<input id="news-search" name="q" type="search" defaultValue={q} maxLength={100} placeholder="Judul atau topik riset" /></label>
      <label htmlFor="news-category">Kategori<select id="news-category" name="category" defaultValue={category}><option value="">Semua kategori</option>{[...new Set([...data.categories, ...(category ? [category] : [])])].map(item => <option key={item}>{item}</option>)}</select></label>
      <Button type="submit">Terapkan</Button><Link href="/news/">Atur ulang</Link>
    </form>
    {data.notice && <p className="news-notice" role="status">{data.notice}</p>}
    <p className="news-credit" role="status">{data.total} berita sesuai pencarian · Halaman {data.page} dari {data.pages}</p>
    <div className="news-grid">{data.articles.map(article => <NotchedNewsCard key={article.id} article={article} headingLevel={2} />)}</div>
    {!data.articles.length && <div className="news-empty"><h2>Tidak ada berita yang ditampilkan</h2><p>Coba kata kunci lain, kosongkan kategori, atau periksa kembali ketersediaan layanan.</p></div>}
    <nav className="news-pagination" aria-label="Halaman berita">{data.page > 1 && <Link href={pageHref(data.page - 1)}>← Sebelumnya</Link>}<span aria-current="page">Halaman {data.page} / {data.pages}</span>{data.page < data.pages && <Link href={pageHref(data.page + 1)}>Selanjutnya →</Link>}</nav>
  </div></section>;
}
