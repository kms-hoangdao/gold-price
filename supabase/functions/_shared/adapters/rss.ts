import { Adapter, UA } from '../types.ts';

const decode = (s: string) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

const tag = (block: string, name: string) =>
  block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1];

/** RSS 2.0 (<item>) và Atom (<entry>), lấy tối đa 15 bài mới nhất. */
export const rss: Adapter = async (source) => {
  const res = await fetch(source.url!, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`RSS HTTP ${res.status}`);
  const xml = await res.text();
  const blocks = [...xml.matchAll(/<(item|entry)[\s>][\s\S]*?<\/\1>/g)].map((m) => m[0]).slice(0, 15);

  const items = blocks.map((b) => {
    const atomLink = b.match(/<link[^>]*href="([^"]+)"/)?.[1];
    const url = decode(tag(b, 'link') ?? '') || atomLink || '';
    const date = tag(b, 'pubDate') ?? tag(b, 'published') ?? tag(b, 'updated');
    return {
      title: decode(tag(b, 'title') ?? ''),
      url,
      published_at: date ? new Date(decode(date)).toISOString() : null,
    };
  }).filter((a) => a.title && a.url.startsWith('http'));

  return { kind: 'news', items };
};
