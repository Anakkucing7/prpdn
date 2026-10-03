"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, RequestError } from '@/lib/api-client';

export default function AuthDemo({registrationOpen}:{registrationOpen:boolean}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password'));
    if (password !== String(form.get('confirmPassword'))) {
      setError('Konfirmasi kata sandi belum sama.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const username = String(form.get('username')).trim().toLowerCase();
      await api('/api/auth/sign-up/email', 'POST', {
        name: String(form.get('name')).trim(),
        email: String(form.get('email')).trim().toLowerCase(),
        username,
        displayUsername: username,
        workUnit: String(form.get('workUnit')).trim(),
        password,
      });
      setSubmitted(true);
    } catch (cause) {
      setError(cause instanceof RequestError && cause.status === 429
        ? 'Terlalu banyak permintaan pendaftaran. Coba kembali satu jam lagi.'
        : cause instanceof RequestError && cause.status === 403
          ? 'Pendaftaran akun sedang ditutup oleh administrator.'
        : 'Pendaftaran belum dapat diproses. Periksa kembali data dan pastikan email serta username belum digunakan.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="public-auth">
    <div className="public-auth-intro">
      <Link href="/" className="auth-back-link"><ArrowLeft size={16} /><span>Kembali ke beranda</span></Link>
      <p className="public-eyebrow">Akses PRPDN</p>
      <h1>Ajukan akses akun.</h1>
      <p className="auth-intro-desc">Isi data diri untuk mengajukan akses. Administrator akan memeriksa permintaan sebelum akun dapat digunakan.</p>
    </div>
    {!registrationOpen ? <div className="public-auth-form" role="status">
      <h2>Pendaftaran sedang ditutup</h2>
      <p className="auth-intro-desc">Administrator sedang membatasi pembuatan akun baru. Jika Anda sudah memiliki akun, silakan masuk.</p>
      <Button asChild className="auth-submit-btn"><Link href="/login/">Ke halaman masuk</Link></Button>
    </div> : submitted ? <div className="public-auth-form" role="status" aria-live="polite">
      <CheckCircle2 className="register-success-icon" aria-hidden="true" />
      <h2>Permintaan terkirim</h2>
      <p className="auth-intro-desc">Akun Anda menunggu aktivasi Administrator atau Super Admin. Anda dapat masuk setelah pendaftaran disetujui.</p>
      <Button asChild className="auth-submit-btn"><Link href="/login/">Ke halaman masuk</Link></Button>
    </div> : <form className="public-auth-form" onSubmit={submit}>
      <h2>Formulir pendaftaran</h2>
      <div className="public-demo-notice"><Info size={18} aria-hidden="true" /><div><strong>Akun menunggu persetujuan</strong><p>Permintaan tidak langsung mendapat akses. Administrator akan meninjau dan mengaktifkan akun.</p></div></div>
      <label className="auth-field"><span>Nama lengkap *</span><Input name="name" required minLength={2} maxLength={100} autoComplete="name" disabled={busy} /></label>
      <label className="auth-field"><span>Username *</span><Input name="username" required minLength={3} maxLength={40} pattern="[a-zA-Z0-9._-]+" autoComplete="username" disabled={busy} /><small>3–40 karakter: huruf, angka, titik, garis bawah, atau tanda hubung.</small></label>
      <label className="auth-field"><span>Email *</span><Input name="email" type="email" required maxLength={191} autoComplete="email" disabled={busy} /></label>
      <label className="auth-field"><span>Instansi / unit kerja</span><Input name="workUnit" maxLength={120} autoComplete="organization" disabled={busy} /></label>
      <label className="auth-field"><span>Kata sandi * (minimal 12 karakter)</span><Input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" disabled={busy} /></label>
      <label className="auth-field"><span>Konfirmasi kata sandi *</span><Input name="confirmPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password" disabled={busy} /></label>
      {error && <p className="auth-form-error" role="alert">{error}</p>}
      <Button type="submit" disabled={busy} className="auth-submit-btn">{busy ? 'Mengirim permintaan…' : 'Kirim pendaftaran'}<ArrowRight size={16} /></Button>
      <div className="auth-toggle-row"><span>Sudah memiliki akun?</span> <Link href="/login/">Masuk</Link></div>
    </form>}
  </section>;
}
