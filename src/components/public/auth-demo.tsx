import Link from 'next/link';
import { ArrowLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthDemo() {
  return <section className="public-auth">
    <div className="public-auth-intro">
      <Link href="/" className="auth-back-link"><ArrowLeft size={16} /><span>Kembali ke beranda</span></Link>
      <p className="public-eyebrow">Akses PRPDN</p>
      <h1>Ajukan akses akun.</h1>
      <p className="auth-intro-desc">Akun pengelola data diberikan oleh administrator PRPDN untuk menjaga keamanan dan ketertelusuran data.</p>
    </div>
    <div className="public-auth-form">
      <h2>Permintaan akses</h2>
      <div className="public-demo-notice"><Info size={18} aria-hidden="true" /><div><strong>Pendaftaran mandiri belum tersedia</strong><p>Hubungi administrator PRPDN di instansi Anda untuk meminta akun. Setelah akses diberikan, masuk menggunakan identitas dan kata sandi yang terdaftar.</p></div></div>
      <Button asChild className="auth-submit-btn"><Link href="/login/">Ke halaman masuk</Link></Button>
      <div className="auth-toggle-row"><Link href="/">Kembali ke situs publik</Link></div>
    </div>
  </section>;
}
