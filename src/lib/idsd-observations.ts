import fixture from '@/data/idsd.json';
const observations = new Map<string, { value: number | null; rows: number[] }>();
const groups = new Map<string, typeof fixture.records>();
for (const record of fixture.records) {
  if (record.match !== 'code' || !record.code) continue;
  const key = `${record.code}:${record.year}`;
  const group = groups.get(key) ?? []; group.push(record); groups.set(key, group);
}
for (const [key, group] of groups) {
  const values = new Set(group.map(r => r.value));
  observations.set(key, { value: values.size === 1 ? group[0].value : null, rows: group.map(r => r.id) });
}
export const idsdYears = [...new Set(fixture.records.map(r => r.year))].sort();
export const idsdObservation = (code: string, year: number) => observations.get(`${code}:${year}`);
