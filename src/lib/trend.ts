export type DesiredDirection = 'higher' | 'lower' | 'unknown';
export function changeFromPrevious(current: number | null | undefined, previous: number | null | undefined, desired: DesiredDirection = 'unknown') {
  if (current == null || previous == null || !Number.isFinite(current) || !Number.isFinite(previous)) return null;
  const delta = current - previous;
  const direction = Math.abs(delta) < 1e-10 ? 'unchanged' : delta > 0 ? 'increased' : 'decreased';
  const evaluation = desired === 'unknown' || direction === 'unchanged' ? 'neutral' : (delta > 0) === (desired === 'higher') ? 'positive' : 'negative';
  return { delta: direction === 'unchanged' ? 0 : delta, direction, evaluation } as const;
}
export function deltaText(current: number | null | undefined, previous: number | null | undefined, previousYear: number) {
  if (current == null || !Number.isFinite(current)) return '— Nilai periode ini tidak tersedia';
  const change = changeFromPrevious(current, previous);
  if (!change) return `— Pembanding ${previousYear} tidak tersedia`;
  if (change.delta !== 0 && Math.abs(change.delta) < 0.005) return `${change.direction === 'increased' ? '▲ Naik' : '▼ Turun'} <0,01 dari ${previousYear}`;
  const value = Math.abs(change.delta).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${change.direction === 'increased' ? '▲ +' : change.direction === 'decreased' ? '▼ −' : '— '}${value} dari ${previousYear}`;
}
