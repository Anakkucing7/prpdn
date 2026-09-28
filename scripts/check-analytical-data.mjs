import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { seriesValue, sortAnalytical } from '../src/lib/analytical.ts';
import { changeFromPrevious, deltaText } from '../src/lib/trend.ts';

const fixture = JSON.parse(readFileSync(new URL('../src/data/analytical.json', import.meta.url), 'utf8'));
assert.equal(createHash('sha256').update(readFileSync(new URL('../data/Dataset Dashboard 040526.xlsx', import.meta.url))).digest('hex'), fixture.sha256);
const { kfd, poverty, eppd, rpjmd } = fixture.modules;
assert.deepEqual([kfd,poverty,eppd,rpjmd].map(m => m.records.length), [102,304,368,1919]);
const aceh = kfd.records.find(r => r.code === '11' && r.year === 2022);
assert.equal(aceh.value, 1.789);
assert.equal(aceh.category, 'Sedang');
const current = poverty.records.find(r => r.code === '11' && r.year === 2024 && r.period === 'Maret');
assert.equal(seriesValue(poverty.records,current,2023), 14.45);
assert.ok(Math.abs(changeFromPrevious(current.value,seriesValue(poverty.records,current,2023)).delta + .22) < 1e-9);
assert.equal(changeFromPrevious(12,14).evaluation, 'neutral');
const september = poverty.records.find(r => r.code === '11' && r.year === 2023 && r.period === 'September');
assert.equal(september.value, null);
assert.equal(deltaText(null, 14, 2022), '— Nilai periode ini tidak tersedia');
assert.equal(deltaText(14, null, 2022), '— Pembanding 2022 tidak tersedia');
const mismatch = poverty.records.find(r => r.sourceCode === '94' && r.name === 'Papua');
assert.equal(mismatch.code, null);
assert.equal(seriesValue(poverty.records,mismatch,2024), null);
assert.equal(eppd.records.find(r => r.code === '17' && r.year === 2024).value,null);
assert.equal(eppd.records.find(r => r.code === '17' && r.year === 2024).category,'Tidak Dinilai');
assert.equal(seriesValue([...kfd.records,aceh],aceh,2022),null);
assert.equal(sortAnalytical([september,current],'low').at(-1).value,null);
assert.equal(sortAnalytical([september,current],'high').at(-1).value,null);
assert.ok(rpjmd.records.some(r => r.year === null && r.value === 0));
assert.equal(rpjmd.records.filter(r => r.sheet === 'fact_rpjmd_prov_master').length,7);
assert.equal(rpjmd.excluded.length,7);
assert.equal(rpjmd.definitions[0].nama_indikator,'Indeks Modal Manusia');
for (const dataset of Object.values(fixture.modules)) {
  assert.equal(new Set(dataset.records.map(r=>r.id)).size,dataset.records.length);
  for (const r of dataset.records) {
    assert.ok(r.code === null || /^\d{2}$/.test(r.code));
    const sourceKey = r.sheet === 'fact_kfd' ? 'rasio_kfd' : r.sheet === 'fact_eppd' ? 'skor_eppd' : r.sheet === 'fact_kemiskinan' ? 'persentase_penduduk_miskin' : 'nilai_awal';
    assert.equal(r.value, typeof r.raw[sourceKey] === 'number' ? r.raw[sourceKey] : null);
  }
}
console.log('Phase 6 checks passed: workbook hash, mappings, missing/zero values, code conflicts, source separation, sorting and neutral trends.');
