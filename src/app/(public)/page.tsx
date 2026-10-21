import Link from 'next/link';
import { Suspense } from 'react';
import { NewsHome } from '@/components/news/news-home';
import Image from 'next/image';
import { ArrowRight, MapPinned, BookOpen, ChartNoAxesCombined, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PublicExplorer from '@/components/public/public-explorer';
import { CountUp } from '@/components/public/count-up';
import { HeroPanorama } from '@/components/public/hero-panorama';
import { spatialReference } from '@/lib/regions';

export const metadata = {
  title: 'Data Pembangunan Daerah',
  description:
    'Portal informasi pembangunan daerah dan analitika spasial 514 kabupaten/kota se-Indonesia. Platform riset kebijakan dan perencanaan wilayah berbasis data empiris.',
};

export default function Home() {
  return (
    <>
      <section className="public-hero" aria-labelledby="hero-title">
        <div className="public-container hero-body">
          <div className="hero-content">
            <p className="hero-eyebrow"><span aria-hidden="true" />Portal informasi pembangunan daerah</p>
            <h1 className="hero-heading" id="hero-title">
              <span>Kenali daerah.</span>{' '}
              <em>Pahami</em>{' '}
              <span className="hero-heading-accent">perubahannya.</span>
            </h1>
            <p className="hero-lead">
              Indikator pembangunan dan informasi spasial Indonesia untuk riset kebijakan,
              perencanaan wilayah, dan keputusan berbasis data empiris.
            </p>

            <div className="hero-actions">
              <Button asChild size="default" className="hero-primary-btn">
                <Link href="#peta">
                  <MapPinned size={17} />
                  <span>Jelajahi Peta Interaktif</span>
                  <ArrowRight size={15} />
                </Link>
              </Button>
              <Button asChild variant="outline" size="default" className="hero-outline-btn">
                <Link href="#perbandingan">
                  <span>Bandingkan Wilayah</span>
                  <ArrowRight size={15} />
                </Link>
              </Button>
            </div>

            <p className="hero-institution">Pusat Riset Pemerintahan Dalam Negeri<br />Badan Riset dan Inovasi Nasional</p>
          </div>

          <div className="hero-visual-column">
            <div className="hero-visual-heading">
              <span>Perspektif wilayah</span>
              <span>Indonesia / cakupan nasional</span>
            </div>
            <HeroPanorama>
              <div className="hero-image-window">
                <Image
                  src="/images/prpdn-hero-development.jpg"
                  alt=""
                  fill
                  preload
                  sizes="(max-width: 900px) 100vw, (max-width: 1360px) 45vw, 560px"
                  className="hero-image"
                />
                <div className="hero-image-grid" aria-hidden="true" />
                <span className="hero-image-label">Wilayah · Infrastruktur · Pembangunan</span>
              </div>
              <figcaption>
                <div className="hero-data-context">
                  <ChartNoAxesCombined size={19} aria-hidden="true" />
                  <div>
                    <span>Data indikator <strong>2022–2024</strong></span>
                    <small>Tahun mengikuti ketersediaan setiap indikator resmi</small>
                  </div>
                </div>
                <Link href="#peta" className="hero-visual-link" aria-label="Jelajahi wilayah pada peta"><ArrowRight size={20} aria-hidden="true" /></Link>
              </figcaption>
            </HeroPanorama>
            <div className="hero-visual-footnote"><span aria-hidden="true">+</span><span>Riset kebijakan dalam konteks spasial</span><span aria-hidden="true">+</span></div>
          </div>
        </div>

        <div className="hero-stats-band">
          <div className="public-container">
            <p className="stats-caption">Cakupan administratif Indonesia</p>
            <div className="hero-stats-grid" role="region" aria-label="Cakupan administratif Indonesia">
              <div className="hero-stat-col">
                <div className="stat-num-row">
                  <strong><CountUp value={spatialReference.counts.PROV} /></strong>
                  <span className="stat-unit">Provinsi</span>
                </div>
                <span className="stat-note">Termasuk 4 DOB Papua</span>
              </div>

              <div className="hero-stat-col">
                <div className="stat-num-row">
                  <strong><CountUp value={spatialReference.counts.KAB} /></strong>
                  <span className="stat-unit">Kabupaten</span>
                </div>
                <span className="stat-note">Pemerintahan daerah otonom</span>
              </div>

              <div className="hero-stat-col">
                <div className="stat-num-row">
                  <strong><CountUp value={spatialReference.counts.KOTA} /></strong>
                  <span className="stat-unit">Kota</span>
                </div>
                <span className="stat-note">Kawasan perkotaan otonom</span>
              </div>

              <div className="hero-stat-col stat-col-total">
                <div className="stat-num-row">
                  <strong><CountUp value={spatialReference.counts.KAB + spatialReference.counts.KOTA} /></strong>
                  <span className="stat-unit">Kabupaten / Kota</span>
                </div>
                <span className="stat-note">Total cakupan spasial nasional</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="public-container">
        <PublicExplorer />
        <Suspense fallback={<section className="news-loading" aria-label="Berita riset" role="status">Memuat berita riset…</section>}><NewsHome /></Suspense>

        <section className="public-about" id="tentang">
          <div className="about-intro">
            <div className="about-intro-badge">
              <BookOpen size={17} aria-hidden="true" />
              <span>Metodologi & integritas data</span>
            </div>
            <h2>Data yang terbuka untuk dipahami.</h2>
            <p>
              Baca sumber, cakupan tahun, dan konteks spasial sebelum menarik kesimpulan kebijakan.
            </p>
          </div>

          <div className="about-grid">
            <div className="about-card">
              <h3>Sumber indikator</h3>
              <p>
                Nilai indikator berasal dari dataset resmi (Dataset Dashboard 040526.xlsx). Tahun indikator mengikuti ketersediaan instansi penyedia data asal, bukan tahun pembaruan batas kartografi. Nilai kosong berarti belum tersedia dan tidak dianggap nol.
              </p>
            </div>

            <div className="about-card">
              <h3>Konteks spasial & batas BIG</h3>
              <p>
                Batas wilayah merujuk pada data spasial Badan Informasi Geospasial (BIG) per Juni 2026. Geometri disederhanakan secara topologis untuk performa visualisasi web interaktif, bukan untuk penetapan batas hukum agraria mutlak.
              </p>
            </div>

            <div className="about-card">
              <h3>Pemekaran wilayah & tren</h3>
              <p>
                Pembentukan Daerah Otonom Baru (DOB) seperti di Papua membatasi ketersediaan data historis jangka panjang. Perbandingan antarwilayah harus memperhatikan tahun penetapan wilayah dan konsistensi deret waktu.
              </p>
            </div>
          </div>

          <div className="about-actions-row">
            <a
              href="https://geoservices.big.go.id/rbi/rest/services/BATASWILAYAH/BATAS_KABKOTA_AR/MapServer"
              target="_blank"
              rel="noreferrer"
              className="about-link-btn"
            >
              <span>Sumber batas wilayah BIG (RBI)</span>
              <ExternalLink size={14} />
            </a>
            <a
              href="https://ppid.kemendagri.go.id/storage/dokumen/tKN00jt8OLIwOxy1QTtlvJ8fVcvCrCiCaMG0f5dI.pdf"
              target="_blank"
              rel="noreferrer"
              className="about-link-btn"
            >
              <span>Referensi kode wilayah Kemendagri</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
