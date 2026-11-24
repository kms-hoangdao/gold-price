import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { trieu } from '@/lib/format';

export const revalidate = 600;

const LABEL: Record<string, string> = { ring_9999: 'Nhẫn 9999', bar_sjc: 'Vàng miếng SJC' };

export default async function Chart({ searchParams }: { searchParams: Promise<{ shop?: string; product?: string }> }) {
  const { shop = 'sjc', product = 'ring_9999' } = await searchParams;
  const since = new Date(Date.now() - 30 * 86400_000).toISOString();
  const { data: src } = await supabase().from('sources').select('id, name').eq('slug', shop).maybeSingle();
  const { data } = src
    ? await supabase().from('prices').select('buy, sell, collected_at')
        .eq('source_id', src.id).eq('product', product).eq('needs_review', false)
        .gte('collected_at', since).order('collected_at')
    : { data: [] };
  const pts = data ?? [];

  const W = 326, H = 180;
  const values = pts.flatMap((p) => [p.buy, p.sell]);
  const lo = Math.min(...values), hi = Math.max(...values);
  const x = (i: number) => (pts.length < 2 ? W : (i / (pts.length - 1)) * W);
  const y = (v: number) => (hi === lo ? H / 2 : H - 12 - ((v - lo) / (hi - lo)) * (H - 24));
  const line = (k: 'buy' | 'sell') => pts.map((p, i) => `${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join(' ');
  const last = pts.at(-1);

  return (
    <main className="screen">
      <Link href="/" className="meta" style={{ textDecoration: 'none' }}>‹ {src?.name ?? shop} · {LABEL[product] ?? product}</Link>
      {!last ? (
        <p className="empty card">Chưa đủ dữ liệu để vẽ biểu đồ. Biểu đồ sẽ có sau vài ngày thu thập.</p>
      ) : (
        <>
          <div>
            <span className="meta">Giá bán ra · triệu/lượng</span>
            <div className="num" style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.03em' }}>{trieu(last.sell)}</div>
            <span className="meta">Mua vào {trieu(last.buy)} · chênh {trieu(last.sell - last.buy)} triệu</span>
          </div>
          <div className="card" style={{ padding: '16px 12px' }}>
            <svg role="img" aria-label="Giá mua và bán 30 ngày" viewBox={`0 0 ${W} ${H}`} width="100%">
              <polyline fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinejoin="round" points={line('sell')} />
              <polyline fill="none" stroke="var(--muted)" strokeWidth="2" strokeDasharray="5 4" strokeLinejoin="round" points={line('buy')} />
            </svg>
            <p className="meta" style={{ margin: '8px 4px 0', fontSize: 12 }}>
              30 ngày · cao nhất {trieu(hi)} · thấp nhất {trieu(lo)} · nét liền: bán, nét đứt: mua
            </p>
          </div>
        </>
      )}
      <Link href="/alerts" className="btn" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }}>Đặt cảnh báo giá</Link>
    </main>
  );
}
