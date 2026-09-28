import PublicShell from '@/components/public/public-shell';
import '@/components/data/data-pages.css';
import './public.css';
export default function PublicLayout({ children }: { children: React.ReactNode }) { return <PublicShell>{children}</PublicShell>; }
