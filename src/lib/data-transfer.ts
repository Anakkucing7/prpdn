export const datasets = {idsd:'IDSD · skor total','idsd-pillar':'IDSD · skor pilar',kfd:'Kapasitas Fiskal Daerah',poverty:'Kemiskinan',eppd:'EPPD',rpjmd:'RPJMD'} as const;
export type TransferDataset=keyof typeof datasets;
export const transferFields={code:'Kode wilayah',name:'Nama wilayah',year:'Tahun / ID waktu',value:'Nilai',pillarId:'ID pilar',indicator:'Indikator RPJMD',unit:'Satuan',period:'Periode',category:'Kategori / tipe',endValue:'Nilai akhir',population:'Jumlah penduduk miskin (ribu)',povertyLine:'Garis kemiskinan (Rp)'} as const;
export type TransferField=keyof typeof transferFields;
export type Cell=string|number|null;
export type TransferRow=Record<string,Cell>;
export type Mapping=Partial<Record<TransferField,string>>;
export function datasetFields(dataset:TransferDataset):TransferField[]{return ['code','name','year','value',...(dataset==='idsd-pillar'?['pillarId' as const]:[]),...(dataset==='rpjmd'?['indicator','unit','category','endValue'] as const:[]),...(dataset==='poverty'?['period','population','povertyLine'] as const:[]),...(['kfd','eppd'].includes(dataset)?['category' as const]:[])];}
export function requiredFields(dataset:TransferDataset):TransferField[]{return ['code','year','value',...(dataset==='idsd-pillar'?['pillarId' as const]:[]),...(dataset==='rpjmd'?['indicator','unit','category'] as const:[]),...(dataset==='poverty'?['period' as const]:[])];}
export const defaultSheets:Record<TransferDataset,string>={idsd:'fact_total_idsd','idsd-pillar':'fact_skor_pilar',kfd:'fact_kfd',poverty:'fact_kemiskinan',eppd:'fact_eppd',rpjmd:'fact_rpjmd_prov'};
export function suggestedMapping(columns:string[],dataset:TransferDataset):Mapping{
 const aliases:Record<TransferField,string[]>={code:['code','regionCode','id_wilayah','kode_wilayah'],name:['name','sourceName','nama_wilayah','Nama Provinsi','nama_provinsi',`nama_provinsi_${dataset}`],year:['year','tahun_kinerja','id_waktu','tahun'],value:['value',dataset==='idsd'?'skor_idsd_total':dataset==='idsd-pillar'?'skor_pilar':dataset==='kfd'?'rasio_kfd':dataset==='poverty'?'persentase_penduduk_miskin':dataset==='eppd'?'skor_eppd':'nilai_awal','skor_idsd','skor','nilai'],pillarId:['pillarId','id_pilar'],indicator:['indicator','indikator_rpjmd'],unit:['unit','satuan'],period:['period','bulan'],category:['category','kategori_kfd','status_eppd','tipe'],endValue:['endValue','nilai_akhir'],population:['population','jumlah_penduduk_miskin'],povertyLine:['povertyLine','garis_kemiskinan']};
 return Object.fromEntries(datasetFields(dataset).flatMap(field=>{const found=aliases[field].map(a=>columns.find(c=>c.toLowerCase()===a.toLowerCase())).find(Boolean);return found?[[field,found]]:[]}));
}
export type Finding={severity:'ERROR'|'WARNING';code:string;message:string};
export type Normalized={dataset:TransferDataset;code:string;name:string;year:number;yearId:number|null;value:string|null;endValue:string|null;pillarId:number|null;indicator:string|null;unit:string;period:string|null;category:string|null;population:string|null;povertyLine:string|null};
export type StagedRow={id:string;rowNumber:number;original:TransferRow;corrected:TransferRow|null;normalized:Normalized|null;findings:Finding[];status:string;decision:string;reviewNote:string|null;reviewedBy:string|null;reviewedAt:string|null;version:number};
export type BatchSummary={id:string;filename:string;dataset:TransferDataset;sheet:string;status:string;version:number;createdAt:string;approvedAt:string|null;approvedBy:string|null;creator:{name:string};counts:{total:number;valid:number;warning:number;error:number;accepted:number;rejected:number;pending:number}};
export type BatchDetail=BatchSummary&{columns:string[];mapping:Mapping;rows:StagedRow[];total:number;page:number;size:number};
export const sqlColumns=['id','dataset','sourceSheet','sourceRow','sourceFile','sourceCode','regionCode','sourceName','year','period','pillarId','indicator','unit','value','endValue','category','raw','issues','metadata'] as const;
export const sqlPrefix=`INSERT INTO \`Observation\` (${sqlColumns.map(c=>`\`${c}\``).join(',')}) VALUES (`;
export const sqlHeader='-- PRPDN-DATA-V1';
