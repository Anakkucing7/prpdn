import { Suspense } from "react";
import Dashboard, { DashboardLoading } from "@/components/dashboard/dashboard";
import "./dashboard.css";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return <Suspense fallback={<DashboardLoading />}><Dashboard /></Suspense>;
}
