import { newsActor, manageNews, saveNews, importNewsCatalog, deleteNews, saveNewsSource } from '@/server/services/news';
import { apiError, body, json } from '@/server/http';
import { HttpError, sameOrigin } from '@/server/access';
import { syncUnavailable } from '@/lib/news';

export const runtime = 'nodejs';
type Context = { params: Promise<{ path?: string[] }> };
async function handle(request: Request, { params }: Context) {
  try {
    const parts = (await params).path ?? [];
    if (parts.length > 1) throw new HttpError(404, 'Layanan berita tidak ditemukan.');
    const action = parts[0];
    const superOnly = request.method === 'DELETE' || action === 'source' || action === 'sync';
    const actor = await newsActor(request.headers, superOnly);
    if (request.method !== 'GET') sameOrigin(request);
    if (action === 'sync' && request.method === 'POST') return json({ error: syncUnavailable }, 409);
    if (process.env.PRPDN_NEWS_DATABASE_ENABLED !== 'true') throw new HttpError(503, 'CMS belum diaktifkan. Tinjau migrasi News, terapkan secara terpisah, lalu aktifkan PRPDN_NEWS_DATABASE_ENABLED.');
    if (!action && request.method === 'GET') return json({ ...await manageNews(new URL(request.url).searchParams), canDelete: actor.roleId === 'super-admin', canConfigure: actor.roleId === 'super-admin', syncAvailable: false });
    if (action === 'catalog' && request.method === 'POST') return json(await importNewsCatalog(actor));
    if (action === 'source' && request.method === 'PATCH') return json(await saveNewsSource(await body(request), actor));
    if (!action && request.method === 'POST') return json(await saveNews(undefined, await body(request), actor), 201);
    if (action && /^[a-zA-Z0-9_-]{1,191}$/.test(action) && !['catalog', 'source', 'sync'].includes(action)) {
      if (request.method === 'PATCH') return json(await saveNews(action, await body(request), actor));
      if (request.method === 'DELETE') return json(await deleteNews(action, Number(new URL(request.url).searchParams.get('version')), actor));
    }
    throw new HttpError(405, 'Operasi berita tidak tersedia.');
  } catch (error) { return apiError(error); }
}
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
