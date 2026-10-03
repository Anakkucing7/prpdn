"use client";

import Link from "next/link";
import { usePathname,useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, PanelLeftClose, PanelLeftOpen, Globe } from "lucide-react";
import { navigation, type NavigationItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {api} from '@/lib/api-client';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

function Navigation({ collapsed = false, onNavigate, roleId, description }: { collapsed?: boolean; onNavigate?: () => void; roleId?: string; description:string }) {
  const pathname = usePathname();
  const itemLink = (item: NavigationItem) => <Link key={item.slug} href={`/admin/${item.slug}`} onClick={onNavigate}
    aria-current={pathname.replace(/\/$/, "") === `/admin/${item.slug}` ? "page" : undefined} title={collapsed ? item.label : undefined} className="nav-item">
    <item.icon aria-hidden="true" /><span className={collapsed ? "sr-only" : "nav-label"}>{item.label}</span>
  </Link>;
  return <nav aria-label="Navigasi utama" className="navigation">
    <div className="navigation-groups">{navigation.map(group => <div className="nav-group" key={group.label}>
      {group.label !== "Ringkasan" ? <p className={collapsed ? "sr-only" : "nav-group-label"}>{group.label}</p> : null}
      {group.items.filter(item => item.slug!=='activity'||['administrator','super-admin'].includes(roleId??'')).filter(item => item.slug!=='roles'||roleId==='super-admin').map(itemLink)}
    </div>)}</div>
    <div className="navigation-bottom"><Link href="/" onClick={onNavigate} className="nav-item" title={collapsed ? "Lihat Situs Publik" : undefined}><Globe aria-hidden="true" /><span className={collapsed ? "sr-only" : "nav-label"}>Lihat Situs Publik</span></Link>{!collapsed ? <p className="sidebar-footnote">{description}</p> : null}</div>
  </nav>;
}

export function AppShell({ children,profile,branding={name:'PRPDN',description:'Data pembangunan daerah'} }: { children: React.ReactNode;profile?:{name:string;role:string;roleId?:string};branding?:{name:string;description:string} }) {
  const router=useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountError,setAccountError]=useState('');
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1280px)");
    const closeMobileNavigation = (event: MediaQueryListEvent) => { if (event.matches) setMobileOpen(false); };
    desktop.addEventListener("change", closeMobileNavigation);
    return () => desktop.removeEventListener("change", closeMobileNavigation);
  }, []);
  return <div className={cn("app-shell", collapsed && "sidebar-collapsed")}>
    <a href="#main-content" className="skip-link">Lewati ke konten utama</a>
    <aside className="desktop-sidebar">
      <Link href="/admin/dashboard" className="brand" aria-label={`${branding.name}, dashboard`} title={branding.name}><strong>{collapsed ? branding.name.slice(0,1) : branding.name}<span className="brand-accent" /></strong>{!collapsed ? <span>{branding.description}</span> : null}</Link>
      <Navigation collapsed={collapsed} roleId={profile?.roleId} description={branding.description} />
    </aside>
    <div className="workspace">
      <header className="topbar">
        <div className="topbar-start">
          <Button variant="ghost" size="icon" className="desktop-collapse" aria-label={collapsed ? "Perluas navigasi" : "Ringkas navigasi"} title={collapsed ? "Perluas navigasi" : "Ringkas navigasi"} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</Button>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="mobile-menu" aria-label="Buka navigasi"><Menu /></Button></SheetTrigger>
            <SheetContent side="left" className="navigation-sheet">
              <SheetHeader><SheetTitle>{branding.name}</SheetTitle><SheetDescription>{branding.description}</SheetDescription></SheetHeader>
              <Navigation roleId={profile?.roleId} description={branding.description} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="workspace-label">Ruang kerja administrasi</span>
        </div>
        <div className="topbar-end">
          <Dialog><DialogTrigger asChild><Button variant="ghost" className="profile-button" aria-label="Informasi akun"><span className="avatar">{profile?.name.slice(0,2).toUpperCase()||'P'}</span><span className="profile-name">{profile?.name||'Belum masuk'}</span><ChevronDown data-icon="inline-end" /></Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Akun PRPDN</DialogTitle><DialogDescription>{profile?'Sesi akun yang sedang aktif.':'Masuk untuk menggunakan layanan administrasi.'}</DialogDescription></DialogHeader>{profile?<><dl className="facts"><div><dt>Nama</dt><dd>{profile.name}</dd></div><div><dt>Peran</dt><dd>{profile.role}</dd></div></dl><Button variant="outline" onClick={async()=>{try{await api('/api/auth/sign-out','POST',{});router.replace('/login/');router.refresh();}catch{setAccountError('Tidak dapat keluar. Coba kembali.');}}}>Keluar</Button>{accountError&&<p role="alert">{accountError}</p>}</>:<Button asChild><Link href="/login/">Masuk</Link></Button>}</DialogContent>
          </Dialog>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="main-content">{children}<footer className="page-footer"><span>{branding.name}</span><span>Ruang kerja administrasi</span></footer></main>
    </div>
  </div>;
}
