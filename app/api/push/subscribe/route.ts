import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  const sub = await req.json().catch(() => null);
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return Response.json({ error: 'Đăng ký thông báo không hợp lệ' }, { status: 400 });
  }
  const { error } = await supabaseAdmin()
    .from('push_subscriptions')
    .upsert({ endpoint: sub.endpoint, subscription: sub }, { onConflict: 'endpoint' });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
