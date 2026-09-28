import { deltaText } from '@/lib/trend';
export function TrendDelta({ current, previous, year }: { current: number | null | undefined; previous: number | null | undefined; year: number }) {
  return <span className="trend-delta" title="Perubahan numerik; bukan penilaian baik/buruk.">{deltaText(current, previous, year - 1)}</span>;
}
