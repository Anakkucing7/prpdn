"use client";

import { useId, useRef } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { StatusBadge } from "@/components/ui-patterns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

export type DemoOrigin = "workbook" | "edited" | "new";
export function OriginBadge({ origin }: { origin: DemoOrigin }) {
  return <StatusBadge tone={origin === "workbook" ? "neutral" : "planning"}>{origin === "workbook" ? "Workbook" : origin === "edited" ? "Diubah · demo" : "Baru · demo"}</StatusBadge>;
}
export function DemoNotice() {
  return <div className="data-notice"><Info aria-hidden="true" /><p>Mode demo. Tambah, ubah, dan hapus hanya berlaku selama halaman ini terbuka. Memuat ulang atau berpindah halaman akan mengembalikan data workbook. Data di halaman lain tidak berubah.</p></div>;
}
export function MasterField({ label, error, required, ...props }: React.ComponentProps<typeof Input> & { label: string; error?: string }) {
  const id = useId();
  return <Field data-invalid={!!error}><FieldLabel htmlFor={id}>{label}{required && <span className="required"> *</span>}</FieldLabel><Input {...props} id={id} required={required} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />{error && <FieldError id={`${id}-error`}>{error}</FieldError>}</Field>;
}
export function MasterDialog({ title, onClose, opener, children }: { title: string; onClose: () => void; opener: HTMLElement | null; children: React.ReactNode }) {
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="master-dialog" onCloseAutoFocus={event => { event.preventDefault(); if (opener?.isConnected) opener.focus(); else document.getElementById("master-table-title")?.focus(); }}><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Perubahan sementara untuk demo. Workbook tidak diubah. Field bertanda * wajib diisi.</DialogDescription></DialogHeader>{children}</DialogContent></Dialog>;
}
export function MasterForm({ onSubmit, onCancel, children }: { onSubmit: React.FormEventHandler<HTMLFormElement>; onCancel: () => void; children: React.ReactNode }) {
  return <form className="master-form" noValidate onSubmit={onSubmit}><div className="master-form-fields">{children}</div><DialogFooter><Button type="button" variant="outline" onClick={onCancel}>Batal</Button><Button type="submit">Simpan demo</Button></DialogFooter></form>;
}
export function focusInvalid(form: HTMLFormElement, key: string | undefined) {
  if (key) form.querySelector<HTMLInputElement>(`[name="${key}"]`)?.focus();
}
export function MasterDelete({ label, onDelete }: { label: string; onDelete: () => void }) {
  const confirmed = useRef(false);
  return <AlertDialog onOpenChange={open => { if (open) confirmed.current = false; }}><AlertDialogTrigger asChild><Button variant="link" className="master-delete" aria-label={`Hapus ${label}`}>Hapus</Button></AlertDialogTrigger><AlertDialogContent onCloseAutoFocus={event => { if (confirmed.current) { event.preventDefault(); document.getElementById("master-table-title")?.focus(); } }}><AlertDialogHeader><AlertDialogTitle>Hapus dari demo?</AlertDialogTitle><AlertDialogDescription>“{label}” akan dihapus dari daftar sementara. Workbook dan data di halaman lain tetap utuh.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => { confirmed.current = true; onDelete(); }}>Hapus dari demo</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
