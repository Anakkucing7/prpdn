import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import catalog from '@/data/news.json';
import * as news from './news';

const sample = news.newsInputSchema.parse(Object.fromEntries(Object.entries(catalog[0]).filter(([key]) => !['id', 'version'].includes(key))));
test('six curated articles have valid official URLs, real source dates, and unique identities', () => {
  assert.equal(catalog.length, 6);
  for (const article of catalog) assert.equal(news.newsInputSchema.safeParse(Object.fromEntries(Object.entries(article).filter(([key]) => !['id', 'version'].includes(key)))).success, true);
  assert.equal(new Set(catalog.map(article => news.canonicalNewsUrl(article.canonicalUrl))).size, 6);
});
test('news validation rejects unsafe URLs, HTML, invalid/future dates and extra fields', () => {
  for (const canonicalUrl of ['javascript:alert(1)', 'http://www.brin.go.id/news/1/a', 'https://brin.go.id.evil.test/news/1/a', 'https://user:pass@brin.go.id/news/1/a', 'https://127.0.0.1/news/1/a', 'https://brin.go.id:8443/news/1/a']) assert.equal(news.newsInputSchema.safeParse({ ...sample, canonicalUrl }).success, false);
  for (const value of [{ title: '<script>alert(1)</script>' }, { imageUrl: 'https://evil.test/image.jpg' }, { publishedAt: '2026-02-31' }, { publishedAt: '2999-01-01' }, { unknown: 'field' }]) assert.equal(news.newsInputSchema.safeParse({ ...sample, ...value }).success, false);
  assert.equal(news.canonicalNewsUrl('https://brin.go.id/news/123/title/?utm_source=test#fragment'), 'https://www.brin.go.id/news/123/title');
});
test('public selection excludes drafts and handles search, categories and page bounds', () => {
  const articles = catalog as news.NewsArticle[];
  assert.equal(news.selectNews(articles).total, 6);
  assert.equal(news.selectNews(articles, 'RIIM').total, 1);
  assert.equal(news.selectNews(articles, '', 'Riset Kebijakan').total, 2);
  assert.equal(news.selectNews(articles, '', '', 99, 2).page, 3);
  assert.equal(news.selectNews(articles, '', '', 1, 2).articles.length, 2);
  assert.equal(news.selectNews(articles.map(article => ({ ...article, status: 'DRAFT' }))).total, 0);
  assert.equal(news.selectNews(articles).articles[0].featured, true);
});

