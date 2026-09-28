"use client";
import { SelectField } from '@/components/ui-patterns';
import { regions, provinceOptions } from '@/lib/regions';
export function RegionLevel({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className="region-level"><span>Level wilayah</span><div className="segment-control" role="group" aria-label="Level wilayah">{[['PROV','Provinsi'],['KABKOTA','Kabupaten/Kota']].map(([code,label]) => <button type="button" key={code} aria-pressed={value===code} onClick={() => { if(value !== code) onChange(code); }}>{label}</button>)}</div></div>;
}
export function RegionalControls({ level, province, kind, selected, onChange }: { level: string; province: string; kind: string; selected: string; onChange: (field: 'province'|'kind'|'region', value: string) => void }) {
  const options = regions.filter(r => r.level !== 'PROV' && (province==='all'||r.provinceCode===province) && (kind==='all'||r.level===kind));
  return <><SelectField label="Provinsi" value={province} onValueChange={v=>onChange('province',v)} options={provinceOptions} />{level==='KABKOTA' && <><SelectField label="Jenis" value={kind} onValueChange={v=>onChange('kind',v)} options={[{value:'all',label:'Semua'},{value:'KAB',label:'Kabupaten'},{value:'KOTA',label:'Kota'}]} /><SelectField label="Kabupaten/Kota" value={options.some(r=>r.code===selected)?selected:'all'} onValueChange={v=>onChange('region',v)} options={[{value:'all',label:'Semua kabupaten/kota'},...options.map(r=>({value:r.code,label:r.name}))]} /></> }</>;
}
