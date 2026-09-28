import 'server-only';
import {createHash} from 'node:crypto';
import {Prisma} from '@/generated/prisma/client';
import {type TransferDataset,type TransferRow,type Mapping,type Normalized,type Finding,requiredFields,datasetFields} from '@/lib/data-transfer';
import {HttpError} from '../access';
import {db} from '../db';
type Client=Prisma.TransactionClient;
export async function references(client:Client=db()){
 const [regions,years,pillars,indicators,observations]=await Promise.all([client.region.findMany({select:{code:true,name:true,level:true,metadata:true}}),client.year.findMany(),client.pillar.findMany(),client.indicator.findMany(),client.observation.findMany({select:{dataset:true,regionCode:true,sourceCode:true,year:true,period:true,pillarId:true,indicator:true,unit:true,category:true,value:true,endValue:true,id:true}})]);
 const existingKeys=new Map<string,number>();for(const row of observations){const key=identity(row);existingKeys.set(key,(existingKeys.get(key)||0)+1);}
 return {regions,years,pillars,indicators,observations,existingKeys};
}
type References=Awaited<ReturnType<typeof references>>;
const text=(value:unknown)=>value===null||value===undefined?'':String(value).trim();
const canonicalName=(value:string)=>value.toLocaleUpperCase('id').replace(/^(PROVINSI |PEMERINTAH )+/,'').replace(/^DKI JAKARTA$/,'DAERAH KHUSUS IBUKOTA JAKARTA').replace(/^DI YOGYAKARTA$/,'DAERAH ISTIMEWA YOGYAKARTA');
export function validateMapping(mapping:Mapping,columns:string[],dataset:TransferDataset){
 const selected=Object.values(mapping).filter(Boolean);
 if(Object.keys(mapping).some(k=>!datasetFields(dataset).includes(k as keyof Mapping))||selected.some(c=>!columns.includes(c))||new Set(selected).size!==selected.length||requiredFields(dataset).some(f=>!mapping[f]))throw new HttpError(422,'Petakan field wajib ke kolom sumber yang berbeda dan tersedia.');
}
export function identity(row:{dataset:string;code?:string;regionCode?:string|null;sourceCode?:string|null;year:number|null;period:string|null;pillarId:number|null;indicator:string|null;unit:string|null;category:string|null}){
 return createHash('sha256').update(JSON.stringify([row.dataset,row.code??row.regionCode??row.sourceCode,row.year,row.period,row.pillarId,row.indicator,row.unit,row.dataset==='rpjmd'?row.category:null])).digest('hex');
}
export function normalize(raw:TransferRow,mapping:Mapping,dataset:TransferDataset,refs:References){
 const get=(field:keyof Mapping)=>text(raw[mapping[field]||'']);
 const findings:Finding[]=[];
 const issue=(severity:Finding['severity'],code:string,message:string)=>findings.push({severity,code,message});
 const numeric=(field:keyof Mapping,required=false)=>{
  const value=get(field);if(!value){if(required)issue('WARNING','MISSING_VALUE','Nilai kosong dipertahankan sebagai NULL; tinjau sebelum menerima.');return null;}
  if(!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(value)){issue('ERROR','NUMBER',`${field}: gunakan angka desimal tanpa pemisah ribuan.`);return null;}
  const decimal=new Prisma.Decimal(value.replace(',','.'));
  if(decimal.abs().gte('100000000000000')){issue('ERROR','PRECISION',`${field}: maksimum 14 digit bulat.`);return null;}
  if(decimal.decimalPlaces()>10){issue('WARNING','PRECISION',`${field}: dibulatkan ke 10 digit desimal sesuai presisi database; angka asli tetap disimpan.`);return decimal.toDecimalPlaces(10).toFixed();}
  return decimal.toFixed();
 };
 const code=get('code'),region=refs.regions.find(r=>r.code===code);
 if(!region)issue('ERROR','REGION','Kode wilayah tidak ditemukan. Nama tidak dipakai untuk menebak kode.');
 const sourceName=get('name');
 if(region&&sourceName){const metadata=region.metadata as Record<string,unknown>;if(![region.name,metadata.name].some(n=>canonicalName(text(n))===canonicalName(sourceName)))issue('ERROR','REGION_NAME','Nama sumber berbeda dari nama untuk kode wilayah ini. Konfirmasikan lalu koreksi kode atau nama.');}
 if(region&&!['idsd','idsd-pillar'].includes(dataset)&&region.level!=='PROV')issue('ERROR','LEVEL','Dataset ini mendukung tingkat provinsi.');
 const yearText=get('year'),yearRef=refs.years.find(y=>String(y.year)===yearText||String(y.id)===yearText),year=yearRef?.year??Number(yearText);
 if(!/^\d{4}$/.test(String(year))||!yearRef)issue('ERROR','YEAR','Tahun harus tersedia pada Master Tahun; tambahkan master sebelum import.');
 const value=numeric('value',true),endValue=numeric('endValue'),population=numeric('population'),povertyLine=numeric('povertyLine');
 if(value!==null&&Number(value)===0)issue('WARNING','ZERO','Nilai nol dipertahankan; konfirmasikan maknanya dalam catatan tinjauan.');
 if(value!==null&&((['idsd','idsd-pillar'].includes(dataset)&&(Number(value)<0||Number(value)>5))||(dataset==='poverty'&&(Number(value)<0||Number(value)>100))))issue('ERROR','RANGE','Nilai di luar rentang dataset (IDSD 0–5; persentase 0–100).');
 if(value!==null&&dataset==='idsd'&&Number(value)>0&&Number(value)<1)issue('WARNING','IDSD_RANGE','Skor IDSD di bawah 1; periksa aturan sumber sebelum menerima.');
 const pillarId=dataset==='idsd-pillar'?Number(get('pillarId')):null;
 if(dataset==='idsd-pillar'&&!refs.pillars.some(p=>p.id===pillarId))issue('ERROR','PILLAR','ID pilar tidak ditemukan pada master.');
 const indicator=dataset==='rpjmd'?get('indicator')||null:null,unit=dataset==='rpjmd'?get('unit'):dataset==='poverty'?'%':dataset==='kfd'?'rasio':'skor';
 const category=get('category')||null;
 if(dataset==='rpjmd'&&(!indicator||!unit||!category))issue('ERROR','REQUIRED','Indikator, satuan, dan tipe RPJMD wajib terisi.');
 if(dataset==='rpjmd'&&indicator&&!refs.indicators.some(i=>i.name===indicator)&&!refs.observations.some(o=>o.dataset===dataset&&o.indicator===indicator))issue('ERROR','INDICATOR','Indikator belum dikenal pada master atau seri RPJMD tersimpan.');
 if(dataset==='rpjmd'&&unit&& !refs.indicators.some(i=>i.name===indicator&&i.unit===unit)&&!refs.observations.some(o=>o.indicator===indicator&&o.unit===unit))issue('WARNING','UNIT','Satuan berbeda dari referensi indikator.');
 if(category&&!refs.observations.some(o=>o.dataset===dataset&&o.category===category))issue('WARNING','CATEGORY','Kategori/tipe belum ditemukan pada data tersimpan.');
 if(['kfd','eppd'].includes(dataset)&&!category)issue('WARNING','CATEGORY','Kategori belum terisi.');
 let period:string|null=null;
 if(dataset==='poverty'){period=['Maret','September'].find(p=>p.toLowerCase()===get('period').toLowerCase())??null;if(!period)issue('ERROR','PERIOD','Periode kemiskinan harus Maret atau September.');}
 const normalized:Normalized={dataset,code,name:sourceName||region?.name||'',year,yearId:yearRef?.id??null,value,endValue,pillarId,indicator,unit,period,category,population,povertyLine};
 for(const [field,max] of [['name',191],['indicator',191],['unit',100],['category',100]] as const)if(text(normalized[field]).length>max)issue('ERROR','LENGTH',`${field}: maksimum ${max} karakter.`);
 const key=identity(normalized);
 const existing=refs.existingKeys.get(key);
 if(existing)issue('ERROR','DB_CONFLICT',`Identitas observasi sudah ada (${existing} record). Import tidak menimpa atau menggandakan data.`);
 return {normalized,findings,key};
}
