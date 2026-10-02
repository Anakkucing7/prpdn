"use client";

import { useEffect, useMemo, useState } from 'react';
import { Check, Clock3, X } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { SelectField, StatusBadge } from '@/components/ui-patterns';
import { DataFilters, NoResults, Pagination } from './data-controls';
import { SystemConfirm, SystemDetail } from './system-shared';
import { api, RequestError } from '@/lib/api-client';

type UserRecord = {
  id: string; name: string; username: string | null; email: string; workUnit: string;
  roleId: string; active: boolean; approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  lastLogin: string | null; createdAt: string; updatedAt: string;
};
type ReviewAction = { user: UserRecord; status: 'APPROVED' | 'REJECTED' };

const roles: Record<string, string> = {
  'public-viewer': 'Public Viewer', 'internal-viewer': 'Internal Viewer', operator: 'Operator',
  validator: 'Validator', administrator: 'Administrator', 'super-admin': 'Super Admin',
};
const statusLabels = { PENDING: 'Menunggu aktivasi', APPROVED: 'Disetujui', REJECTED: 'Ditolak' };

export default function UsersPage() {
  const [records, setRecords] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [review, setReview] = useState<ReviewAction | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let current = true;
    api<UserRecord[]>('/api/admin/users').then(data => { if (current) setRecords(data); })
      .catch(() => { if (current) setError('Daftar pengguna belum dapat dimuat. Coba muat ulang halaman.'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);

  const rows = useMemo(() => records.filter(user => {
    const text = `${user.name} ${user.username ?? ''} ${user.email} ${user.workUnit}`.toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (status === 'all' || (status === 'inactive' ? !user.active : user.approvalStatus === status));
  }), [records, query, status]);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / 10)));
  const pendingCount = records.filter(user => user.approvalStatus === 'PENDING').length;

  function reset() { setQuery(''); setStatus('all'); setPage(1); }
  async function confirmReview() {
    if (!review) return;
    setBusy(true); setError('');
    try {
      const updated = await api<UserRecord>(`/api/admin/users/${encodeURIComponent(review.user.id)}/approval`, 'PATCH', { status: review.status });
      setRecords(current => current.map(user => user.id === updated.id ? updated : user));
      setMessage(`${updated.name}: ${statusLabels[updated.approvalStatus]}. Keputusan dicatat di log aktivitas.`);
      setReview(null);
    } catch (cause) {
      setError(cause instanceof RequestError ? cause.message : 'Keputusan belum tersimpan. Coba kembali.');
      setReview(null);
    } finally { setBusy(false); }
  }

  return <div className="data-page system-page">
    <PageHeader title="Manajemen Pengguna" parent="Sistem" description="Tinjau permintaan pendaftaran dan status akses akun." />
    <section className="data-notice" aria-label="Alur aktivasi"><Clock3 aria-hidden="true"/><p>Pendaftar baru menunggu persetujuan. Setelah disetujui, akun aktif dengan role Public Viewer. Perubahan role tetap mengikuti hak akses dan dicatat dalam log aktivitas.</p></section>
    <DataFilters query={query} onQuery={value => { setQuery(value); setPage(1); }} onReset={reset} summary={`${rows.length} akun · ${pendingCount} menunggu aktivasi`} searchLabel="Cari pengguna" searchPlaceholder="Nama, username, email, atau unit kerja">
      <SelectField label="Status akun" value={status} onValueChange={value => { setStatus(value); setPage(1); }} options={[{value:'all',label:'Semua status'},{value:'PENDING',label:'Menunggu aktivasi'},{value:'APPROVED',label:'Disetujui'},{value:'REJECTED',label:'Ditolak'},{value:'inactive',label:'Nonaktif'}]} />
    </DataFilters>
    {message && <p className="master-feedback" role="status">{message}</p>}
    {error && <p className="auth-form-error" role="alert">{error}</p>}
    <section className="data-panel">
      <div className="data-panel-heading"><div><h2>Daftar pengguna</h2><p>{pendingCount ? `${pendingCount} pendaftaran perlu ditinjau` : 'Tidak ada pendaftaran yang menunggu.'}</p></div></div>
      {loading ? <div className="data-loading" role="status">Memuat akun…</div> : rows.length ? <div className="table-scroll" role="region" tabIndex={0} aria-label="Daftar akun, dapat digulir horizontal"><table className="data-table system-user-table"><thead><tr><th scope="col">Pengguna</th><th scope="col">Role / unit kerja</th><th scope="col">Status</th><th scope="col">Terdaftar</th><th scope="col">Tindakan</th></tr></thead><tbody>{rows.slice((currentPage-1)*10,currentPage*10).map(user => <tr key={user.id}>
        <td><strong className="table-primary">{user.name}</strong><span className="table-secondary">{user.username || 'Username belum tersedia'}</span><span className="table-secondary">{user.email}</span></td>
        <td>{roles[user.roleId] ?? user.roleId}<span className="table-secondary">{user.workUnit || 'Unit kerja belum diisi'}</span></td>
        <td><StatusBadge tone={user.approvalStatus === 'PENDING' ? 'warning' : user.approvalStatus === 'REJECTED' ? 'error' : user.active ? 'success' : 'neutral'}>{user.active ? statusLabels[user.approvalStatus] : user.approvalStatus === 'PENDING' ? statusLabels.PENDING : 'Nonaktif'}</StatusBadge></td>
        <td>{new Intl.DateTimeFormat('id-ID',{dateStyle:'medium'}).format(new Date(user.createdAt))}</td>
        <td><div className="master-row-actions">
          <SystemDetail title={user.name} description="Informasi akun" label={`Detail akun ${user.name}`}><StatusBadge tone={user.approvalStatus==='PENDING'?'warning':user.active?'success':'neutral'}>{user.active?statusLabels[user.approvalStatus]:'Nonaktif'}</StatusBadge><dl className="facts"><div><dt>Email</dt><dd>{user.email}</dd></div><div><dt>Username</dt><dd>{user.username||'Belum tersedia'}</dd></div><div><dt>Role</dt><dd>{roles[user.roleId]??user.roleId}</dd></div><div><dt>Unit kerja</dt><dd>{user.workUnit||'Belum diisi'}</dd></div><div><dt>Terdaftar</dt><dd>{new Intl.DateTimeFormat('id-ID',{dateStyle:'long',timeStyle:'short'}).format(new Date(user.createdAt))}</dd></div><div><dt>Login terakhir</dt><dd>{user.lastLogin?new Intl.DateTimeFormat('id-ID',{dateStyle:'long',timeStyle:'short'}).format(new Date(user.lastLogin)):'Belum pernah'}</dd></div></dl></SystemDetail>
          {user.approvalStatus==='PENDING'&&<><Button size="sm" onClick={()=>setReview({user,status:'APPROVED'})}><Check/>Setujui</Button><Button size="sm" variant="danger" onClick={()=>setReview({user,status:'REJECTED'})}><X/>Tolak</Button></>}
        </div></td>
      </tr>)}</tbody></table></div> : <NoResults onReset={reset} />}
      {!loading&&<Pagination page={currentPage} total={rows.length} size={10} onPage={setPage}/>}
    </section>
    {review&&<SystemConfirm title={review.status==='APPROVED'?'Aktifkan akun ini?':'Tolak pendaftaran ini?'} description={review.status==='APPROVED'?`${review.user.name} dapat masuk dengan role Public Viewer setelah disetujui.`:`Permintaan dari ${review.user.name} akan ditolak dan akun tetap tidak dapat masuk.`} note="Keputusan disimpan ke database dan log aktivitas." confirmLabel={review.status==='APPROVED'?'Setujui dan aktifkan':'Tolak pendaftaran'} busy={busy} onCancel={()=>setReview(null)} onConfirm={()=>void confirmReview()} />}
  </div>;
}
