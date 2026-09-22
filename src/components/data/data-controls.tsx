"use client";

import { useId, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";

export function DataFilters({ children, query, onQuery, onReset, summary }: { children: React.ReactNode; query: string; onQuery: (query: string) => void; onReset: () => void; summary: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return <section className="data-filter-section" aria-label="Pencarian dan filter">
    <div className="data-search-row"><Field><FieldLabel htmlFor={`${id}-search`}>Cari wilayah</FieldLabel><div className="data-search"><Search aria-hidden="true" /><Input id={`${id}-search`} type="search" placeholder="Nama atau kode wilayah" value={query} onChange={e => onQuery(e.target.value)} /></div></Field><Button className="data-filter-toggle" variant="outline" aria-expanded={open} aria-controls={`${id}-filters`} onClick={() => setOpen(!open)}><SlidersHorizontal />Filter<ChevronDown className={open ? "rotate-180" : ""} /></Button></div>
    <div className="data-filter-fields" id={`${id}-filters`} data-open={open}>{children}<Button variant="ghost" onClick={onReset}><RotateCcw />Reset filter</Button></div>
    <p className="data-filter-summary">{summary}</p>
  </section>;
}

export function Pagination({ page, total, size, onPage }: { page: number; total: number; size: number; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  return <div className="data-pagination"><p role="status">{total ? `${(page - 1) * size + 1}–${Math.min(page * size, total)} dari ${total}` : "0 hasil"}</p><nav aria-label="Halaman tabel"><Button variant="outline" size="icon" aria-label="Halaman sebelumnya" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft /></Button><span>{page} / {pages}</span><Button variant="outline" size="icon" aria-label="Halaman berikutnya" disabled={page >= pages} onClick={() => onPage(page + 1)}><ChevronRight /></Button></nav></div>;
}

export function NoResults({ onReset }: { onReset: () => void }) {
  return <div className="data-empty" role="status"><Search aria-hidden="true" /><h3>Tidak ada hasil</h3><p>Ubah pencarian atau reset filter untuk menampilkan data.</p><Button variant="outline" onClick={onReset}>Reset filter</Button></div>;
}
