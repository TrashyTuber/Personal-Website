import type { Metadata } from 'next';
import { Ma_Shan_Zheng, ZCOOL_XiaoWei } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import Spine from '@/components/spine';
import SiteFooter from '@/components/site-footer';
import './globals.css';

// The site face — ZCOOL XiaoWei's carved terminals over Noto's stock forms
// (owner + outside feedback: the default serif read generic). Since the
// typography round it carries body AND display duty; Noto is retired.
const zcoolXiaoWei = ZCOOL_XiaoWei({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-zcool-xiaowei',
  display: 'swap',
  adjustFontFallback: false,
  fallback: ['Georgia', 'serif'],
});

// Brush kaishu, duilian only — couplets are the one element that is
// literally calligraphy. Trial run; owner reserves judgment.
const maShanZheng = Ma_Shan_Zheng({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-ma-shan-zheng',
  display: 'swap',
  adjustFontFallback: false,
  fallback: ['Georgia', 'serif'],
});

const description =
  'Yiming Jia — engineer and composer. CS at Northwestern, Composition at Bienen. Projects, music, and minesweeper.';

export const metadata: Metadata = {
  // The custom domain (attached 2026-07-27; the old vercel.app URL still
  // aliases here). This is the base every relative OG/canonical URL
  // resolves against.
  metadataBase: new URL('https://yimingjia.dev'),
  title: 'Yiming Jia — 贾一茗',
  description,
  openGraph: {
    title: 'Yiming Jia — 贾一茗',
    description,
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${zcoolXiaoWei.variable} ${maShanZheng.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-ink font-serif-sc text-paper antialiased">
        <Spine />
        {/* flex-col so a page root with flex-1 (the homepage) can fill main's
            exact height — percentage min-heights don't resolve against a
            flex-stretched block parent. Other pages' mx-auto roots are
            unaffected. */}
        <main className="flex flex-1 flex-col md:pl-[88px]">{children}</main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
