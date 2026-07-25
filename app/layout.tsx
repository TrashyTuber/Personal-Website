import type { Metadata } from 'next';
import { Noto_Serif_SC } from 'next/font/google';
import './globals.css';

const notoSerifSC = Noto_Serif_SC({
  weight: ['300', '400', '600'],
  subsets: ['latin'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
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
      <body className="min-h-screen bg-ink font-serif-sc text-paper antialiased">
        <main className="md:pl-[72px]">{children}</main>
      </body>
    </html>
  );
}
