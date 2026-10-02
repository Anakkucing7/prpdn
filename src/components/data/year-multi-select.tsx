"use client";

export function YearMultiSelect({ years, selected, onToggle }: {
  years: number[];
  selected: number[];
  onToggle: (year: number) => void;
}) {
  return <details className="year-multi-select">
    <summary><span>Tahun</span><small>Max 3</small><strong>{selected.join(", ") || "Pilih tahun"}</strong></summary>
    <fieldset aria-label="Pilih maksimal tiga tahun">
      <legend className="sr-only">Pilih maksimal tiga tahun</legend>
      {years.map(year => <label key={year}>
        <input type="checkbox" checked={selected.includes(year)} disabled={selected.includes(year) ? selected.length === 1 : selected.length >= 3} onChange={() => onToggle(year)} />
        <span>{year}</span>
      </label>)}
      <small>Maksimal tiga tahun dapat dipilih.</small>
    </fieldset>
  </details>;
}
