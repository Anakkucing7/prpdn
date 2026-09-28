"use client";
import {useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,ArrowRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {api} from '@/lib/api-client';
export default function LoginForm(){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 return <section className="public-auth"><div className="public-auth-intro"><Link href="/" className="auth-back-link"><ArrowLeft size={16}/>Kembali ke beranda</Link><p className="public-eyebrow">Akses PRPDN</p><h1>Selamat datang kembali.</h1><p className="auth-intro-desc">Masuk dengan akun PRPDN untuk mengelola dan meninjau data sesuai hak akses Anda.</p></div><form className="public-auth-form" onSubmit={async e=>{e.preventDefault();const form=new FormData(e.currentTarget);setBusy(true);setError('');try{const identity=String(form.get('identity')).trim();await api(`/api/auth/sign-in/${identity.includes('@')?'email':'username'}`,'POST',{[identity.includes('@')?'email':'username']:identity,password:String(form.get('password'))});const next=new URLSearchParams(window.location.search).get('next');window.location.assign(next?.startsWith('/admin/')?next:'/admin/import/');}catch{setError('Tidak dapat masuk. Periksa identitas/kata sandi, status akun, atau coba kembali setelah beberapa saat.');setBusy(false);}}}>
 <h2>Masuk</h2><label className="auth-field"><span>Email atau username *</span><Input name="identity" autoComplete="username" required maxLength={191} disabled={busy}/></label><label className="auth-field"><span>Kata sandi *</span><Input name="password" type="password" autoComplete="current-password" required maxLength={128} disabled={busy}/></label>{error&&<p role="alert">{error}</p>}<Button type="submit" disabled={busy} className="auth-submit-btn">{busy?'Memeriksa akun…':'Masuk'}<ArrowRight size={16}/></Button><p className="muted-note">Hak import, validasi, dan ekspor diperiksa kembali oleh server pada setiap operasi.</p><div className="auth-toggle-row"><Link href="/register">Daftar</Link></div></form></section>;
}
