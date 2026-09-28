import IdsdPage from "@/components/data/idsd-page";
import {readIdsd} from '@/server/services/analytical-read';
export const dynamic='force-dynamic';
import "@/components/data/data-pages.css";

export const metadata = { title: "Data IDSD" };
export default async function Page() { return <IdsdPage data={await readIdsd()} />; }
