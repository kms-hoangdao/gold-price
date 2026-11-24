/** 148000000 → "148,0" (triệu đồng) */
export const trieu = (vnd: number) =>
  (vnd / 1_000_000).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** 26410 → "26.410" */
export const dong = (n: number) => Math.round(n).toLocaleString('vi-VN');

export const timeVN = (iso: string) =>
  new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });

export const dateVN = (d = new Date()) =>
  d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });

/** Thay đổi giá bán so với hôm qua, đơn vị triệu. null nếu không có dữ liệu. */
export function change(now: number, prev: number | null) {
  if (!prev) return null;
  const d = (now - prev) / 1_000_000;
  if (d === 0) return { text: '0', dir: 'flat' as const };
  return {
    text: `${d > 0 ? '▲' : '▼'} ${Math.abs(d).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}`,
    dir: d > 0 ? ('up' as const) : ('down' as const),
  };
}
