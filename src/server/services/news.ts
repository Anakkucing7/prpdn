import 'server-only';
import { db } from '../db';
import { HttpError, sessionUser } from '../access';
import { canEditNews, canAdministerNews, newsInputSchema, sourceInputSchema, selectNews, type NewsArticle, type NewsInput } from '@/lib/news';
import catalog from '@/data/news.json';
import type { NewsArticle as StoredArticle } from '@/generated/prisma/client';

const sourceDefaults = { id: 'brin', name: 'Badan Riset dan Inovasi Nasional', homepageUrl: 'https://www.brin.go.id/news', permissionNote: 'Belum ada RSS/API resmi dengan izin penggunaan yang terverifikasi.' };
const serialize = (article: StoredArticle): NewsArticle => ({ id: article.id, canonicalUrl: article.canonicalUrl, title: article.title, excerpt: article.excerpt, category: article.category, imageUrl: article.imageUrl, imageAlt: article.imageAlt, attribution: article.attribution, publishedAt: article.publishedAt.toISOString().slice(0, 10), status: article.status as NewsInput['status'], featured: article.featured, version: article.version });
export async function newsActor(requestHeaders?: Headers, superOnly = false) {
  const actor = await sessionUser(requestHeaders);
  if (!(superOnly ? canAdministerNews(actor.roleId) : canEditNews(actor.roleId))) throw new HttpError(403, 'Anda tidak memiliki izin untuk tindakan berita ini.');
  return actor;
}
export async function publicNews(q = '', category = '', page = 1, pageSize = 9) {
  if (process.env.PRPDN_NEWS_DATABASE_ENABLED !== 'true') return { ...selectNews(catalog as NewsArticle[], q, category, page, pageSize), notice: 'Pilihan berita resmi BRIN yang dikurasi. Artikel lengkap dan foto tersedia pada sumber asli.' };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const read = async () => {
    const source = await db().newsSource.findUnique({ where: { id: 'brin' } });
    if (!source?.catalogInitialized) return { ...selectNews(catalog as NewsArticle[], q, category, page, pageSize), notice: 'Pilihan berita resmi BRIN yang dikurasi. Artikel lengkap tersedia pada sumber asli.' };
    const where = { status: 'PUBLISHED', ...(category ? { category } : {}), ...(q ? { OR: [{ title: { contains: q } }, { excerpt: { contains: q } }] } : {}) };
    const [total, categories] = await Promise.all([db().newsArticle.count({ where }), db().newsArticle.findMany({ where: { status: 'PUBLISHED' }, distinct: ['category'], select: { category: true } })]);
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const current = Math.max(1, Math.min(pages, page));
    const rows = await db().newsArticle.findMany({ where, orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }, { id: 'asc' }], take: pageSize, skip: (current - 1) * pageSize });
    return { articles: rows.map(serialize), total, page: current, pages, categories: categories.map(row => row.category).sort(), notice: '' };
  };
  try {
    return await Promise.race([read(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('News timeout')), 2000); })]);
  } catch {
    return { ...selectNews([], q, category, page, pageSize), notice: 'CMS berita belum dapat diakses. Publikasi tidak ditampilkan sementara untuk menjaga keputusan editorial. Silakan coba lagi.' };
  } finally { clearTimeout(timer); }
}
export async function manageNews(query: URLSearchParams) {
  const page = Math.max(1, Math.min(10000, Math.floor(Number(query.get('page')) || 1)));
  const q = (query.get('q') || '').slice(0, 100);
  const status = query.get('status');
  const where = { ...(status === 'DRAFT' || status === 'PUBLISHED' ? { status } : {}), ...(q ? { title: { contains: q } } : {}) };
  const [total, source] = await Promise.all([db().newsArticle.count({ where }), db().newsSource.findUnique({ where: { id: 'brin' } })]);
  const current = Math.min(page, Math.max(1, Math.ceil(total / 12)));
  const rows = await db().newsArticle.findMany({ where, take: 12, skip: (current - 1) * 12, orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }] });
  return { rows: rows.map(serialize), total, page: current, pages: Math.max(1, Math.ceil(total / 12)), source: source ?? { ...sourceDefaults, version: 1, catalogInitialized: false, syncEnabled: false, feedUrl: null } };
}
type Editor = { id: string; name: string };
export async function saveNews(id: string | undefined, payload: unknown, actor: Editor) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new HttpError(422, 'Data artikel tidak valid.');
  const { version, ...draft } = payload as Record<string, unknown>;
  const value = newsInputSchema.parse(draft);
  if (id && (!Number.isInteger(version) || Number(version) < 1)) throw new HttpError(422, 'Versi artikel wajib diisi.');
  return db().$transaction(async tx => {
    await tx.newsSource.upsert({ where: { id: 'brin' }, create: { ...sourceDefaults, catalogInitialized: true }, update: { catalogInitialized: true } });
    const data = { ...value, publishedAt: new Date(`${value.publishedAt}T00:00:00Z`), editorId: actor.id, editorialOverride: true };
    const saved = id ? await tx.newsArticle.update({ where: { id, version: Number(version) }, data: { ...data, version: { increment: 1 } } }) : await tx.newsArticle.create({ data });
    await tx.auditLog.create({ data: { actorId: actor.id, actorName: actor.name, action: id ? 'UPDATE_NEWS' : 'CREATE_NEWS', module: 'news', entity: saved.id, after: { status: saved.status, featured: saved.featured, canonicalUrl: saved.canonicalUrl } } });
    return serialize(saved);
  });
}
export async function importNewsCatalog(actor: Editor) {
  return db().$transaction(async tx => {
    await tx.newsSource.upsert({ where: { id: 'brin' }, create: { ...sourceDefaults, catalogInitialized: true }, update: { catalogInitialized: true } });
    let added = 0;
    for (const entry of catalog) {
      const draft = Object.fromEntries(Object.entries(entry).filter(([key]) => !['id', 'version'].includes(key)));
      const value = newsInputSchema.parse(draft);
      const exists = await tx.newsArticle.findUnique({ where: { canonicalUrl: value.canonicalUrl }, select: { id: true } });
      if (!exists) { await tx.newsArticle.create({ data: { ...value, publishedAt: new Date(`${value.publishedAt}T00:00:00Z`), editorId: actor.id } }); added++; }
    }
    await tx.auditLog.create({ data: { actorId: actor.id, actorName: actor.name, action: 'IMPORT_NEWS_CATALOG', module: 'news', entity: 'brin', after: { added } } });
    return { added };
  });
}
export async function deleteNews(id: string, version: number, actor: Editor) {
  if (!Number.isInteger(version) || version < 1) throw new HttpError(422, 'Versi artikel tidak valid.');
  return db().$transaction(async tx => {
    const deleted = await tx.newsArticle.delete({ where: { id, version } });
    await tx.auditLog.create({ data: { actorId: actor.id, actorName: actor.name, action: 'DELETE_NEWS', module: 'news', entity: id, before: { title: deleted.title, canonicalUrl: deleted.canonicalUrl } } });
    return { id };
  });
}
export async function saveNewsSource(payload: unknown, actor: Editor) {
  const value = sourceInputSchema.parse(payload);
  return db().$transaction(async tx => {
    const existing = await tx.newsSource.findUnique({ where: { id: 'brin' } });
    const source = existing ? await tx.newsSource.update({ where: { id: 'brin', version: value.version }, data: { name: value.name, permissionNote: value.permissionNote, version: { increment: 1 } } }) : await tx.newsSource.create({ data: { ...sourceDefaults, name: value.name, permissionNote: value.permissionNote } });
    await tx.auditLog.create({ data: { actorId: actor.id, actorName: actor.name, action: 'UPDATE_NEWS_SOURCE', module: 'news', entity: 'brin' } });
    return source;
  });
}
