"use client";
import RegionMap from '@/components/data/region-map';
import type { RegionRecord } from '@/lib/regions';
import { valueColor } from '@/lib/dashboard';
type Props = { rows: {code:string;value:number|null}[]; regions:RegionRecord[]; selected: string; onSelect: (code: string) => void; min: number; max: number; label: string; unit: string; year: number; comparisonYears: number[]; onMapYearChange: (year:number)=>void; descriptions: Record<string,string> };
export default function ProvinceMap(props: Props) {
  return <div className="province-map"><RegionMap regions={props.regions} selected={props.selected} onSelect={props.onSelect} colors={Object.fromEntries(props.rows.map(r => [r.code, valueColor(r.value, props.min, props.max)]))} descriptions={props.descriptions} comparisonYears={props.comparisonYears} mapYear={props.year} onMapYearChange={props.onMapYearChange} /></div>;
}
