"use client";

import { useId, useRef, useState } from "react";
import { Info, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel, FieldDescription, FieldError, FieldGroup } from "@/components/ui/field";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SelectField } from "@/components/ui-patterns";

export function NoteDialog({ children, onSave }: { children: React.ReactNode; onSave: (note: string) => void }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState(false);
  const id = useId();
  const input = useRef<HTMLTextAreaElement>(null);
  return <Dialog open={open} onOpenChange={value => { setOpen(value); if (!value) { setNote(""); setError(false); } }}>
    <DialogTrigger asChild>{children}</DialogTrigger><DialogContent>
      <DialogHeader><DialogTitle>Catatan pratinjau</DialogTitle><DialogDescription>Coba form pendek. Catatan hanya disimpan selama halaman ini terbuka.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={event => { event.preventDefault(); if (!note.trim()) { setError(true); input.current?.focus(); return; } onSave(note.trim()); setOpen(false); setNote(""); setError(false); }}>
        <FieldGroup><Field data-invalid={error}><FieldLabel htmlFor={id}>Catatan <span className="required">*</span></FieldLabel>
          <Textarea id={id} ref={input} value={note} maxLength={300} required aria-invalid={error} aria-describedby={error ? `${id}-error` : `${id}-hint`} onChange={event => { setNote(event.target.value); setError(false); }} placeholder="Tuliskan catatan untuk pratinjau ini" />
          {error ? <FieldError id={`${id}-error`}>Isi catatan sebelum menyimpan.</FieldError> : <FieldDescription id={`${id}-hint`}>Maksimal 300 karakter.</FieldDescription>}
        </Field></FieldGroup>
        <DialogFooter className="mt-6"><DialogClose asChild><Button type="button" variant="outline">Batal</Button></DialogClose><Button type="submit">Simpan catatan</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

export function FormExample() {
  const id = useId();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [period, setPeriod] = useState("2024");
  const [checked, setChecked] = useState(false);
  const [errors, setErrors] = useState({ title: false, checked: false });
  const [saved, setSaved] = useState<{ title: string; note: string; period: string } | null>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const checkbox = useRef<HTMLButtonElement>(null);
  function reset() { setTitle(""); setNote(""); setPeriod("2024"); setChecked(false); setErrors({ title: false, checked: false }); setSaved(null); }
  return <div className="form-grid">
    <Card><CardHeader><CardTitle><h2>Form pratinjau</h2></CardTitle><CardDescription>Contoh label, pilihan, validasi, dan kontrol nonaktif.</CardDescription></CardHeader><CardContent>
      <form noValidate onSubmit={event => { event.preventDefault(); const next = { title: !title.trim(), checked: !checked }; setErrors(next); if (next.title) { titleInput.current?.focus(); return; } if (next.checked) { checkbox.current?.focus(); return; } setSaved({ title: title.trim(), note: note.trim(), period }); }}>
        <FieldGroup>
          <Field data-invalid={errors.title}><FieldLabel htmlFor={`${id}-title`}>Nama tampilan <span className="required">*</span></FieldLabel><Input ref={titleInput} id={`${id}-title`} maxLength={100} required value={title} aria-invalid={errors.title} aria-describedby={errors.title ? `${id}-title-error` : undefined} onChange={event => { setTitle(event.target.value); setErrors({ ...errors, title: false }); }} placeholder="Contoh: Tinjauan pembangunan daerah" />{errors.title ? <FieldError id={`${id}-title-error`}>Nama tampilan wajib diisi.</FieldError> : null}</Field>
          <SelectField label="Tahun data contoh" value={period} onValueChange={setPeriod} options={[{ value: "2022", label: "2022" }, { value: "2023", label: "2023" }, { value: "2024", label: "2024" }, { value: "2025", label: "2025 · belum tersedia untuk IDSD", disabled: true }]} />
          <Field data-disabled><FieldLabel htmlFor={`${id}-source`}>Sumber data</FieldLabel><Input id={`${id}-source`} value="Dataset Dashboard 040526.xlsx" disabled /><FieldDescription>Sumber pada contoh ini tidak dapat diubah.</FieldDescription></Field>
          <Field><FieldLabel htmlFor={`${id}-note`}>Keterangan <span className="example-label">(opsional)</span></FieldLabel><Textarea id={`${id}-note`} value={note} maxLength={300} onChange={event => setNote(event.target.value)} placeholder="Tambahkan konteks untuk pratinjau" /></Field>
          <Field data-invalid={errors.checked}><Field orientation="horizontal"><Checkbox id={`${id}-check`} ref={checkbox} checked={checked} aria-invalid={errors.checked} aria-required="true" aria-describedby={errors.checked ? `${id}-check-error` : undefined} onCheckedChange={value => { setChecked(value === true); setErrors({ ...errors, checked: false }); }} /><FieldLabel htmlFor={`${id}-check`}>Saya memahami bahwa perubahan ini hanya untuk demonstrasi.</FieldLabel></Field>{errors.checked ? <FieldError id={`${id}-check-error`}>Konfirmasikan penggunaan demonstrasi.</FieldError> : null}</Field>
        </FieldGroup><div className="form-actions"><Button type="submit">Simpan pratinjau</Button><Button type="button" variant="outline" onClick={reset}>Reset form</Button></div>
      </form>
    </CardContent></Card>
    <Card><CardHeader><CardTitle><h2>Hasil pratinjau</h2></CardTitle><CardDescription>Hasil dari form ditampilkan di sini.</CardDescription></CardHeader><CardContent>
      <div role="status">{saved ? <div className="panel-stack"><Alert className="success-alert"><Check /><AlertDescription>Pratinjau disimpan untuk sesi ini.</AlertDescription></Alert><dl className="facts"><div><dt>Nama tampilan</dt><dd>{saved.title}</dd></div><div><dt>Tahun</dt><dd>{saved.period}</dd></div><div><dt>Keterangan</dt><dd className="form-preview">{saved.note || "Tidak diisi"}</dd></div></dl></div> : <Alert className="info-alert"><Info /><AlertDescription>Lengkapi form untuk melihat hasilnya. Tidak ada perubahan pada workbook sumber.</AlertDescription></Alert>}</div>
    </CardContent></Card>
  </div>;
}
