import webpush from 'npm:web-push@3.6.7';
import { db } from './client.ts';

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

export type PushPayload = { title: string; body: string; url: string; tag?: string };

/** Gửi push; xoá subscription đã hết hạn (404/410). Trả về số lần gửi thành công. */
export async function sendPush(
  subs: { id: string; subscription: unknown }[],
  payload: PushPayload,
): Promise<number> {
  let ok = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      // deno-lint-ignore no-explicit-any
      await webpush.sendNotification(s.subscription as any, JSON.stringify(payload), { TTL: 3600 });
      ok++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await db.from('push_subscriptions').delete().eq('id', s.id);
      else console.error('push error', code, e);
    }
  }));
  return ok;
}
