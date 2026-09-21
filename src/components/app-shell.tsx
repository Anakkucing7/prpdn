"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Menu, PanelLeftClose, PanelLeftOpen, Info } from "lucide-react";
import { navigation, foundationItem, type NavigationItem } from "@/lib/navigation";
import { demoUser } from "@/data/fixtures";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

function Navigation({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const itemLink = (item: NavigationItem) => <Link key={item.slug} href={`/admin/${item.slug}`} onClick={onNavigate}
    aria-current={pathname.replace(/\/$/, "") === `/admin/${item.slug}` ? "page" : undefined} title={collapsed ? item.label : undefined} className="nav-item">
    <item.icon aria-hidden="true" /><span className={collapsed ? "sr-only" : "nav-label"}>{item.label}</span>
  </Link>;
  return <nav aria-label="Navigasi utama" className="navigation">
    <div className="navigation-groups">{navigation.map(group => <div className="nav-group" key={group.label}>
      {group.label !== "Ringkasan" ? <p className={collapsed ? "sr-only" : "nav-group-label"}>{group.label}</p> : null}
      {group.items.map(itemLink)}
    </div>)}</div>
    <div className="navigation-bottom">{itemLink(foundationItem)}{!collapsed ? <p className="sidebar-footnote">Prototipe antarmuka · Fase 2</p> : null}</div>
  </nav>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return <div className={cn("app-shell", collapsed && "sidebar-collapsed")}>
    <a href="#main-content" className="skip-link">Lewati ke konten utama</a>
    <aside className="desktop-sidebar">
      <Link href="/admin/dashboard" className="brand" aria-label="PRPDN, dashboard"><strong>{collapsed ? "P" : "PRPDN"}<span className="brand-accent" /></strong>{!collapsed ? <span>Data pembangunan daerah</span> : null}</Link>
      <Navigation collapsed={collapsed} />
    </aside>
    <div className="workspace">
      <header className="topbar">
        <div className="topbar-start">
          <Button variant="ghost" size="icon" className="desktop-collapse" aria-label={collapsed ? "Perluas navigasi" : "Ringkas navigasi"} title={collapsed ? "Perluas navigasi" : "Ringkas navigasi"} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</Button>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="mobile-menu" aria-label="Buka navigasi"><Menu /></Button></SheetTrigger>
            <SheetContent side="left" className="navigation-sheet">
              <SheetHeader><SheetTitle>PRPDN</SheetTitle><SheetDescription>Data pembangunan daerah</SheetDescription></SheetHeader>
              <Navigation onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="workspace-label">Ruang kerja administrasi</span>
        </div>
        <div className="topbar-end"><Badge variant="outline" className="prototype-badge">Prototipe frontend</Badge>
          <Dialog><DialogTrigger asChild><Button variant="ghost" className="profile-button" aria-label="Informasi akun demo"><span className="avatar">{demoUser.initials}</span><span className="profile-name">{demoUser.name}</span><ChevronDown data-icon="inline-end" /></Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Akun demonstrasi</DialogTitle><DialogDescription>Identitas ini digunakan untuk pratinjau antarmuka.</DialogDescription></DialogHeader><dl className="facts"><div><dt>Nama</dt><dd>{demoUser.name}</dd></div><div><dt>Peran</dt><dd>{demoUser.role}</dd></div></dl><p className="muted-note"><Info aria-hidden="true" />Belum ada autentikasi atau pengelolaan akun aktif.</p></DialogContent>
          </Dialog>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="main-content">{children}<footer className="page-footer"><span>PRPDN</span><span>Prototipe frontend · Fase 2</span></footer></main>
    </div>
  </div>;
}
