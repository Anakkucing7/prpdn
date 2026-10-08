import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MapPinned, BookOpen, ChartNoAxesCombined, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PublicExplorer from '@/components/public/public-explorer';
import { CountUp } from '@/components/public/count-up';
import { spatialReference } from '@/lib/regions';

export const metadata = {
  title: 'Data Pembangunan Daerah · PRPDN',
  description:
    'Portal informasi pembangunan daerah dan analitika spasial 514 kabupaten/kota se-Indonesia. Platform riset kebijakan dan perencanaan wilayah berbasis data empiris.',
};

export default function Home() {
  return (
    <>
      {/* Immersive Full-Width Hero with Photographic Indonesian Regional Development Background */}
      <section className="public-hero">
        <div className="hero-media-layer">
          <Image
            src="/images/prpdn-hero-development.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="hero-image"
          />
        </div>
        <div className="hero-gradient-layer" />

        <div className="public-container hero-body">
          <div className="hero-content">
            <p className="hero-eyebrow">Portal Informasi Pembangunan Daerah</p>
            <h1 className="hero-heading">
              Kenali daerah.
              <br />
              <span className="hero-heading-accent">Pahami perubahannya.</span>
            </h1>
            <p className="hero-lead">
              Indikator pembangunan terpadu dan informasi spasial Indonesia dalam satu ruang eksplorasi.
              Dirancang untuk riset kebijakan, perencanaan wilayah, dan keputusan berbasis data empiris.
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

            <div className="hero-data-context">
              <ChartNoAxesCombined size={16} aria-hidden="true" />
              <div>
                <span>Data indikator <strong>2022–2024</strong></span>
                <small>Tahun mengikuti ketersediaan setiap indikator resmi</small>
              </div>
            </div>
          </div>
        </div>

        {/* National Statistics Integrated into Bottom of Hero */}
        <div className="hero-stats-band">
          <div className="public-container">
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

      {/* Main Exploration Workspace */}
      <div className="public-container">
        <PublicExplorer />

        {/* Institutional Methodology & About Section */}
        <section className="public-about" id="tentang">
          <div className="about-intro">
            <div className="about-intro-badge">
              <BookOpen size={17} aria-hidden="true" />
              <span>METODOLOGI & INTEGRITAS DATA</span>
            </div>
            <h2>Data yang terbuka untuk dipahami.</h2>
            <p>
              Baca sumber, cakupan tahun, dan konteks spasial sebelum menarik kesimpulan kebijakan.
            </p>
          </div>

          <div className="about-grid">
            <div className="about-card">
              <h3>Sumber Indikator</h3>
              <p>
                Nilai indikator berasal dari dataset resmi (Dataset Dashboard 040526.xlsx). Tahun indikator mengikuti ketersediaan instansi penyedia data asal, bukan tahun pembaruan batas kartografi. Nilai kosong berarti belum tersedia dan tidak dianggap nol.
              </p>
            </div>

            <div className="about-card">
              <h3>Konteks Spasial & Batas BIG</h3>
              <p>
                Batas wilayah merujuk pada data spasial Badan Informasi Geospasial (BIG) per Juni 2026. Geometri disederhanakan secara topologis untuk performa visualisasi web interaktif, bukan untuk penetapan batas hukum agraria mutlak.
              </p>
            </div>

            <div className="about-card">
              <h3>Pemekaran Wilayah & Tren</h3>
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
