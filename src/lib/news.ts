import { z } from 'zod';

export const newsRoles = ['administrator', 'super-admin'];
export const canEditNews = (roleId: string) => newsRoles.includes(roleId);
export const canAdministerNews = (roleId: string) => roleId === 'super-admin';
export const syncUnavailable = 'Sinkronisasi nonaktif: belum ada RSS/API berita BRIN dengan dokumentasi dan izin penggunaan yang terverifikasi. Gunakan CMS manual.';

function officialUrl(value: string, image = false) {
  const url = new URL(value);
  const hosts = image ? ['brin.go.id', 'www.brin.go.id', 'miniox.brin.go.id'] : ['brin.go.id', 'www.brin.go.id'];
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !hosts.includes(url.hostname)) throw new Error('Gunakan URL HTTPS resmi BRIN.');
  if (!image && !/^\/news\/\d+(?:\/[a-z0-9-]+)?\/?$/.test(url.pathname)) throw new Error('Gunakan tautan artikel /news/ resmi BRIN.');
  if (!image) { url.hostname = 'www.brin.go.id'; url.pathname = url.pathname.replace(/\/$/, ''); }
  url.search = ''; url.hash = '';
  return url.href;
}
export const canonicalNewsUrl = (value: string) => officialUrl(value);
const urlField = (image = false) => z.string().max(image ? 1024 : 768).transform((value, ctx) => {
  try { const normalized = officialUrl(value, image); if (normalized.length > (image ? 1024 : 768)) throw new Error('URL too long'); return normalized; }
  catch { ctx.addIssue({ code: 'custom', message: image ? 'Foto harus memakai URL HTTPS dari BRIN atau miniox.brin.go.id.' : 'Masukkan URL artikel berita resmi BRIN.' }); return z.NEVER; }
});
const text = (max: number) => z.string().trim().min(1).max(max).refine(value => !/[<>]/.test(value), 'Gunakan teks biasa, tanpa HTML.');
export const newsInputSchema = z.object({
  canonicalUrl: urlField(), title: text(300), excerpt: text(600), category: text(80),
  imageUrl: urlField(true), imageAlt: text(300), attribution: text(120),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Tanggal publikasi tidak valid.'),
  status: z.enum(['DRAFT', 'PUBLISHED']), featured: z.boolean(),
}).strict().refine(value => value.status !== 'PUBLISHED' || value.publishedAt <= new Date().toISOString().slice(0, 10), { path: ['publishedAt'], message: 'Tanggal berita terbit tidak boleh di masa depan.' });
export type NewsInput = z.infer<typeof newsInputSchema>;
export type NewsArticle = NewsInput & { id: string; version: number };
export const sourceInputSchema = z.object({
  name: text(120), permissionNote: z.string().trim().max(2000), version: z.number().int().positive(),
}).strict();
export function selectNews(articles: NewsArticle[], q = '', category = '', page = 1, pageSize = 9) {
  const published = articles.filter(article => article.status === 'PUBLISHED');
  const filtered = published.filter(article => (!category || article.category === category) && `${article.title} ${article.excerpt}`.toLocaleLowerCase('id').includes(q.toLocaleLowerCase('id')))
    .sort((a, b) => Number(b.featured) - Number(a.featured) || b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.max(1, Math.min(pages, page));
  return { articles: filtered.slice((current - 1) * pageSize, current * pageSize), total: filtered.length, page: current, pages,
    categories: [...new Set(published.map(article => article.category))].sort() };
}
