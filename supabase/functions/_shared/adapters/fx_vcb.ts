import { Adapter, UA } from '../types.ts';
import { parseVnNumber } from '../normalize.ts';

// Vietcombank công bố tỷ giá dạng XML: <Exrate CurrencyCode="USD" Buy="..." Transfer="..." Sell="..." />
// Kiểm tra lại URL trong bảng sources nếu adapter báo lỗi.
export const fxVcb: Adapter = async (source) => {
  const res = await fetch(source.url!, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`VCB HTTP ${res.status}`);
  const xml = await res.text();
  const m = xml.match(/<Exrate[^>]*CurrencyCode="USD"[^>]*>/);
  if (!m) throw new Error('Không tìm thấy USD trong XML Vietcombank');
  const attr = (name: string) => m[0].match(new RegExp(`${name}="([^"]+)"`))?.[1];
  const buy = attr('Transfer') ?? attr('Buy');
  const sell = attr('Sell');
  if (!buy || !sell) throw new Error('Thiếu Buy/Sell trong XML Vietcombank');
  // Giá dạng "26,180.00": bỏ phần thập phân rồi đọc số
  return {
    kind: 'fx',
    items: [{ currency: 'USD', buy: parseVnNumber(buy.split('.')[0]), sell: parseVnNumber(sell.split('.')[0]) }],
  };
};
