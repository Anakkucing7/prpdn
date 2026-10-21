"use client";
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/page-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SystemConfirm } from '@/components/data/system-shared';
import { api, RequestError } from '@/lib/api-client';
import { newsInputSchema, syncUnavailable, type NewsArticle, type NewsInput } from '@/lib/news';
import { NotchedNewsCard } from './notched-news-card';
import './news.css';

type Source = { name: string; permissionNote: string; version: number; catalogInitialized: boolean; homepageUrl: string; feedUrl: string | null; syncEnabled: boolean };
type ManagementData = { rows: NewsArticle[]; total: number; page: number; pages: number; source: Source; canDelete: boolean; canConfigure: boolean; syncAvailable: boolean };
const emptyDraft: NewsInput = { title: '', excerpt: '', canonicalUrl: '', category: 'Riset Kebijakan', imageUrl: '', imageAlt: '', attribution: 'Humas BRIN · Foto: BRIN', publishedAt: '', status: 'DRAFT', featured: false };
const fields = [
  ['title', 'Judul artikel', 'text', 300], ['canonicalUrl', 'URL artikel resmi BRIN', 'url', 768],
  ['category', 'Kategori editorial', 'text', 80], ['publishedAt', 'Tanggal publikasi pada sumber asli', 'date', 10],
  ['imageUrl', 'URL foto resmi BRIN', 'url', 1024], ['imageAlt', 'Deskripsi foto untuk pembaca layar', 'text', 300],
  ['attribution', 'Atribusi sumber dan foto', 'text', 120],
] as const;

