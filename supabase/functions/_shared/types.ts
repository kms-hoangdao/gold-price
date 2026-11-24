export type SourceRow = {
  id: number;
  slug: string;
  name: string;
  kind: 'gold_shop' | 'fx' | 'news_finance' | 'news_tech';
  url: string | null;
  adapter: string;
};

/** Giá vàng đã chuẩn hoá: VND cho 1 lượng. */
export type GoldPrice = { product: 'ring_9999' | 'bar_sjc'; buy: number; sell: number };
export type FxRate = { currency: string; buy: number; sell: number };
export type Article = { title: string; url: string; published_at: string | null };

export type AdapterResult =
  | { kind: 'gold'; items: GoldPrice[] }
  | { kind: 'fx'; items: FxRate[] }
  | { kind: 'news'; items: Article[] };

export type Adapter = (source: SourceRow) => Promise<AdapterResult>;

export const UA = 'Mozilla/5.0 (compatible; GiaVangSG/0.1; +https://github.com/)';