class MockHttpError extends Error { constructor(public status: number, message: string) { super(message); } }
function loadIsolated(path: string, dependencies: Record<string, unknown>, enabled = true) {
  const moduleBox = { exports: {} as Record<string, (...args: unknown[]) => Promise<unknown>> };
  const source = ts.transpileModule(readFileSync(resolve(path), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(source, { module: moduleBox, exports: moduleBox.exports, require: (name: string) => { if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`); return dependencies[name]; }, process: { env: { PRPDN_NEWS_DATABASE_ENABLED: enabled ? 'true' : 'false' } }, setTimeout, clearTimeout, URL, URLSearchParams, Request, Response, Headers, console });
  return moduleBox.exports;
}
function fixture(unavailable = false) {
  let roleId = 'administrator';
  let state = { source: null as null | Record<string, unknown>, rows: [] as Record<string, unknown>[], audits: [] as unknown[] };
  const matches = (row: Record<string, unknown>, where: Record<string, unknown> = {}) => (!where.status || row.status === where.status) && (!where.category || row.category === where.category) && (!where.OR || JSON.stringify(row).toLowerCase().includes(JSON.stringify(where.OR).match(/"contains":"([^"]+)"/)?.[1].toLowerCase() ?? ''));
  const database = {
    newsSource: {
      findUnique: async () => { if (unavailable) throw new Error('Database unavailable'); return state.source; },
      upsert: async ({ create, update }: { create: Record<string, unknown>; update: Record<string, unknown> }) => (state.source = state.source ? { ...state.source, ...update } : { version: 1, ...create }),
      create: async ({ data }: { data: Record<string, unknown> }) => (state.source = { version: 1, ...data }),
      update: async ({ where, data }: { where: { version: number }; data: Record<string, unknown> }) => { if (state.source?.version !== where.version) throw Object.assign(new Error('conflict'), { code: 'P2025' }); return state.source = { ...state.source, ...data, version: where.version + 1 }; },
    },
    newsArticle: {
      findUnique: async ({ where }: { where: { canonicalUrl: string } }) => state.rows.find(row => row.canonicalUrl === where.canonicalUrl) ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => { if (state.rows.some(row => row.canonicalUrl === data.canonicalUrl)) throw Object.assign(new Error('duplicate'), { code: 'P2002' }); const row = { id: `news-${state.rows.length + 1}`, version: 1, ...data }; state.rows.push(row); return row; },
      update: async ({ where, data }: { where: { id: string; version: number }; data: Record<string, unknown> }) => { const row = state.rows.find(row => row.id === where.id && row.version === where.version); if (!row) throw Object.assign(new Error('conflict'), { code: 'P2025' }); Object.assign(row, data, { version: where.version + 1 }); return row; },
      delete: async ({ where }: { where: { id: string; version: number } }) => { const index = state.rows.findIndex(row => row.id === where.id && row.version === where.version); if (index < 0) throw Object.assign(new Error('conflict'), { code: 'P2025' }); return state.rows.splice(index, 1)[0]; },
      count: async ({ where }: { where?: Record<string, unknown> }) => state.rows.filter(row => matches(row, where)).length,
      findMany: async ({ where, distinct, take = 100, skip = 0 }: { where?: Record<string, unknown>; distinct?: string[]; take?: number; skip?: number }) => { const rows = state.rows.filter(row => matches(row, where)); return distinct ? [...new Set(rows.map(row => row.category))].map(category => ({ category })) : rows.slice(skip, skip + take); },
    },
    auditLog: { create: async ({ data }: { data: unknown }) => { state.audits.push(data); return data; } },
    $transaction: async (run: (tx: unknown) => Promise<unknown>) => { const before = structuredClone(state); try { return await run(database); } catch (error) { state = before; throw error; } },
  };
  const access = { HttpError: MockHttpError, sessionUser: async () => ({ id: 'editor', name: 'Akun uji', roleId }) };
  const service = loadIsolated('src/server/services/news.ts', { 'server-only': {}, '../db': { db: () => database }, '../access': access, '@/lib/news': news, '@/data/news.json': { __esModule: true, default: catalog } });
  return { service, setRole: (role: string) => { roleId = role; }, state: () => state, access };
}
test('server news authorization enforces all six roles and super-admin operations', async () => {
  const mock = fixture();
  for (const role of ['public-viewer', 'internal-viewer', 'operator', 'validator', 'administrator', 'super-admin']) {
    mock.setRole(role);
    if (news.canEditNews(role)) await mock.service.newsActor(); else await assert.rejects(mock.service.newsActor(), (error: unknown) => error instanceof MockHttpError && error.status === 403);
    if (role === 'super-admin') await mock.service.newsActor(undefined, true); else await assert.rejects(mock.service.newsActor(undefined, true));
  }
  assert.equal(mock.state().rows.length, 0);
});
test('mock CMS creates, edits, deduplicates, preserves editorial overrides, unpublishes and deletes', async () => {
  const mock = fixture(), actor = { id: 'editor', name: 'Akun uji' };
  const created = await mock.service.saveNews(undefined, sample, actor) as news.NewsArticle;
  assert.equal(created.version, 1);
  await assert.rejects(mock.service.saveNews(undefined, sample, actor));
  const edited = await mock.service.saveNews(created.id, { ...sample, title: 'Judul editorial yang telah diperiksa', featured: true, version: 1 }, actor) as news.NewsArticle;
  assert.equal(edited.version, 2);
  await assert.rejects(mock.service.saveNews(created.id, { ...sample, version: 1 }, actor));
  await mock.service.importNewsCatalog(actor);
  assert.equal(mock.state().rows.length, 6);
  assert.equal(mock.state().rows.find(row => row.id === created.id)?.title, edited.title);
  assert.equal(mock.state().rows.find(row => row.id === created.id)?.featured, true);
  await mock.service.saveNews(created.id, { ...sample, status: 'DRAFT', version: 2 }, actor);
  await mock.service.importNewsCatalog(actor);
  const published = await mock.service.publicNews() as { total: number };
  assert.equal(published.total, 5);
  const nextPage = await mock.service.publicNews('', '', 2, 2) as { page: number; pages: number; articles: unknown[] };
  assert.equal(nextPage.page, 2);
  assert.equal(nextPage.pages, 3);
  assert.equal(nextPage.articles.length, 2);
  const managed = await mock.service.manageNews(new URLSearchParams('page=99')) as { page: number; pages: number };
  assert.equal(managed.page, managed.pages);
  await assert.rejects(mock.service.deleteNews(created.id, 2, actor));
  await mock.service.deleteNews(created.id, 3, actor);
  assert.equal(mock.state().rows.length, 5);
  assert.ok(mock.state().audits.length >= 5);
});
test('withdrawn/deleted content stays hidden and database outages do not resurrect the catalog', async () => {
  const mock = fixture(), actor = { id: 'editor', name: 'Akun uji' };
  await mock.service.importNewsCatalog(actor);
  for (const article of [...mock.state().rows]) await mock.service.deleteNews(article.id, article.version, actor);
  assert.equal((await mock.service.publicNews() as { total: number }).total, 0);
  const failed = await fixture(true).service.publicNews() as { total: number; notice: string };
  assert.equal(failed.total, 0);
  assert.match(failed.notice, /belum dapat diakses/);
  assert.equal(news.sourceInputSchema.safeParse({ name: 'BRIN', permissionNote: '', version: 1, syncEnabled: true, feedUrl: 'https://evil.test/feed' }).success, false);
});
test('news HTTP routes reject unauthorized deletion/configuration, CSRF and unsupported synchronization', async () => {
  const mock = fixture();
  const route = loadIsolated('src/app/api/admin/news/[[...path]]/route.ts', {
    '@/server/services/news': mock.service, '@/lib/news': news,
    '@/server/access': { HttpError: MockHttpError, sameOrigin: (request: Request) => { if (request.headers.get('origin') !== 'https://prpdn.test') throw new MockHttpError(403, 'Origin rejected'); } },
    '@/server/http': { body: (request: Request) => request.json(), json: (body: unknown, status = 200) => Response.json(body, { status }), apiError: (error: MockHttpError) => Response.json({ error: error.message }, { status: error.status ?? 500 }) },
  });
  const request = (method: string, origin = true) => new Request('https://prpdn.test/api/admin/news/item/?version=1', { method, headers: origin ? { Origin: 'https://prpdn.test' } : {} });
  const context = (path: string) => ({ params: Promise.resolve({ path: [path] }) });
  assert.equal((await route.DELETE(request('DELETE'), context('item')) as Response).status, 403);
  assert.equal((await route.PATCH(request('PATCH'), context('source')) as Response).status, 403);
  assert.equal((await route.POST(request('POST', false), context('catalog')) as Response).status, 403);
  mock.setRole('operator');
  assert.equal((await route.GET(request('GET'), { params: Promise.resolve({}) }) as Response).status, 403);
  mock.setRole('super-admin');
  assert.equal((await route.POST(request('POST'), context('sync')) as Response).status, 409);
  assert.equal(mock.state().rows.length, 0);
});
