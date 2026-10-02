import { changeFromPrevious, deltaText } from '@/lib/trend';
export function TrendDelta({ current, previous, year }: { current: number | null | undefined; previous: number | null | undefined; year: number }) {
  const change = changeFromPrevious(current, previous);
  return <span className="trend-delta" data-direction={change?.direction ?? 'unknown'} title="Warna menunjukkan arah perubahan, bukan penilaian baik/buruk.">{deltaText(current, previous, year - 1)}</span>;
}
