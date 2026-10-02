"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

const links = [
  ['/', 'Beranda'],
  ['/#data', 'Data & Indikator'],
  ['/#peta', 'Peta Interaktif'],
  ['/#perbandingan', 'Analisis Wilayah'],
  ['/#tentang', 'Tentang Data'],
];

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const authPage = ['/login', '/register'].includes(pathname.replace(/\/+$/, ''));

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = (
    <>
      {links.map(([href, label]) => {
        const isCurrent = (href === '/' && pathname === '/') || (href !== '/' && pathname === href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isCurrent ? 'page' : undefined}
            onClick={() => setOpen(false)}
            className="public-nav-link"
          >
            {label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="public-site">
      <a href="#main-content" className="skip-link">
        Lewati ke konten utama
      </a>

      {/* Sticky Navigation: Transparent at Top, Semi-Transparent Navy with Blur on Scroll */}
      <header className={`public-header ${authPage ? 'is-auth-page' : scrolled ? 'is-scrolled' : 'is-top'}`}>
        <div className="public-container public-header-inner">
          <Link className="public-brand" href="/" aria-label="PRPDN Beranda">
            <Image src="/brin-logo.svg" alt="Badan Riset dan Inovasi Nasional" width={94} height={36} priority />
          </Link>

          <nav className="public-desktop-nav" aria-label="Navigasi publik">
            {navigation}
          </nav>

          <div className="public-nav-actions">
            <Link
              className="public-signin-link"
              href="/login"
              aria-current={pathname === '/login' ? 'page' : undefined}
            >
              Masuk
            </Link>
            <Button asChild size="sm" className="public-register-btn">
              <Link href="/register">
                <span>Daftar</span>
                <ArrowRight size={14} />
              </Link>
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  className="public-mobile-trigger"
                  variant="outline"
                  size="icon"
                  aria-label="Buka navigasi publik"
                >
                  <Menu size={18} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="navigation-sheet">
                <SheetHeader>
                  <SheetTitle>PRPDN</SheetTitle>
                  <SheetDescription>Portal Data Pembangunan Daerah</SheetDescription>
                </SheetHeader>
                <nav className="public-mobile-nav" aria-label="Navigasi publik seluler">
                  {navigation}
                  <div className="mobile-nav-separator" />
                  <Link
                    className="mobile-auth-link"
                    href="/login"
                    onClick={() => setOpen(false)}
                  >
                    Masuk
                  </Link>
                  <Button asChild className="mobile-register-btn" onClick={() => setOpen(false)}>
                    <Link href="/register">
                      <span>Daftar</span>
                      <ArrowRight size={14} />
                    </Link>
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        {children}
      </main>

      {/* Institutional PRPDN Footer */}
      <footer className="public-footer">
        <div className="public-container">
          <div className="public-footer-grid">
            <div className="footer-col-brand">
              <div className="footer-brand-title">
                <span className="public-brand-bar" aria-hidden="true" />
                <strong>PRPDN</strong>
              </div>
              <p className="footer-brand-sub">Portal Riset & Pembangunan Daerah Nasional</p>
              <p className="footer-desc">
                Platform terpadu indikator pembangunan daerah, Indeks Daya Saing Daerah (IDSD), dan analitika spasial Indonesia. Dirancang untuk riset kebijakan dan perencanaan berbasis bukti.
              </p>
              <div className="footer-tags">
                <span>Badan Riset dan Inovasi Nasional (BRIN)</span>
                <span>Referensi Batas BIG 2026</span>
              </div>
            </div>

            <div className="footer-col-links">
              <h4>Navigasi Halaman</h4>
              <ul>
                <li><Link href="/">Beranda</Link></li>
                <li><Link href="/#data">Data & Indikator</Link></li>
                <li><Link href="/#peta">Peta Interaktif</Link></li>
                <li><Link href="/#perbandingan">Analisis Wilayah</Link></li>
                <li><Link href="/#tentang">Tentang Data & Rujukan</Link></li>
              </ul>
            </div>

            <div className="footer-col-sources">
              <h4>Rujukan & Tautan</h4>
              <ul>
                <li>
                  <a
                    href="https://geoservices.big.go.id/rbi/rest/services/BATASWILAYAH/BATAS_KABKOTA_AR/MapServer"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Layanan Batas BIG (RBI) ↗
                  </a>
                </li>
                <li>
                  <a
                    href="https://ppid.kemendagri.go.id/storage/dokumen/tKN00jt8OLIwOxy1QTtlvJ8fVcvCrCiCaMG0f5dI.pdf"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Referensi Wilayah Kemendagri ↗
                  </a>
                </li>
                <li><Link href="/login">Masuk Pengelola</Link></li>
                <li><Link href="/register">Daftar Akun</Link></li>
              </ul>
            </div>
          </div>

          <div className="public-footer-bottom">
            <p>© {new Date().getFullYear()} PRPDN · Data Pembangunan Daerah. Informasi mengikuti ketersediaan tahunan sumber data.</p>
            <div className="footer-sub-links">
              <Link href="/#tentang">Metodologi Data</Link>
              <span>·</span>
              <Link href="/#tentang">Ketentuan Spasial</Link>
              <span>·</span>
              <Link href="/login">Portal Pengelola</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
