/* eslint-disable @typescript-eslint/no-require-imports -- standalone CommonJS worker */
// A separate, memory-limited worker keeps workbook decompression off the HTTP event loop.
const {parentPort,workerData}=require('node:worker_threads');
const fs=require('node:fs');
const XLSX=require('xlsx');
try{
 const {path,extension,sheet,preview,maxRows,sqlPrefix,sqlHeader,sqlColumns}=workerData;
 if(extension==='sql'){
  const lines=fs.readFileSync(path,'utf8').trim().split(/\r?\n/);
  if(lines.shift()!==sqlHeader||lines.length>maxRows)throw Error('Format SQL PRPDN atau batas jumlah baris tidak valid.');
  const rows=lines.map((line,index)=>{
   if(!line.startsWith(sqlPrefix)||!line.endsWith(');'))throw Error('Hanya INSERT format PRPDN yang diterima. Pernyataan SQL lain ditolak.');
   let rest=line.slice(sqlPrefix.length,-2);const values=[];
   while(rest){const match=/^(NULL|''|CONVERT\(0x([0-9a-f]+) USING utf8mb4\))(,|$)/.exec(rest);if(!match)throw Error('Token SQL tidak didukung.');values.push(match[1]==='NULL'?null:match[1]==="''"?'':Buffer.from(match[2],'hex').toString('utf8'));rest=rest.slice(match[0].length);}
   if(values.length!==sqlColumns.length)throw Error('Kolom SQL tidak sesuai format PRPDN.');
   const data=Object.fromEntries(sqlColumns.map((c,i)=>[c,values[i]]));
   for(const key of ['raw','issues','metadata']){const parsed=JSON.parse(data[key]);if(parsed===null||typeof parsed!=='object')throw Error('Metadata SQL PRPDN tidak valid.');}
   return {rowNumber:index+2,data};
  });
  if(!rows.length)throw Error('Berkas tidak memiliki record.');
  parentPort.postMessage({sheets:['PRPDN'],sheet:'PRPDN',columns:sqlColumns,rows:preview?rows.slice(0,20):rows,total:rows.length});
 }else{
  const names=XLSX.readFile(path,{bookSheets:true}).SheetNames;
  if(!sheet){parentPort.postMessage({sheets:names});}
  else{
   if(!names.includes(sheet))throw Error('Sheet tidak ditemukan.');
   const book=XLSX.readFile(path,{sheets:sheet,dense:true,raw:true,cellFormula:false,cellHTML:false,cellStyles:false,cellText:false,sheetRows:preview?22:maxRows+2});
   const ws=book.Sheets[sheet];
   const range=XLSX.utils.decode_range(ws['!fullref']||ws['!ref']||'A1');
   if(range.e.c>199)throw Error('Maksimal 200 kolom per sheet.');
   if(range.e.r>maxRows)throw Error('Jumlah baris melebihi IMPORT_MAX_ROWS.');
   const table=XLSX.utils.sheet_to_json(ws,{header:1,defval:null,blankrows:true,raw:true});
   const columns=(table.shift()||[]).map(c=>String(c??'').trim());
   if(!columns.length||columns.some(c=>!c||c.length>191)||new Set(columns).size!==columns.length)throw Error('Baris pertama harus berisi nama kolom unik dan tidak kosong.');
   const rows=table.flatMap((cells,i)=>cells.every(c=>c===null||c==='')?[]:[{rowNumber:i+2,data:Object.fromEntries(columns.map((c,j)=>[c,cells[j]??null]))}]);
   if(rows.some(r=>Object.values(r.data).some(c=>String(c??'').length>10000)))throw Error('Isi sel melebihi 10.000 karakter.');
   if(!rows.length)throw Error('Sheet tidak memiliki baris data.');
   parentPort.postMessage({sheets:names,sheet,columns,rows:preview?rows.slice(0,20):rows,total:range.e.r});
  }
 }
}catch(error){parentPort.postMessage({error:error.message});}
