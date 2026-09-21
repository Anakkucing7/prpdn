import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return <main className="not-found"><h1>Halaman tidak ditemukan</h1><p>Periksa alamat halaman atau kembali ke fondasi antarmuka.</p><Button asChild><Link href="/admin/foundation">Kembali ke PRPDN</Link></Button></main>;
}
