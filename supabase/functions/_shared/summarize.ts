/** Tóm tắt tiêu đề bài bằng Claude Haiku. Trả null nếu không có API key hoặc lỗi. */
export async function summarize(title: string, url: string): Promise<string | null> {
  const key = Deno.env.get('ANTHROPIC_API_KEY');
  if (!key) return null;
  try {
    const page = await fetch(url).then((r) => r.text()).catch(() => '');
    const text = page.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '')
      .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 6000);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Tóm tắt bài báo sau bằng tiếng Việt trong tối đa 2 câu ngắn, chỉ nêu sự kiện chính, không bình luận. Chỉ trả về phần tóm tắt.\n\nTiêu đề: ${title}\n\nNội dung trang: ${text}`,
        }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.content?.find((b: { type: string }) => b.type === 'text')?.text?.trim() ?? null;
  } catch {
    return null;
  }
}
