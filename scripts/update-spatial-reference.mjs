// Official BIG snapshot for the frontend. No workbook edits; no name-based joins.
// Run: node scripts/update-spatial-reference.mjs (requires network access).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import clipping from 'polygon-clipping';

const service = 'https://geoservices.big.go.id/rbi/rest/services/BATASWILAYAH/BATAS_KABKOTA_AR/MapServer';
const master = JSON.parse(fs.readFileSync('src/data/regions.json', 'utf8'));
const provinces = master.filter(r => r.level === 'PROV');
const cache = path.join(os.tmpdir(), 'prpdn-big-june2026');
fs.mkdirSync(cache, { recursive: true });
async function read(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(90000) });
  if (!response.ok) throw new Error(`BIG HTTP ${response.status}`);
  const json = await response.json();
  if (json.error) throw new Error(JSON.stringify(json.error));
  return json;
}
const metadata = process.argv[2] ? { serviceDescription: 'Geodatabase data batas wilayah administrasi nasional edisi Juni 2026' } : await read(`${service}?f=json`);
assert.match(metadata.serviceDescription, /Juni 2026/);
const features = [];
if (process.argv[2]) {
  const collection = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  assert.ok(collection.features.length && !collection.exceededTransferLimit);
  assert.ok(collection.features.some(f => f.properties.METADATA === 'TASWIL5000020260612KABKOTA'));
  features.push(...collection.features);
} else {
// Small batches avoid the server timeout for a national full-geometry query.
for (let index = 0; index < provinces.length; index += 4) {
  const batch = await Promise.all(provinces.slice(index, index + 4).map(async province => {
    const file = path.join(cache, `${province.code}.json`);
    let collection;
    if (fs.existsSync(file)) collection = JSON.parse(fs.readFileSync(file, 'utf8'));
    else {
      const params = new URLSearchParams({ where: `KDPPUM='${province.code}'`, outFields: 'OBJECTID,NAMOBJ,KDPKAB,KDPPUM,WADMPR,TIPADM,METADATA', returnGeometry: 'true', outSR: '4326', maxAllowableOffset: '0.002', geometryPrecision: '5', returnZ: 'false', returnM: 'false', f: 'geojson' });
      collection = await read(`${service}/0/query?${params}`);
      assert.ok(collection.features.length && !collection.exceededTransferLimit);
      fs.writeFileSync(file, JSON.stringify(collection));
    }
    return collection.features;
  }));
  features.push(...batch.flat());
  console.log(`BIG: ${Math.min(index + 4, provinces.length)}/${provinces.length} provinces downloaded`);
}
}
const grouped = new Map();
const excluded = [];
for (const f of features) {
  const p = f.properties;
  if (!/^\d{2}\.\d{2}$/.test(p.KDPKAB ?? '')) { excluded.push({ id: p.OBJECTID, name: p.NAMOBJ, code: p.KDPKAB }); continue; }
  const code = p.KDPKAB.replace('.', '');
  assert.ok(master.some(r => r.code === code), `Unknown official code ${code}`);
  assert.equal(code.slice(0, 2), p.KDPPUM);
  const group = grouped.get(code) ?? [];
  group.push(f); grouped.set(code, group);
}
assert.equal(grouped.size, 514);
const polygons = g => g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
const boundaryFeatures = [];
const reference = [];
for (const region of master) {
  const entries = region.level === 'PROV' ? [...grouped].filter(([code]) => code.startsWith(region.code)).flatMap(([, items]) => items) : grouped.get(region.code);
  assert.ok(entries?.length, `Missing ${region.code}`);
  const p = entries[0].properties;
  const level = region.level === 'PROV' ? 'PROV' : p.TIPADM === 5 ? 'KOTA' : p.TIPADM === 4 ? 'KAB' : null;
  assert.equal(level, region.level, `Administrative type mismatch ${region.code}`);
  const name = level === 'PROV' ? p.WADMPR : /^(Kota|Kabupaten)\b/i.test(p.NAMOBJ) ? p.NAMOBJ : `${level === 'KOTA' ? 'Kota' : 'Kabupaten'} ${p.NAMOBJ}`;
  const coordinates = entries.flatMap(f => polygons(f.geometry));
  let geometry = null;
  let issue = null;
  try {
    const union = clipping.union(...coordinates);
    assert.ok(union.length);
    geometry = { type: 'MultiPolygon', coordinates: union };
  } catch (error) { issue = `Geometri BIG belum dapat digabung untuk pratinjau: ${error.message}`; }
  if (geometry) boundaryFeatures.push({ type: 'Feature', properties: { code: region.code }, geometry });
  reference.push({ code: region.code, name, level, provinceCode: region.provinceCode, boundary: !!geometry, boundaryIssue: issue, objectIds: entries.map(f => f.properties.OBJECTID), metadata: [...new Set(entries.map(f => f.properties.METADATA))] });
}
const counts = Object.fromEntries(['PROV', 'KAB', 'KOTA'].map(level => [level, reference.filter(r => r.level === level).length]));
assert.deepEqual(counts, { PROV: 38, KAB: 416, KOTA: 98 });
for (const code of ['15', '72', '75', '82', '96', '92', '94']) assert.ok(reference.find(r => r.code === code).boundary, `Reported missing province ${code}`);
fs.writeFileSync('public/data/region-boundaries.json', JSON.stringify({ type: 'FeatureCollection', features: boundaryFeatures }));
fs.writeFileSync('src/data/spatial-reference.json', JSON.stringify({ service, edition: metadata.serviceDescription, retrieved: new Date().toISOString().slice(0, 10), generalizationDegrees: 0.002, codeSystem: 'Kemendagri/PUM (dots removed)', counts, excluded, regions: reference }, null, 2) + '\n');
console.log(`${boundaryFeatures.length}/552 boundaries; counts ${JSON.stringify(counts)}; excluded uncoded features ${excluded.length}`);