export default function NewsManager() {
  const [data, setData] = useState<ManagementData | null>(null);
  const [query, setQuery] = useState({ q: '', status: '', page: 1 });
  const [search, setSearch] = useState(''), [status, setStatus] = useState('');
  const [reload, setReload] = useState(0), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [message, setMessage] = useState('');
  const [editing, setEditing] = useState<NewsArticle | 'new' | null>(null);
  const [draft, setDraft] = useState<NewsInput>(emptyDraft), [errors, setErrors] = useState<Record<string, string[]>>({});
  const [preview, setPreview] = useState<NewsArticle | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; note: string; destructive?: boolean; run: () => Promise<unknown> } | null>(null);
  const [sourceDraft, setSourceDraft] = useState({ name: '', permissionNote: '', version: 1 });
  useEffect(() => {
    let current = true;
    api<ManagementData>(`/api/admin/news/?${new URLSearchParams({ q: query.q, status: query.status, page: String(query.page) })}`)
      .then(value => { if (current) { setData(value); setSourceDraft({ name: value.source.name, permissionNote: value.source.permissionNote, version: value.source.version }); setError(''); } })
      .catch(cause => { if (current) { setData(null); setError(cause instanceof Error ? cause.message : 'CMS belum dapat dimuat.'); } })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [query, reload]);
  function refreshNews() { setLoading(true); setReload(value => value + 1); }
  function changeQuery(value: typeof query) { setLoading(true); setQuery(value); }
  async function perform(action: () => Promise<unknown>, success: string) {
    if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try { await action(); setMessage(success); setConfirm(null); setEditing(null); setPreview(null); refreshNews(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Perubahan belum tersimpan.'); if (cause instanceof RequestError) setErrors(cause.fields); }
    finally { setBusy(false); }
  }
  function start(article?: NewsArticle) {
    setErrors({}); setError(''); setPreview(null);
    setEditing(article ?? 'new');
    if (article) setDraft(Object.fromEntries(Object.entries(article).filter(([key]) => !['id', 'version'].includes(key))) as NewsInput);
    else setDraft({ ...emptyDraft });
  }
  function previewDraft() {
    const parsed = newsInputSchema.safeParse(draft);
    if (!parsed.success) { setErrors(parsed.error.flatten().fieldErrors); return; }
    setErrors({}); setPreview({ ...parsed.data, id: 'preview', version: 1 });
  }
  function rowUpdate(article: NewsArticle, changes: Partial<NewsInput>) {
    const { id, ...value } = article;
    return api(`/api/admin/news/${id}/`, 'PATCH', { ...value, ...changes });
  }
  const disabled = busy || loading || !data;
  return <div className="news-management data-page system-page">
    <PageHeader title="News CMS" parent="Sistem" description="Kelola berita resmi BRIN untuk publikasi PRPDN. Judul, tanggal, foto, dan atribusi harus sesuai sumber asli." />
    <div className="news-management-actions"><p>{data ? `${data.total} artikel dalam CMS` : 'CMS berita'} · Admin dan Super Admin</p><Button disabled={disabled} onClick={() => start()}>Tambah artikel</Button></div>
    {error && <p className="auth-form-error news-notice" role="alert">{error}</p>}
    {message && <p className="news-notice" role="status">{message}</p>}
    {!data && !loading && <div className="news-notice"><p>Periksa koneksi database dan status migrasi News. Tidak ada perubahan yang disimpan saat layanan tidak tersedia.</p><Button variant="outline" onClick={() => refreshNews()}>Coba lagi</Button></div>}
    {data && !data.source.catalogInitialized && <div className="news-notice"><p>Situs publik masih memakai enam pilihan berita terverifikasi. Tambahkan katalog awal agar seluruh artikel dapat diedit, ditarik, atau ditandai unggulan melalui CMS. Katalog tidak akan menimpa artikel yang sudah ada.</p><Button variant="outline" disabled={disabled} onClick={() => setConfirm({ title: 'Tambahkan enam pilihan berita ke CMS?', note: 'Artikel baru akan terbit. Artikel dengan URL yang sudah ada tidak akan diubah.', run: () => api('/api/admin/news/catalog/', 'POST', {}) })}>Tambahkan katalog awal</Button></div>}
    <form className="news-toolbar" onSubmit={event => { event.preventDefault(); changeQuery({ q: search, status, page: 1 }); }}>
      <label htmlFor="cms-news-search">Cari judul<Input id="cms-news-search" type="search" maxLength={100} value={search} onChange={event => setSearch(event.target.value)} /></label>
      <label htmlFor="cms-news-status">Status<select id="cms-news-status" value={status} onChange={event => setStatus(event.target.value)}><option value="">Semua status</option><option value="DRAFT">Draf / tidak terbit</option><option value="PUBLISHED">Terbit</option></select></label>
      <Button type="submit" variant="outline" disabled={disabled}>Terapkan</Button><Button type="button" variant="ghost" disabled={disabled} onClick={() => { setSearch(''); setStatus(''); changeQuery({ q: '', status: '', page: 1 }); }}>Atur ulang</Button>
    </form>
    {loading ? <p role="status" className="news-loading">Memuat artikel…</p> : data && <>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Artikel berita, dapat digulir horizontal"><table className="data-table news-table"><caption className="sr-only">Daftar artikel dalam News CMS</caption><thead><tr><th scope="col">Artikel & sumber</th><th scope="col">Tanggal / kategori</th><th scope="col">Publikasi</th><th scope="col">Tindakan</th></tr></thead><tbody>
        {data.rows.map(article => <tr key={article.id}><th scope="row">{article.title}<small><a href={article.canonicalUrl} target="_blank" rel="noopener noreferrer">Sumber BRIN ↗</a></small></th><td><time dateTime={article.publishedAt}>{article.publishedAt}</time><small>{article.category}</small></td><td><span className="news-status" data-status={article.status}>{article.status === 'PUBLISHED' ? 'Terbit' : 'Draf'}</span><small>{article.featured ? 'Artikel unggulan' : 'Reguler'}</small></td><td><div className="news-row-actions">
          <Button variant="outline" size="sm" disabled={disabled} onClick={() => start(article)}>Edit</Button><Button variant="ghost" size="sm" onClick={() => setPreview(article)}>Pratinjau</Button>
          <Button variant="outline" size="sm" disabled={disabled} onClick={() => setConfirm({ title: article.status === 'PUBLISHED' ? 'Tarik artikel dari situs publik?' : 'Terbitkan artikel?', note: article.title, run: () => rowUpdate(article, { status: article.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }) })}>{article.status === 'PUBLISHED' ? 'Tarik' : 'Terbitkan'}</Button>
          <Button variant="ghost" size="sm" disabled={disabled} onClick={() => perform(() => rowUpdate(article, { featured: !article.featured }), 'Penandaan unggulan tersimpan.')}>{article.featured ? 'Lepas unggulan' : 'Unggulkan'}</Button>
          {data.canDelete && <Button variant="destructive" size="sm" disabled={disabled} onClick={() => setConfirm({ title: 'Hapus artikel secara permanen?', note: `${article.title}. Artikel akan dihapus dari CMS dan tidak dapat dipulihkan melalui antarmuka ini.`, destructive: true, run: () => api(`/api/admin/news/${article.id}/?version=${article.version}`, 'DELETE') })}>Hapus</Button>}
        </div></td></tr>)}
        {!data.rows.length && <tr><td colSpan={4}>Belum ada artikel sesuai filter. Tambahkan artikel atau atur ulang pencarian.</td></tr>}
      </tbody></table></div>
      <div className="news-pagination"><Button variant="outline" disabled={disabled || data.page <= 1} onClick={() => changeQuery({ ...query, page: data.page - 1 })}>Sebelumnya</Button><span>Halaman {data.page} / {data.pages}</span><Button variant="outline" disabled={disabled || data.page >= data.pages} onClick={() => changeQuery({ ...query, page: data.page + 1 })}>Selanjutnya</Button></div>
    </>}
    <section className="news-source"><h2>Sumber & sinkronisasi</h2><p className="muted-note">{syncUnavailable} Tidak ada scraper atau cron aktif.</p>
      {data?.canConfigure && <><Button disabled title={syncUnavailable}>Sinkronkan sekarang — belum tersedia</Button><details><summary>Konfigurasi sumber BRIN</summary><p>{data.source.homepageUrl}</p><form className="news-form" onSubmit={event => { event.preventDefault(); void perform(() => api('/api/admin/news/source/', 'PATCH', sourceDraft), 'Konfigurasi sumber tersimpan. Sinkronisasi tetap nonaktif.'); }}><label htmlFor="source-name">Nama sumber<Input id="source-name" value={sourceDraft.name} onChange={event => setSourceDraft({ ...sourceDraft, name: event.target.value })} maxLength={120} required disabled={busy} /></label><label htmlFor="source-permission" className="news-wide">Catatan izin RSS/API<Textarea id="source-permission" value={sourceDraft.permissionNote} onChange={event => setSourceDraft({ ...sourceDraft, permissionNote: event.target.value })} maxLength={2000} disabled={busy} /></label><p className="muted-note news-wide">Catatan ini tidak mengaktifkan sinkronisasi. Penyedia RSS/API dan izin pemakaiannya tetap memerlukan verifikasi terpisah.</p><Button type="submit" disabled={busy}>Simpan konfigurasi</Button></form></details></>}
    </section>
    {editing && <Dialog open onOpenChange={open => { if (!open && !busy) { setEditing(null); setPreview(null); } }}><DialogContent className="news-dialog" onEscapeKeyDown={event => { if (busy) event.preventDefault(); }}><DialogHeader><DialogTitle>{editing === 'new' ? 'Tambah artikel' : 'Edit artikel'}</DialogTitle><DialogDescription>Metadata teks biasa dan tautan resmi BRIN. Isian bertanda * wajib diisi; verifikasi sumber sebelum menerbitkan.</DialogDescription></DialogHeader>
      <form className="news-form" aria-busy={busy} onChange={() => { setPreview(null); setErrors({}); }} onSubmit={event => { event.preventDefault(); const parsed = newsInputSchema.safeParse(draft); if (!parsed.success) { setErrors(parsed.error.flatten().fieldErrors); return; } void perform(() => api(editing === 'new' ? '/api/admin/news/' : `/api/admin/news/${editing.id}/`, editing === 'new' ? 'POST' : 'PATCH', { ...parsed.data, ...(editing === 'new' ? {} : { version: editing.version }) }), 'Artikel tersimpan.'); }}>
        {fields.map(([key, label, type, max]) => <label key={key} htmlFor={`news-${key}`} className={key === 'title' || key === 'canonicalUrl' || key === 'imageUrl' ? 'news-wide' : undefined}>{label} *<Input id={`news-${key}`} type={type} value={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} required maxLength={max} disabled={busy} aria-invalid={Boolean(errors[key]?.length)} aria-describedby={errors[key]?.length ? `news-${key}-error` : undefined} />{errors[key]?.length && <small id={`news-${key}-error`} className="news-field-error">{errors[key].join(' ')}</small>}</label>)}
        <label htmlFor="news-excerpt" className="news-wide">Ringkasan editorial *<Textarea id="news-excerpt" value={draft.excerpt} maxLength={600} required disabled={busy} onChange={event => setDraft({ ...draft, excerpt: event.target.value })} aria-invalid={Boolean(errors.excerpt?.length)} />{errors.excerpt && <small className="news-field-error">{errors.excerpt.join(' ')}</small>}</label>
        <label htmlFor="news-publish-status">Status publikasi<select id="news-publish-status" value={draft.status} disabled={busy} onChange={event => setDraft({ ...draft, status: event.target.value as NewsInput['status'] })}><option value="DRAFT">Draf — tidak tampil di publik</option><option value="PUBLISHED">Terbit — tampil di publik</option></select></label><label className="news-check" htmlFor="news-featured"><input id="news-featured" type="checkbox" checked={draft.featured} disabled={busy} onChange={event => setDraft({ ...draft, featured: event.target.checked })} />Artikel unggulan</label>
        {error && <p role="alert" className="news-wide news-field-error">{error}</p>}
        <div className="news-form-actions"><Button variant="ghost" type="button" disabled={busy} onClick={() => setEditing(null)}>Batal</Button><Button variant="outline" type="button" disabled={busy} onClick={previewDraft}>Pratinjau</Button><Button type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan artikel'}</Button></div>
      </form>{preview && <div className="news-preview"><h3>Pratinjau kartu — belum disimpan</h3><NotchedNewsCard article={preview} /></div>}
    </DialogContent></Dialog>}
    {!editing && preview && <Dialog open onOpenChange={open => { if (!open) setPreview(null); }}><DialogContent className="news-dialog"><DialogHeader><DialogTitle>Pratinjau artikel</DialogTitle><DialogDescription>{preview.status === 'PUBLISHED' ? 'Artikel ini berstatus terbit.' : 'Artikel ini masih draf dan tidak tampil di publik.'}</DialogDescription></DialogHeader><div className="news-preview"><NotchedNewsCard article={preview} /></div></DialogContent></Dialog>}
    {confirm && <SystemConfirm title={confirm.title} description={confirm.note} note={error || "Perubahan akan disimpan ke database CMS."} destructive={confirm.destructive} busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => perform(confirm.run, 'Perubahan berita tersimpan.')} />}
  </div>;
}
