export function normalizeValues(values: (number | null)[]) {
  const baseline = values.find(value => value !== null);
  return values.map(value => value === null || baseline === undefined || baseline === 0 ? null : value / baseline * 100);
}
