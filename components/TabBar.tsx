'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: 'Bảng giá', d: 'M3 5h18v14H3zM3 10h18M9 10v9' },
  { href: '/chart', label: 'Biểu đồ', d: 'M3 17l6-6 4 4 8-8M15 7h6v6' },
  { href: '/digest', label: 'Bản tin', d: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM9 9h6M9 13h6' },
  { href: '/alerts', label: 'Cảnh báo', d: 'M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0' },
];

export function TabBar() {
  const path = usePathname();
  return (
    <nav className="tabbar" aria-label="Điều hướng chính">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} aria-current={path === t.href ? 'page' : undefined}>
          <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={t.d} /></svg>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
