"use client";

import { useId } from "react";
import { RotateCcw } from "lucide-react";
import { regions, regionSource } from "@/data/fixtures";
import { SelectField, RegionDrawer } from "@/components/ui-patterns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";

export type RegionFilter = { query: string; level: string };
export const defaultRegionFilter: RegionFilter = { query: "", level: "PROV" };

export function RegionFilters({ value, onChange }: { value: RegionFilter; onChange: (value: RegionFilter) => void }) {
  const id = useId();
  return <div className="filter-toolbar" role="search" aria-label="Filter sampel wilayah">
    <Field><FieldLabel htmlFor={id}>Cari wilayah</FieldLabel><Input id={id} type="search" placeholder="Nama atau kode wilayah" value={value.query} onChange={event => onChange({ ...value, query: event.target.value })} /></Field>
    <SelectField label="Level wilayah" value={value.level} onValueChange={level => onChange({ ...value, level })} options={[{ value: "all", label: "Semua level" }, { value: "PROV", label: "Provinsi" }, { value: "KAB", label: "Kabupaten" }]} />
    <Button variant="ghost" onClick={() => onChange(defaultRegionFilter)}><RotateCcw data-icon="inline-start" />Reset</Button>
  </div>;
}

export function RegionExample({ filter, onReset }: { filter: RegionFilter; onReset: () => void }) {
  const query = filter.query.trim().toLocaleLowerCase("id");
  const visible = regions.filter(region => (filter.level === "all" || region.level === filter.level) && `${region.code} ${region.name}`.toLocaleLowerCase("id").includes(query));
  return <Card><CardHeader><CardTitle><h2>Contoh data wilayah</h2></CardTitle><CardDescription>Sampel terbatas untuk mencoba filter dan detail.</CardDescription></CardHeader>
    <CardContent>
      {visible.length ? <div className="table-scroll" tabIndex={0} role="region" aria-label="Tabel sampel wilayah, dapat digulir horizontal"><table className="sample-table">
        <caption className="sr-only">Sampel wilayah dari dim_wilayah</caption>
        <thead><tr><th scope="col">Kode</th><th scope="col">Nama wilayah</th><th scope="col">Level</th><th scope="col">Aksi</th></tr></thead>
        <tbody>{visible.map(region => <tr key={region.code}><td>{region.code}</td><td>{region.name}</td><td>{region.level === "PROV" ? "Provinsi" : "Kabupaten"}</td><td><RegionDrawer region={region}><Button variant="link" aria-label={`Lihat detail ${region.name}`}>Lihat detail</Button></RegionDrawer></td></tr>)}</tbody>
      </table></div> : <Empty><EmptyHeader><EmptyTitle>Tidak ada hasil</EmptyTitle><EmptyDescription>Ubah kata pencarian atau level wilayah.</EmptyDescription></EmptyHeader><EmptyContent><Button variant="outline" onClick={onReset}>Reset filter</Button></EmptyContent></Empty>}
      <p className="result-count" role="status">{visible.length} dari {regions.length} sampel wilayah ditampilkan</p>
    </CardContent><CardFooter><p className="source-line">Sumber: {regionSource.sheet} · {regionSource.workbook}</p></CardFooter>
  </Card>;
}
