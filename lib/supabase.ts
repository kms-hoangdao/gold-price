import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Đọc biến môi trường, báo lỗi rõ tên biến nếu thiếu (thay vì "supabaseUrl is required"). */
function env(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Thiếu biến môi trường ${name}. Sao chép .env.example thành .env.local và điền giá trị (xem README, bước 5).`,
    );
  }
  return v;
}

let readClient: SupabaseClient | undefined;

/** Client chỉ đọc (anon key), dùng trong Server Components. RLS chỉ cho phép SELECT.
 *  Khởi tạo lười để việc import module không ném lỗi khi Next.js thu thập page data lúc build. */
export function supabase(): SupabaseClient {
  readClient ??= createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('NEXT_PUBLIC_SUPABASE_ANON_KEY'), {
    auth: { persistSession: false },
  });
  return readClient;
}

/** Client service role, CHỈ dùng trong API route phía server. */
export function supabaseAdmin(): SupabaseClient {
  return createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  });
}
