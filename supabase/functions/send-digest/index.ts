// Bản tin sáng 9h: tổng hợp giá + tin, lưu vào digests (1 bản/ngày), gửi Web Push.
import { db } from '../_shared/client.ts';
import { todayVN } from '../_shared/normalize.ts';
import { sendPush } from '../_shared/push.ts';

const trieu = (vnd: number) => (vnd / 1_000_000).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const delta = (now: number, prev: number | null) => {
  if (!prev || now === prev) return '';
  const d = (now - prev) / 1_000_000;
  return ` (${d > 0 ? '▲' : '▼'}${Math.abs(d).toLocaleString('vi-VN', { maximumFractionDigits: 1 })})`;
};

Deno.serve(async () => {
  const date = todayVN();
  const [{ data: gold }, { data: fx }, { data: news }] = await Promise.all([
    db.from('latest_prices').select('*'),
    db.from('latest_fx').select('*').eq('currency', 'USD'),
    db.from('articles').select('title, url, summary, category, published_at, sources(name)')
      .gte('created_at', new Date(Date.now() - 24 * 3600_000).toISOString())
      .order('published_at', { ascending: false }).limit(40),
  ]);

  // Giá chưa cập nhật hôm nay → đánh dấu, không trình bày như giá mới
  const startOfDay = new Date(`${date}T00:00:00+07:00`).getTime();
  const goldRows = (gold ?? []).map((g) => ({ ...g, stale: new Date(g.collected_at).getTime() < startOfDay }));
  const sjcRing = goldRows.find((g) => g.slug === 'sjc' && g.product === 'ring_9999' && !g.stale);
  const vcb = (fx ?? []).find((f) => f.slug === 'vcb');

  const pick = (cat: string) => (news ?? []).filter((n) => n.category === cat).slice(0, 3);
  const body = { gold: goldRows, fx: fx ?? [], finance: pick('finance'), tech: pick('tech') };

  const parts: string[] = [];
  if (sjcRing) parts.push(`SJC nhẫn ${trieu(sjcRing.buy)} / ${trieu(sjcRing.sell)}tr${delta(sjcRing.sell, sjcRing.prev_sell)}`);
  else parts.push('Giá vàng chưa cập nhật');
  if (vcb) parts.push(`USD VCB ${Number(vcb.sell).toLocaleString('vi-VN')}`);
  const newsCount = body.finance.length + body.tech.length;
  if (newsCount) parts.push(`${newsCount} tin đáng chú ý`);

  const [d, m] = [date.slice(8, 10), date.slice(5, 7)];
  const digest = { date, title: `Bản tin sáng ${d}/${m}`, short: parts.join(' · '), body };

  // PK theo ngày: nếu đã có bản tin hôm nay thì không gửi lại
  const { error: insertError } = await db.from('digests').insert(digest);
  if (insertError) {
    if (insertError.code === '23505') return Response.json({ ok: true, skipped: 'already sent' });
    return new Response(insertError.message, { status: 500 });
  }

  const { data: subs } = await db.from('push_subscriptions').select('id, subscription').eq('digest', true);
  const sent = await sendPush(subs ?? [], { title: digest.title, body: digest.short, url: '/digest', tag: `digest-${date}` });
  await db.from('digests').update({ sent_at: new Date().toISOString() }).eq('date', date);

  return Response.json({ ok: true, sent, short: digest.short });
});
