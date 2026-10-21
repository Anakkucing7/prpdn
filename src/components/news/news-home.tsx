import Link from 'next/link';
import { connection } from 'next/server';
import { ArrowRight } from 'lucide-react';
import { publicNews } from '@/server/services/news';
import { NotchedNewsCard } from './notched-news-card';
import './news.css';

export async function NewsHome() {
  await connection();
  const data = await publicNews('', '', 1, 6);
  return <section className="research-news" id="news" aria-labelledby="news-home-title"><div className="news-container">
    <div className="news-section-heading"><div><h2 id="news-home-title">Riset yang membentuk masa depan.</h2><p>Berita dan perspektif dari Badan Riset dan Inovasi Nasional. Ringkasan editorial PRPDN, dengan tautan ke publikasi asli.</p></div><Link href="/news/">Semua News <ArrowRight size={18} aria-hidden="true" /></Link></div>
    {data.notice && <p className="news-notice" role="status">{data.notice}</p>}
    <div className="news-grid">{data.articles.map(article => <NotchedNewsCard key={article.id} article={article} />)}</div>
    {!data.articles.length && <p className="news-empty">Belum ada berita yang dapat ditampilkan.</p>}
  </div></section>;
}
