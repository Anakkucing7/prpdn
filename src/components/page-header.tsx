import Link from "next/link";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export function PageHeader({ title, description, parent, actions }: { title: string; description?: string; parent?: string; actions?: React.ReactNode }) {
  return <header className="page-header">
    <Breadcrumb><BreadcrumbList>
      <BreadcrumbItem><BreadcrumbLink asChild><Link href="/admin/foundation">PRPDN</Link></BreadcrumbLink></BreadcrumbItem>
      <BreadcrumbSeparator />
      {parent ? <><BreadcrumbItem><span>{parent}</span></BreadcrumbItem><BreadcrumbSeparator /></> : null}
      <BreadcrumbItem><BreadcrumbPage>{title}</BreadcrumbPage></BreadcrumbItem>
    </BreadcrumbList></Breadcrumb>
    <div className="page-heading-row"><div><h1 tabIndex={-1} id="page-title">{title}</h1>{description ? <p>{description}</p> : null}</div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  </header>;
}
