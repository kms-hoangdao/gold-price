-- Chạy SAU khi deploy Edge Functions. Lưu service role key vào Vault trước:
--   select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');
--   select vault.create_secret('https://<project>.supabase.co', 'project_url');
-- pg_cron chạy theo UTC: giờ Việt Nam = UTC + 7.

create or replace function call_function(fn text) returns void language sql as $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/' || fn,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
$$;

-- Thu thập mỗi 20 phút từ 8h00 đến 20h40 giờ VN (01:00–13:40 UTC)
select cron.schedule('collect-day', '*/20 1-13 * * *', $$ select call_function('collect') $$);
-- Lần chốt trước bản tin: 8h45 giờ VN
select cron.schedule('collect-morning', '45 1 * * *', $$ select call_function('collect') $$);
-- Bản tin sáng: 9h00 giờ VN
select cron.schedule('daily-digest', '0 2 * * *', $$ select call_function('send-digest') $$);
