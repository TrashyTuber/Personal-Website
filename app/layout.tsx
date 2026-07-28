import type { Metadata } from 'next';
import { Ma_Shan_Zheng, Spectral, ZCOOL_XiaoWei } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import Spine from '@/components/spine';
import SiteFooter from '@/components/site-footer';
import { SITE_URL } from '@/content/site';
import './globals.css';

// Prose Latin — XiaoWei is a display face and tired the owner's eyes as
// body text (its unserifed capital I reads as l). Latin-only load; hanzi
// inside prose falls through the body stack to XiaoWei per glyph.
const spectral = Spectral({
  weight: ['300', '400'],
  subsets: ['latin'],
  variable: '--font-spectral',
  display: 'swap',
  adjustFontFallback: false,
  fallback: ['Georgia', 'serif'],
});

// The display face — ZCOOL XiaoWei's carved terminals over Noto's stock
// forms (owner + outside feedback: the default serif read generic). Carries
// all hanzi and all display Latin (titles); Noto is retired.
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
  // The base every relative OG/canonical URL resolves against. The old
  // vercel.app URL still aliases the deployment.
  metadataBase: new URL(SITE_URL),
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
      className={`${spectral.variable} ${zcoolXiaoWei.variable} ${maShanZheng.variable}`}
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
