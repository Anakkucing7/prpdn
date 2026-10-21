"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, ArrowRight, Search } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
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
  ['/news/', 'News'],
  ['/#tentang', 'Tentang Data'],
];

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const { data: session, isPending, error: sessionError } = authClient.useSession();
  const account = session?.user;
  const checkingSession = isPending && !account;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHref, setActiveHref] = useState('/');
  const pathname = usePathname();
  const authPage = ['/login', '/register'].includes(pathname.replace(/\/+$/, ''));
  const homePage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (pathname !== '/') { setActiveHref(''); return; }
        let current = '/';
        if (window.scrollY >= 100) for (const [href] of links.slice(1).filter(([href]) => href.includes('#'))) {
          const target = document.getElementById(href.split('#')[1]);
          if (target && target.getBoundingClientRect().top <= 120) current = href;
        }
        if (window.scrollY > 100 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
          current = links.at(-1)![0];
        }
        setActiveHref(current);
      });
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); cancelAnimationFrame(frame); };
  }, [pathname]);

  const navigation = (
    <>
      {links.map(([href, label]) => {
        const isCurrent = href === '/news/' ? pathname.replace(/\/+$/, '') === '/news' : href === activeHref && pathname === '/';
        return (
          <Link
            key={href}
            href={href}
            aria-current={isCurrent ? href === '/' || href === '/news/' ? 'page' : 'location' : undefined}
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
    <div className={`public-site ${homePage ? 'is-home-page' : ''}`}>
      <a href="#main-content" className="skip-link">
        Lewati ke konten utama
      </a>

      {/* The home header retains its navy surface while scrolling. */}
      <header className={`public-header ${authPage || pathname.startsWith('/news') ? 'is-auth-page' : scrolled ? 'is-scrolled' : 'is-top'}`}>
        <div className="public-container public-header-inner">
          <Link className="public-brand" href="/" aria-label="PRPDN Beranda">
            <Image src={homePage ? '/brin-logo-white.svg' : '/brin-logo.svg'} alt="Badan Riset dan Inovasi Nasional" width={homePage ? 126 : 94} height={homePage ? 49 : 36} priority />
            {homePage && <span className="public-home-brand-copy"><strong>PRPDN</strong><small>Data pembangunan daerah</small></span>}
          </Link>

          <nav className="public-desktop-nav" aria-label="Navigasi publik">
            {navigation}
          </nav>

          <div className="public-nav-actions">
            {homePage && (
              <Link className="public-search-link" href="#peta" aria-label="Buka pencarian wilayah">
                <Search size={20} aria-hidden="true" />
              </Link>
            )}
            {checkingSession ? <span className="public-signin-link" role="status">Memeriksa sesi…</span> : <Link
              className="public-signin-link"
              href={account || sessionError ? '/admin/' : '/login'}
              aria-current={pathname === '/login' ? 'page' : undefined}
            >
              {account ? 'Akun saya' : sessionError ? 'Periksa sesi akun' : 'Masuk'}
            </Link>}
            {!checkingSession && !sessionError && <Button asChild size="sm" className="public-register-btn">
              <Link href={account ? '/admin/' : '/register'}>
                <span>{account ? 'Ruang kerja' : 'Daftar'}</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </Button>}

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
              <SheetContent side="right" className={`navigation-sheet ${homePage ? 'public-home-sheet' : ''}`}>
                <SheetHeader>
                  <SheetTitle>PRPDN</SheetTitle>
                  <SheetDescription>Portal Data Pembangunan Daerah</SheetDescription>
                </SheetHeader>
                <nav className="public-mobile-nav" aria-label="Navigasi publik seluler">
                  {navigation}
                  <div className="mobile-nav-separator" />
                  {checkingSession ? <span className="mobile-auth-link" role="status">Memeriksa sesi…</span> : <Link
                    className="mobile-auth-link"
                    href={account || sessionError ? '/admin/' : '/login'}
                    onClick={() => setOpen(false)}
                  >
                    {account ? 'Akun saya' : sessionError ? 'Periksa sesi akun' : 'Masuk'}
                  </Link>}
                  {!checkingSession && !sessionError && <Button asChild className="mobile-register-btn" onClick={() => setOpen(false)}>
                    <Link href={account ? '/admin/' : '/register'}>
                      <span>{account ? 'Ruang kerja' : 'Daftar'}</span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </Button>}
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
              <p className="footer-brand-sub">Pusat Riset Pemerintahan Dalam Negeri</p>
              <p className="footer-desc">
                Platform terpadu indikator pembangunan daerah, Indeks Daya Saing Daerah (IDSD), dan analitika spasial Indonesia. Dirancang untuk riset kebijakan dan perencanaan berbasis bukti.
              </p>
              <div className="footer-tags">
                <span>Badan Riset dan Inovasi Nasional (BRIN)</span>
                <span>Referensi Batas BIG 2026</span>
              </div>
            </div>

            <div className="footer-col-links">
              <h2>Navigasi Halaman</h2>
              <ul>
                <li><Link href="/">Beranda</Link></li>
                <li><Link href="/#data">Data & Indikator</Link></li>
                <li><Link href="/#peta">Peta Interaktif</Link></li>
                <li><Link href="/#perbandingan">Analisis Wilayah</Link></li>
                <li><Link href="/#tentang">Tentang Data & Rujukan</Link></li>
                <li><Link href="/news/">News</Link></li>
              </ul>
            </div>

            <div className="footer-col-sources">
              <h2>Rujukan & Tautan</h2>
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
                <li><Link href={account || checkingSession || sessionError ? '/admin/' : '/login'}>{account ? 'Ruang kerja' : checkingSession ? 'Portal Pengelola' : sessionError ? 'Periksa sesi akun' : 'Masuk Pengelola'}</Link></li>
                {!account && !checkingSession && !sessionError && <li><Link href="/register">Daftar Akun</Link></li>}
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
              <Link href={account || sessionError ? '/admin/' : '/login'}>Portal Pengelola</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
