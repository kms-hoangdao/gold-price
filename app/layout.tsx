import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import { TabBar } from '@/components/TabBar';
import { RegisterSW } from '@/components/RegisterSW';
import './globals.css';

const font = Be_Vietnam_Pro({ subsets: ['latin', 'vietnamese'], weight: ['400', '500', '600', '700'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Giá vàng Sài Gòn',
  description: 'Giá vàng các tiệm ở Sài Gòn, tỷ giá USD và bản tin sáng mỗi ngày.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Giá vàng SG', statusBarStyle: 'default' },
  icons: { icon: '/icon-192.png', apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F5F0' },
    { media: '(prefers-color-scheme: dark)', color: '#151412' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={font.variable}>
      <body>
        {children}
        <TabBar />
        <RegisterSW />
      </body>
    </html>
  );
}
