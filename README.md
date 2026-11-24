# Giá vàng Sài Gòn

PWA cho iPhone: giá vàng các tiệm ở Sài Gòn (SJC, PNJ, DOJI, Mi Hồng), tỷ giá USD,
tin tài chính và công nghệ có tóm tắt AI, bản tin push lúc 9:00 mỗi sáng và cảnh báo giá.

Stack: Next.js 15 (Vercel, ISR) · Supabase (Postgres, Edge Functions, pg_cron) · Web Push (VAPID) · Claude Haiku.

```
app/                      Next.js: bảng giá, biểu đồ, bản tin, cảnh báo + API routes
components/               PriceBoard, TabBar, RegisterSW
lib/                      Supabase client, truy vấn, định dạng số
public/                   manifest, service worker, icon
supabase/migrations/      Schema, view, RLS, danh sách nguồn
supabase/functions/       collect (thu thập + cảnh báo), send-digest (bản tin 9h)
supabase/functions/_shared/adapters/   Mỗi nguồn dữ liệu một adapter
supabase/cron.sql         Lịch chạy (giờ UTC)
```

## Chạy lần đầu

1. **Supabase.** Tạo project, rồi:
   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push
   ```
2. **Khoá VAPID** cho Web Push: `npm run vapid`.
3. **Secrets cho Edge Functions:**
   ```bash
   npx supabase secrets set ANTHROPIC_API_KEY=... VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
   npx supabase functions deploy collect
   npx supabase functions deploy send-digest
   ```
4. **Lịch chạy.** Trong SQL Editor, tạo 2 secret trong Vault (xem đầu file) rồi chạy `supabase/cron.sql`.
5. **Next.js.** Sao chép `.env.example` thành `.env.local`, điền giá trị, rồi `npm install && npm run dev`.
6. **Deploy** lên Vercel với cùng biến môi trường.

Thử thu thập ngay mà không chờ cron:
```bash
curl -X POST https://<ref>.supabase.co/functions/v1/collect -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
```
Kết quả từng nguồn nằm trong phản hồi và cột `last_error` của bảng `sources`.

## Trạng thái nguồn dữ liệu

| Nguồn | Adapter | Trạng thái |
|---|---|---|
| Vietcombank (USD) | `fx_vcb` | Đã cài, bật sẵn. Kiểm tra lại URL XML nếu báo lỗi. |
| VnExpress, Hacker News, The Verge | `rss` | Đã cài, bật sẵn. |
| CafeF | `rss` | Cần điền URL RSS rồi bật. |
| SJC, PNJ, DOJI, Mi Hồng | `gold_*` | **Chưa cài.** Xem hướng dẫn trong `adapters/gold.ts`. |
| USD tự do | `fx_free` | **Chưa cài.** |

Bật một nguồn: `update sources set url = '...', active = true where slug = 'sjc';`

Trước khi thu thập tự động từ bất kỳ trang nào, đọc điều khoản sử dụng của trang đó.

## Ghi chú iOS

- Web Push chỉ chạy trên iOS 16.4+ và chỉ khi app đã được **Thêm vào Màn hình chính** từ Safari.
- Màn Cảnh báo tự nhận biết trường hợp này và hiện hướng dẫn cài đặt.

## Cơ chế an toàn dữ liệu

- Giá chỉ được lưu khi khác lần trước; giá lệch hơn 5% so với lần trước bị gắn `needs_review` và không hiển thị.
- Giá ngoài khoảng 50–500 triệu/lượng bị từ chối (bắt lỗi nhầm đơn vị nghìn đồng/chỉ).
- Bản tin dùng `date` làm khoá chính nên cron chạy lại cũng không gửi trùng.
- Mỗi cảnh báo bắn tối đa một lần mỗi ngày.
