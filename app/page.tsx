import { getBoard } from '@/lib/data';
import { dateVN, dong, timeVN } from '@/lib/format';
import { PriceBoard } from '@/components/PriceBoard';

export const revalidate = 300; // ISR: làm mới tối đa 5 phút một lần

export default async function Home() {
  const { ring, bar, fx } = await getBoard();
  const all = [...ring, ...bar, ...fx];
  const last = all.map((r) => r.collected_at).sort().at(-1);

  return (
    <main className="screen">
      <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="meta" style={{ textTransform: 'capitalize' }}>
          {dateVN()}{last ? ` · cập nhật ${timeVN(last)}` : ''}
        </span>
        <h1 className="title">Giá vàng Sài Gòn</h1>
      </header>

      <PriceBoard ring={ring} bar={bar} />

      <section className="card fx" aria-labelledby="usd">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h2 id="usd" style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Đô la Mỹ</h2>
          <span className="meta" style={{ fontSize: 12 }}>VND / USD · mua / bán</span>
        </div>
        {fx.length === 0 ? (
          <p className="meta" style={{ margin: 0 }}>Chưa có tỷ giá.</p>
        ) : (
          <div className="fx-grid">
            {fx.map((f) => (
              <div key={f.slug} className="fx-cell">
                <span className="meta" style={{ fontSize: 12 }}>{f.name}</span>
                <span className="num" style={{ fontSize: 17, fontWeight: 700 }}>{dong(f.buy)} / {dong(f.sell)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
