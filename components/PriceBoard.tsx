'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { PriceRow } from '@/lib/data';
import { change, timeVN, trieu } from '@/lib/format';

export function PriceBoard({ ring, bar }: { ring: PriceRow[]; bar: PriceRow[] }) {
  const [product, setProduct] = useState<'ring' | 'bar'>('ring');
  const rows = product === 'ring' ? ring : bar;
  const best = [...rows].sort((a, b) => a.sell - a.buy - (b.sell - b.buy))[0];

  return (
    <>
      <div className="seg" role="group" aria-label="Loại vàng">
        <button aria-pressed={product === 'ring'} onClick={() => setProduct('ring')}>Nhẫn 9999</button>
        <button aria-pressed={product === 'bar'} onClick={() => setProduct('bar')}>Vàng miếng SJC</button>
      </div>
      <div className="card">
        <div className="board-row board-head">
          <span>Tiệm · triệu/lượng</span><span className="r">Mua</span><span className="r">Bán</span><span className="r">24h</span>
        </div>
        {rows.length === 0 ? (
          <p className="empty">Chưa có giá cho loại vàng này. Giá sẽ hiện ở đây sau lần thu thập đầu tiên của tiệm.</p>
        ) : rows.map((r) => {
          const c = change(r.sell, r.prev_sell);
          return (
            <Link key={r.slug} href={`/chart?shop=${r.slug}&product=${r.product}`} className="board-row" style={{ textDecoration: 'none' }}>
              <span className="shop"><b>{r.name}</b><span>{timeVN(r.collected_at)}</span></span>
              <span className="r num" style={{ fontSize: 15 }}>{trieu(r.buy)}</span>
              <span className="r num" style={{ fontSize: 15, fontWeight: 700 }}>{trieu(r.sell)}</span>
              <span className={`r num ${c?.dir ?? 'flat'}`} style={{ fontSize: 13, fontWeight: 600 }}>{c?.text ?? 'mới'}</span>
            </Link>
          );
        })}
        {best && (
          <div className="board-foot">
            Chênh mua–bán thấp nhất: <strong style={{ color: 'var(--ink)' }}>{best.name} · {trieu(best.sell - best.buy)} triệu</strong>
          </div>
        )}
      </div>
    </>
  );
}
