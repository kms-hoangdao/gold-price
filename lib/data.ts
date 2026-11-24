import { supabase } from './supabase';

export type PriceRow = {
  slug: string; name: string; product: 'ring_9999' | 'bar_sjc';
  buy: number; sell: number; collected_at: string; prev_sell: number | null;
};
export type FxRow = { slug: string; name: string; currency: string; buy: number; sell: number; collected_at: string };

const SHOP_ORDER = ['sjc', 'pnj', 'doji', 'mihong'];

export async function getBoard() {
  const [{ data: prices }, { data: fx }] = await Promise.all([
    supabase().from('latest_prices').select('*'),
    supabase().from('latest_fx').select('*').eq('currency', 'USD'),
  ]);
  const rows = ((prices ?? []) as PriceRow[]).sort(
    (a, b) => SHOP_ORDER.indexOf(a.slug) - SHOP_ORDER.indexOf(b.slug),
  );
  return {
    ring: rows.filter((r) => r.product === 'ring_9999'),
    bar: rows.filter((r) => r.product === 'bar_sjc'),
    fx: (fx ?? []) as FxRow[],
  };
}

export type DigestNews = { title: string; url: string; summary: string | null; published_at: string | null; sources: { name: string } | null };
export type Digest = {
  date: string; title: string; short: string;
  body: { gold: (PriceRow & { stale: boolean })[]; fx: FxRow[]; finance: DigestNews[]; tech: DigestNews[] };
};

export async function getLatestDigest(): Promise<Digest | null> {
  const { data } = await supabase().from('digests').select('*').order('date', { ascending: false }).limit(1).maybeSingle();
  return data as Digest | null;
}
