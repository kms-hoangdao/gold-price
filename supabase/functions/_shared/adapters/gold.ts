import { Adapter } from '../types.ts';

/**
 * Adapter giá vàng cho từng tiệm. Chưa cài đặt vì cách mỗi tiệm công bố giá
 * (endpoint JSON/XML ẩn sau trang bảng giá, hay chỉ có HTML) cần kiểm tra trực tiếp.
 *
 * Cách làm cho mỗi tiệm:
 * 1. Mở trang bảng giá trong Chrome DevTools → tab Network → lọc Fetch/XHR.
 *    Nếu có request trả JSON/XML chứa giá: gọi thẳng endpoint đó.
 *    Nếu không: lấy HTML và đọc bảng giá theo selector.
 * 2. Quy đổi về VND/lượng (nhiều tiệm niêm yết nghìn đồng/chỉ: × 1.000 × 10).
 * 3. Gọi assertLuongPrice() cho mọi giá trước khi trả về.
 * 4. Đặt url trong bảng sources và bật active = true.
 * 5. Đọc điều khoản sử dụng của trang trước khi thu thập tự động.
 */
const notImplemented = (shop: string): Adapter => async () => {
  throw new Error(`Adapter ${shop} chưa được cài đặt, xem hướng dẫn trong adapters/gold.ts`);
};

export const goldSjc = notImplemented('SJC');
export const goldPnj = notImplemented('PNJ');
export const goldDoji = notImplemented('DOJI');
export const goldMihong = notImplemented('Mi Hồng');
export const fxFree = notImplemented('USD tự do');
