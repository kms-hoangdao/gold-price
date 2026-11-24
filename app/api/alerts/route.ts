import { supabaseAdmin } from '@/lib/supabase';

const PRODUCTS = new Set(['ring_9999', 'bar_sjc', 'usd']);

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b?.endpoint || !PRODUCTS.has(b.product) || !['buy', 'sell'].includes(b.field)
      || !['gte', 'lte'].includes(b.op) || !Number.isFinite(b.threshold) || b.threshold <= 0) {
    return Response.json({ error: 'Dữ liệu cảnh báo không hợp lệ' }, { status: 400 });
  }
  const db = supabaseAdmin();
  const { data: sub } = await db.from('push_subscriptions').select('id').eq('endpoint', b.endpoint).maybeSingle();
  if (!sub) return Response.json({ error: 'Chưa bật thông báo trên thiết bị này' }, { status: 404 });
  const { data: src } = await db.from('sources').select('id').eq('slug', b.shop).maybeSingle();
  if (!src) return Response.json({ error: 'Không tìm thấy tiệm' }, { status: 404 });

  const { error } = await db.from('alerts').insert({
    subscription_id: sub.id, source_id: src.id, product: b.product,
    field: b.field, op: b.op, threshold: Math.round(b.threshold),
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
