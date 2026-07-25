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

export const metadata: Metadata = {
  title: 'Yiming Jia — 贾一茗',
  description:
    'Yiming Jia — engineer and composer. CS at Northwestern, Composition at Bienen. Projects, music, and minesweeper.',
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
