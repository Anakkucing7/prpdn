"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/ui-patterns';

export default function AuthDemo({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const [role, setRole] = useState('public');
  const [complete, setComplete] = useState(false);

  return (
    <section className="public-auth">
      <div className="public-auth-intro">
        <Link href="/" className="auth-back-link">
          <ArrowLeft size={16} />
          <span>Kembali ke beranda</span>
        </Link>
        <p className="public-eyebrow">Akses PRPDN</p>
        <h1>{register ? 'Daftar untuk menjelajahi data.' : 'Selamat datang kembali.'}</h1>
        <p className="auth-intro-desc">
          Informasi pembangunan daerah dan analitika spasial Indonesia untuk masyarakat, peneliti, dan pengelola data.
        </p>

        <div className="public-demo-notice">
          <Info size={18} aria-hidden="true" />
          <div>
            <strong>Simulasi antarmuka</strong>
            <p>
              Tidak ada akun yang dibuat atau diverifikasi. Gunakan nama dan email contoh. Pilihan peran mendemonstrasikan navigasi antarmuka, bukan otorisasi sistem aman.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (register) setComplete(true);
          else router.push(role === 'public' ? '/' : '/admin/dashboard');
        }}
        className="public-auth-form"
      >
        <h2>{register ? 'Daftar' : 'Masuk'} demo</h2>

        {register && (
          <label className="auth-field">
            <span>Nama contoh <span className="text-red-600">*</span></span>
            <Input
              name="name"
              required
              maxLength={100}
              autoComplete="off"
              placeholder="Pengguna Contoh"
            />
          </label>
        )}

        <label className="auth-field">
          <span>Email contoh <span className="text-red-600">*</span></span>
          <Input
            name="email"
            type="email"
            required
            autoComplete="off"
            placeholder="contoh@example.com"
          />
        </label>

        {!register && (
          <div className="auth-field">
            <SelectField
              label="Simulasi peran"
              value={role}
              onValueChange={setRole}
              options={[
                { value: 'public', label: 'Publik / masyarakat (Situs publik)' },
                { value: 'admin', label: 'Admin (Dashboard data)' },
                { value: 'superadmin', label: 'Super Admin (Pengaturan penuh)' },
              ]}
            />
          </div>
        )}

        <p className="muted-note">
          * Wajib diisi. Prototipe antarmuka tidak meminta kata sandi. Autentikasi dan hak akses produksi terikat pada SSO & API BRIN.
        </p>

        {complete ? (
          <div role="status" className="auth-complete-card">
            <p>Simulasi pendaftaran selesai. Akun belum dibuat; seluruh layanan publik dapat diakses langsung.</p>
            <Button asChild>
              <Link href="/">Buka situs publik</Link>
            </Button>
          </div>
        ) : (
          <Button type="submit" className="auth-submit-btn">
            <span>{register ? 'Simulasikan pendaftaran publik' : 'Lanjutkan demo'}</span>
            <ArrowRight size={16} />
          </Button>
        )}

        <div className="auth-toggle-row">
          <Link href={register ? '/login' : '/register'}>
            {register
              ? 'Sudah memiliki akun? Masuk demo'
              : 'Belum memiliki akun? Daftar demo'}
          </Link>
        </div>
      </form>
    </section>
  );
}
