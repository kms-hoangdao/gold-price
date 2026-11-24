/** "148.000.000" | "148,000" | "14.800" (nghìn đ/chỉ) → số. Không đoán đơn vị: adapter tự quy đổi. */
export function parseVnNumber(raw: string): number {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) throw new Error(`Không đọc được số: "${raw}"`);
  return Number(digits);
}

export const CHI_PER_LUONG = 10;

/** Giá hợp lệ cho 1 lượng vàng: chặn lỗi đơn vị (ví dụ nhầm nghìn đồng/chỉ). */
export function assertLuongPrice(vnd: number) {
  if (vnd < 50_000_000 || vnd > 500_000_000) {
    throw new Error(`Giá ${vnd} nằm ngoài khoảng hợp lý cho 1 lượng`);
  }
}

/** Lệch quá ngưỡng so với giá trước → đánh dấu cần kiểm tra thay vì hiển thị. */
export function isSuspicious(prev: number | null, next: number, maxPct = 5): boolean {
  if (!prev) return false;
  return (Math.abs(next - prev) / prev) * 100 > maxPct;
}

/** Ngày hiện tại theo giờ Việt Nam, dạng YYYY-MM-DD. */
export function todayVN(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
}
