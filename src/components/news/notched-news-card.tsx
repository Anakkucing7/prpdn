"use client";
import Image from 'next/image';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { NewsArticle } from '@/lib/news';
import './news.css';

// Visual adaptation of Maud Benaddi's Notched Project Card; no template dependencies.
export function NotchedNewsCard({ article, headingLevel = 3 }: { article: NewsArticle; headingLevel?: 2 | 3 }) {
  const [imageFailed, setImageFailed] = useState(false);
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return <article className="news-card">
    <a href={article.canonicalUrl} target="_blank" rel="noopener noreferrer" className="news-card-link">
      <div className="news-card-cover">
        {imageFailed ? <span className="news-image-empty">Foto belum tersedia</span> : <Image src={article.imageUrl} alt={article.imageAlt} fill unoptimized sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw" loading="lazy" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} />}
        <span className="news-notch" aria-hidden="true"><span className="news-card-arrow"><ArrowUpRight size={24} /></span></span>
      </div>
      <div className="news-card-meta"><span>{article.category}</span><time dateTime={article.publishedAt}>{new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${article.publishedAt}T00:00:00Z`))}</time></div>
      <Heading>{article.title}<span className="sr-only"> — baca sumber BRIN, buka tab baru</span></Heading>
      <p className="news-card-excerpt">{article.excerpt}</p>
    </a>
    <p className="news-credit">{article.attribution}</p>
  </article>;
}
