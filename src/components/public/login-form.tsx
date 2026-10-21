"use client";
import Image from "next/image";
import "./auth-presentation.css";
import {useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,ArrowRight,LoaderCircle} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {AuthField} from './auth-field';
import {api} from '@/lib/api-client';
export default function LoginForm(){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 return <section className="public-auth"><div className="public-auth-intro"><Link href="/" className="auth-back-link"><ArrowLeft size={16}/>Kembali ke beranda</Link><Image className="auth-brand" loading="eager" src="/brin-logo-white.svg" alt="Badan Riset dan Inovasi Nasional" width={126} height={49}/><p className="public-eyebrow">Akses PRPDN</p><h1>Selamat datang kembali.</h1><p className="auth-intro-desc">Masuk dengan akun PRPDN untuk mengelola dan meninjau data sesuai hak akses Anda.</p><p className="auth-institution">Pusat Riset Pemerintahan Dalam Negeri<br/>Badan Riset dan Inovasi Nasional</p></div><form className="public-auth-form" aria-busy={busy} onSubmit={async e=>{e.preventDefault();if(busy)return;const form=new FormData(e.currentTarget);setBusy(true);setError('');try{const identity=String(form.get('identity')).trim();await api(`/api/auth/sign-in/${identity.includes('@')?'email':'username'}`,'POST',{[identity.includes('@')?'email':'username']:identity,password:String(form.get('password'))});const next=new URLSearchParams(window.location.search).get('next');window.location.assign(next?.startsWith('/admin/')?next:'/admin/import/');}catch{setError('Tidak dapat masuk. Periksa identitas/kata sandi, status akun, atau coba kembali setelah beberapa saat.');setBusy(false);}}}>
 <h2>Masuk ke ruang kerja</h2><AuthField label="Email atau username" name="identity" autoComplete="username" required maxLength={191} disabled={busy}/><AuthField label="Kata sandi" name="password" type="password" autoComplete="current-password" required maxLength={128} disabled={busy}/>{error&&<p className="auth-form-error" role="alert">{error}</p>}<Button type="submit" disabled={busy} className="auth-submit-btn">{busy?<LoaderCircle className="auth-loading-icon" size={18} aria-hidden="true"/>:<ArrowRight size={18} aria-hidden="true"/>}<span aria-live="polite">{busy?'Memeriksa akun…':'Masuk'}</span></Button><p className="muted-note">Akses pengelolaan data mengikuti peran dan persetujuan akun Anda.</p><div className="auth-toggle-row">Belum memiliki akun? <Link href="/register">Daftar</Link></div></form></section>;
}
