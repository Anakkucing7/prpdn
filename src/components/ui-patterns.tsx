"use client";

import { useId } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { regionSource, type Region } from "@/data/fixtures";

export function StatusBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "success" | "warning" | "error" | "planning" | "neutral" }) {
  return <Badge variant="secondary" className="status-badge" data-tone={tone}><span className="status-dot" aria-hidden="true" />{children}</Badge>;
}

export function SelectField({ label, value, onValueChange, options, disabled = false }: {
  label: string; value: string; onValueChange: (value: string) => void;
  options: { value: string; label: string; disabled?: boolean }[]; disabled?: boolean;
}) {
  const id = useId();
  return <Field data-disabled={disabled}><FieldLabel htmlFor={id}>{label}</FieldLabel>
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger id={id}><SelectValue /></SelectTrigger>
      <SelectContent position="popper"><SelectGroup>{options.map(option => <SelectItem key={option.value} value={option.value} disabled={option.disabled}>{option.label}</SelectItem>)}</SelectGroup></SelectContent>
    </Select>
  </Field>;
}

export function RegionDrawer({ region, children }: { region: Region; children: React.ReactNode }) {
  return <Sheet><SheetTrigger asChild>{children}</SheetTrigger>
    <SheetContent className="detail-sheet">
      <SheetHeader><SheetTitle>{region.name}</SheetTitle><SheetDescription>Detail wilayah · kode {region.code}</SheetDescription></SheetHeader>
      <div className="detail-body"><div><StatusBadge tone={region.active ? "success" : "neutral"}>{region.active ? "Aktif" : "Nonaktif"}</StatusBadge></div>
        <dl className="facts">
          <div><dt>Kode wilayah</dt><dd>{region.code}</dd></div>
          <div><dt>Level</dt><dd>{region.level === "PROV" ? "Provinsi" : "Kabupaten"}</dd></div>
          <div><dt>Provinsi</dt><dd>{region.province}</dd></div>
          <div><dt>Pulau / region</dt><dd>{region.island}</dd></div>
          <div><dt>Status spasial</dt><dd>Belum diperiksa</dd></div>
          <div><dt>Terakhir diperbarui</dt><dd>Tidak tersedia di sumber</dd></div>
        </dl>
        <div><h3 className="subheading">Sumber data</h3><p className="source-line">{regionSource.workbook}<br />Sheet {regionSource.sheet}, baris {region.sourceRow}.</p></div>
        <p className="muted-note">Sampel dari workbook. Status aktif tidak menunjukkan bahwa geometri sudah valid.</p>
      </div>
      <SheetFooter><SheetClose asChild><Button variant="outline">Tutup detail</Button></SheetClose></SheetFooter>
    </SheetContent>
  </Sheet>;
}

export function ConfirmationDialog({ children, title, description, confirmLabel, onConfirm }: {
  children: React.ReactNode; title: string; description: string; confirmLabel: string; onConfirm: () => void;
}) {
  return <AlertDialog><AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader>
      <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={onConfirm}>{confirmLabel}</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
