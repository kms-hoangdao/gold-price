// Thu thập giá vàng, tỷ giá, tin tức từ mọi nguồn đang bật; kiểm tra cảnh báo giá.
// Gọi bởi pg_cron (xem supabase/cron.sql).
import { db } from '../_shared/client.ts';
import { adapters } from '../_shared/adapters/index.ts';
import { SourceRow } from '../_shared/types.ts';
import { assertLuongPrice, isSuspicious, todayVN } from '../_shared/normalize.ts';
import { summarize } from '../_shared/summarize.ts';
import { sendPush } from '../_shared/push.ts';

const PRODUCT_LABEL: Record<string, string> = { ring_9999: 'nhẫn 9999', bar_sjc: 'miếng SJC', usd: 'USD' };
const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

async function checkAlerts(source: SourceRow, product: string, buy: number, sell: number) {
  const today = todayVN();
  const { data: alerts } = await db
    .from('alerts')
    .select('id, field, op, threshold, last_fired_on, push_subscriptions(id, subscription)')
    .eq('active', true).eq('source_id', source.id).eq('product', product);

  for (const a of alerts ?? []) {
    if (a.last_fired_on === today) continue; // tối đa 1 lần/ngày cho mỗi cảnh báo
    const value = a.field === 'buy' ? buy : sell;
    const hit = a.op === 'gte' ? value >= a.threshold : value <= a.threshold;
    if (!hit) continue;
    const sub = a.push_subscriptions as unknown as { id: string; subscription: unknown } | null;
    if (!sub) continue;
    await sendPush([sub], {
      title: `${source.name} ${PRODUCT_LABEL[product]} chạm ngưỡng`,
      body: `Giá ${a.field === 'buy' ? 'mua' : 'bán'} ${fmt(value)} đ (${a.op === 'gte' ? '≥' : '≤'} ${fmt(a.threshold)} đ)`,
      url: '/',
      tag: `alert-${a.id}`,
    });
    await db.from('alerts').update({ last_fired_on: today }).eq('id', a.id);
  }
}

async function handleSource(source: SourceRow) {
  const adapter = adapters[source.adapter];
  if (!adapter) throw new Error(`Không có adapter "${source.adapter}"`);
  const result = await adapter(source);
  let inserted = 0;

  if (result.kind === 'gold') {
    for (const p of result.items) {
      assertLuongPrice(p.buy);
      assertLuongPrice(p.sell);
      const { data: prev } = await db.from('prices').select('buy, sell')
        .eq('source_id', source.id).eq('product', p.product)
        .order('collected_at', { ascending: false }).limit(1).maybeSingle();
      if (prev && prev.buy === p.buy && prev.sell === p.sell) continue; // giá không đổi: không lưu
      const needs_review = isSuspicious(prev?.sell ?? null, p.sell);
      await db.from('prices').insert({ source_id: source.id, ...p, needs_review });
      inserted++;
      if (!needs_review) await checkAlerts(source, p.product, p.buy, p.sell);
    }
  }

  if (result.kind === 'fx') {
    for (const r of result.items) {
      const { data: prev } = await db.from('fx_rates').select('buy, sell')
        .eq('source_id', source.id).eq('currency', r.currency)
        .order('collected_at', { ascending: false }).limit(1).maybeSingle();
      if (prev && Number(prev.buy) === r.buy && Number(prev.sell) === r.sell) continue;
      await db.from('fx_rates').insert({ source_id: source.id, ...r });
      inserted++;
      if (r.currency === 'USD') await checkAlerts(source, 'usd', r.buy, r.sell);
    }
  }

  if (result.kind === 'news') {
    const category = source.kind === 'news_tech' ? 'tech' : 'finance';
    const { data: fresh } = await db.from('articles')
      .upsert(result.items.map((a) => ({ ...a, source_id: source.id, category })), { onConflict: 'url', ignoreDuplicates: true })
      .select('id, title, url');
    inserted = fresh?.length ?? 0;
    // Tóm tắt tối đa 5 bài mới mỗi nguồn mỗi lần chạy để giữ chi phí thấp
    for (const a of (fresh ?? []).slice(0, 5)) {
      const summary = await summarize(a.title, a.url);
      if (summary) await db.from('articles').update({ summary }).eq('id', a.id);
    }
  }
  return inserted;
}

Deno.serve(async () => {
  const { data: sources, error } = await db.from('sources').select('*').eq('active', true);
  if (error) return new Response(error.message, { status: 500 });

  const report = await Promise.all((sources as SourceRow[]).map(async (s) => {
    try {
      const inserted = await handleSource(s);
      await db.from('sources').update({ last_ok_at: new Date().toISOString(), last_error: null }).eq('id', s.id);
      return { source: s.slug, inserted };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await db.from('sources').update({ last_error: msg }).eq('id', s.id);
      return { source: s.slug, error: msg };
    }
  }));

  return Response.json({ ok: true, report });
});
