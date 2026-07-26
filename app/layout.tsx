import type { Metadata } from 'next';
import { Noto_Serif_SC } from 'next/font/google';
import Spine from '@/components/spine';
import SiteFooter from '@/components/site-footer';
import './globals.css';

const notoSerifSC = Noto_Serif_SC({
  weight: ['300', '400'],
  subsets: ['latin'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
  adjustFontFallback: false,
  fallback: ['Georgia', 'serif'],
});

const description =
  'Yiming Jia — engineer and composer. CS at Northwestern, Composition at Bienen. Projects, music, and minesweeper.';

export const metadata: Metadata = {
  // Live deployment. Swap this for the custom domain if one is ever attached —
  // it is the base every relative OG/canonical URL resolves against.
  metadataBase: new URL('https://personal-website-steel-nu-27.vercel.app'),
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
    <html lang="en" className={notoSerifSC.variable}>
      <body className="flex min-h-screen flex-col bg-ink font-serif-sc text-paper antialiased">
        <Spine />
        <main className="flex-1 md:pl-[72px]">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
