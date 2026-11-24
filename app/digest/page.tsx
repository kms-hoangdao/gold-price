import { getLatestDigest, type DigestNews } from '@/lib/data';
import { dong, timeVN, trieu } from '@/lib/format';

export const revalidate = 300;

function NewsList({ label, items }: { label: string; items: DigestNews[] }) {
  if (!items.length) return null;
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h2 className="section-label" style={{ margin: 0 }}>{label}</h2>
      <div className="card">
        {items.map((n) => (
          <a key={n.url} href={n.url} target="_blank" rel="noopener noreferrer" className="news">
            <span className="meta" style={{ fontSize: 12 }}>
              {n.sources?.name}{n.published_at ? ` · ${timeVN(n.published_at)}` : ''}
            </span>
            <b>{n.title}</b>
            {n.summary && <p>{n.summary}</p>}
          </a>
        ))}
      </div>
    </section>
  );
}

export default async function DigestPage() {
  const d = await getLatestDigest();
  if (!d) {
    return (
      <main className="screen">
        <h1 className="title">Bản tin sáng</h1>
        <p className="empty card">Bản tin đầu tiên sẽ có lúc 9:00 sáng mai. Bật thông báo ở mục Cảnh báo để nhận trên iPhone.</p>
      </main>
    );
  }
  const ring = d.body.gold.find((g) => g.slug === 'sjc' && g.product === 'ring_9999');
  const bar = d.body.gold.find((g) => g.slug === 'sjc' && g.product === 'bar_sjc');
  const vcb = d.body.fx.find((f) => f.slug === 'vcb');
  const cells = [
    { label: 'Nhẫn 9999', value: ring && !ring.stale ? trieu(ring.sell) : 'chưa cập nhật' },
    { label: 'Miếng SJC', value: bar && !bar.stale ? trieu(bar.sell) : 'chưa cập nhật' },
    { label: 'USD VCB', value: vcb ? dong(vcb.sell) : '–' },
  ];

  return (
    <main className="screen">
      <header>
        <span className="meta">{d.date.split('-').reverse().join('/')} · gửi lúc 9:00</span>
        <h1 className="title">{d.title}</h1>
      </header>
      <div style={{ background: 'var(--ink)', color: 'var(--ground)', borderRadius: 16, padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {cells.map((c) => (
          <div key={c.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 12, opacity: 0.75 }}>{c.label}</span>
            <span className="num" style={{ fontSize: 17, fontWeight: 700 }}>{c.value}</span>
          </div>
        ))}
      </div>
      <NewsList label="Tài chính" items={d.body.finance} />
      <NewsList label="Công nghệ" items={d.body.tech} />
    </main>
  );
}
