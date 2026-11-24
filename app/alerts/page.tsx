'use client';
import { useEffect, useState } from 'react';

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlB64ToUint8(base64: string) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

type Status = 'checking' | 'unsupported' | 'needs-install' | 'off' | 'on' | 'denied';

export default function AlertsPage() {
  const [status, setStatus] = useState<Status>('checking');
  const [sub, setSub] = useState<PushSubscription | null>(null);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ target: 'sjc:ring_9999', field: 'sell', op: 'gte', threshold: '' });

  useEffect(() => {
    (async () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOS = /iPhone|iPad/.test(navigator.userAgent);
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return setStatus(isIOS && !standalone ? 'needs-install' : 'unsupported');
      }
      if (Notification.permission === 'denied') return setStatus('denied');
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      setSub(existing);
      setStatus(existing ? 'on' : 'off');
    })();
  }, []);

  async function enable() {
    setMsg('');
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return setStatus('denied');
    const reg = await navigator.serviceWorker.ready;
    const s = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(VAPID) });
    const res = await fetch('/api/push/subscribe', { method: 'POST', body: JSON.stringify(s) });
    if (!res.ok) return setMsg('Không lưu được đăng ký thông báo. Thử lại sau ít phút.');
    setSub(s);
    setStatus('on');
  }

  async function saveAlert() {
    setMsg('');
    const value = Number(form.threshold.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!sub) return setMsg('Bật thông báo trước khi thêm cảnh báo.');
    if (!value) return setMsg('Nhập ngưỡng giá, ví dụ 150,0.');
    const [shop, product] = form.target.split(':');
    // Vàng nhập theo triệu/lượng, USD nhập theo đồng
    const threshold = product === 'usd' ? Math.round(value) : Math.round(value * 1_000_000);
    const res = await fetch('/api/alerts', {
      method: 'POST',
      body: JSON.stringify({ endpoint: sub.endpoint, shop, product, field: form.field, op: form.op, threshold }),
    });
    setMsg(res.ok ? 'Đã lưu cảnh báo.' : 'Không lưu được cảnh báo. Kiểm tra lại ngưỡng rồi thử lại.');
  }

  const isUsd = form.target.endsWith(':usd');

  return (
    <main className="screen">
      <h1 className="title">Cảnh báo giá</h1>

      {status === 'needs-install' && (
        <p className="note">Để nhận thông báo trên iPhone, mở trang này trong Safari, bấm <strong>Chia sẻ</strong> rồi chọn <strong>Thêm vào Màn hình chính</strong>, sau đó mở app từ biểu tượng mới.</p>
      )}
      {status === 'unsupported' && <p className="note">Trình duyệt này chưa hỗ trợ thông báo đẩy.</p>}
      {status === 'denied' && <p className="note">Thông báo đang bị chặn. Mở Cài đặt › Thông báo › Giá vàng SG để cho phép lại.</p>}
      {status === 'off' && <button className="btn" onClick={enable}>Bật thông báo và bản tin 9:00</button>}
      {status === 'on' && <p className="note">Thông báo đã bật. Bạn sẽ nhận bản tin lúc 9:00 mỗi sáng.</p>}

      <section className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Thêm cảnh báo</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label className="field">Tiệm và loại vàng
            <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
              <option value="sjc:ring_9999">SJC · Nhẫn 9999</option>
              <option value="sjc:bar_sjc">SJC · Miếng SJC</option>
              <option value="pnj:ring_9999">PNJ · Nhẫn 9999</option>
              <option value="doji:ring_9999">DOJI · Nhẫn 9999</option>
              <option value="mihong:ring_9999">Mi Hồng · Nhẫn 9999</option>
              <option value="vcb:usd">USD Vietcombank</option>
            </select>
          </label>
          <label className="field">Điều kiện
            <select value={`${form.field}:${form.op}`} onChange={(e) => { const [field, op] = e.target.value.split(':'); setForm({ ...form, field, op }); }}>
              <option value="sell:gte">Giá bán ≥</option>
              <option value="sell:lte">Giá bán ≤</option>
              <option value="buy:gte">Giá mua ≥</option>
              <option value="buy:lte">Giá mua ≤</option>
            </select>
          </label>
        </div>
        <label className="field">{isUsd ? 'Ngưỡng (đồng)' : 'Ngưỡng (triệu/lượng)'}
          <input inputMode="decimal" placeholder={isUsd ? '27200' : '150,0'} value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} />
        </label>
        <button className="btn" onClick={saveAlert} disabled={status !== 'on'}>Lưu cảnh báo</button>
        {msg && <p className="meta" role="status" style={{ margin: 0 }}>{msg}</p>}
      </section>
    </main>
  );
}
