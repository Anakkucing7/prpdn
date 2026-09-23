// Small, traceable samples from the existing workbook-derived Phase 3 fixtures.
import fs from 'node:fs';
const idsd = JSON.parse(fs.readFileSync('src/data/idsd.json', 'utf8'));
const regions = JSON.parse(fs.readFileSync('src/data/regions.json', 'utf8'));
const totals = idsd.records.filter(r => r.level === 'PROV' && r.match === 'code' && r.value >= 1 && r.value <= 5).slice(0, 6).map(r => ({ year: String(r.year), code: r.sourceCode, indicator: 'IDSD', value: String(r.value), sheet: 'fact_total_idsd', sourceRow: r.id }));
const pillars = idsd.pillars['11:2024'].slice(0, 6).map(r => ({ year: '2024', code: '11', indicator: String(r.id), value: String(r.value), sheet: 'fact_skor_pilar', sourceRow: r.rows[0] }));
fs.writeFileSync('src/data/import-samples.json', JSON.stringify({ workbook: 'Dataset Dashboard 040526.xlsx', totals, pillars, years: idsd.years, regions: regions.map(r => ({ code: r.code, name: r.name, level: r.level })), pillarIds: idsd.definitions.map(r => String(r.id)) }, null, 2) + '\n');
console.log('Import samples: 6 totals, 6 pillars; original workbook unchanged.');
