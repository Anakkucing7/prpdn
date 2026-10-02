import { db } from '@/server/db';
import ComparisonPage, { type ComparisonRecord, type ComparisonRegion } from '@/components/data/comparison-page';

export const metadata = { title: 'Perbandingan Data' };

export default async function Page() {
  const [records, regions] = await Promise.all([
    db().observation.findMany({
      where: { dataset: { in: ['idsd', 'kfd', 'poverty', 'eppd'] }, regionCode: { not: null }, year: { not: null } },
      select: { dataset: true, regionCode: true, year: true, period: true, value: true },
      orderBy: [{ year: 'asc' }, { period: 'asc' }],
    }),
    db().region.findMany({ where: { active: true }, select: { code: true, name: true, level: true, provinceCode: true }, orderBy: { name: 'asc' } }),
  ]);
  const cleanRecords: ComparisonRecord[] = records.flatMap(row => row.regionCode && row.year !== null && row.value !== null ? [{
    metric: row.dataset as ComparisonRecord['metric'], code: row.regionCode, year: row.year,
    period: row.period, value: Number(row.value),
  }] : []);
  const cleanRegions: ComparisonRegion[] = regions.map(region => ({ code: region.code, name: region.name, level: region.level, provinceCode: region.provinceCode }));
  return <ComparisonPage records={cleanRecords} regions={cleanRegions} />;
}
