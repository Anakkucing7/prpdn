"use client";
import { useEffect, useId, useRef } from 'react';

export function YearMultiSelect({ years, selected, onToggle }: {
  years: number[];
  selected: number[];
  onToggle: (year: number) => void;
}) {
  const id = useId();
  const details = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (details.current && !details.current.contains(event.target as Node)) details.current.open = false;
    }
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);
  return <div className="year-filter"><span id={id}>Tahun perbandingan</span><details ref={details} className="year-multi-select" onKeyDown={event => {
    if (event.key === 'Escape') { details.current!.open = false; details.current!.querySelector('summary')?.focus(); }
  }}>
    <summary aria-labelledby={`${id} ${id}-value`}><strong id={`${id}-value`}>{selected.join(", ") || "Pilih tahun"}</strong></summary>
    <fieldset aria-label="Pilih maksimal tiga tahun">
      <legend className="sr-only">Pilih maksimal tiga tahun</legend>
      {years.map(year => <label key={year}>
        <input type="checkbox" checked={selected.includes(year)} disabled={selected.includes(year) ? selected.length === 1 : selected.length >= 3} onChange={() => onToggle(year)} />
        <span>{year}</span>
      </label>)}
      <small>Pilih 1–3 tahun. Ganti warna peta melalui tombol tahun di peta.</small>
    </fieldset>
  </details></div>;
}
