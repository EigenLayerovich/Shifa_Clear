import type { Metadata } from 'next';
import {
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  IBM_Plex_Sans_Arabic,
  Noto_Sans_Devanagari,
} from 'next/font/google';
import './globals.css';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600'],
  variable: '--font-arabic',
  display: 'swap',
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600'],
  variable: '--font-devanagari',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ShifaClear — Clinical Lab & Prescription Interpreter',
  description:
    'Multilingual UAE lab report and prescription interpreter pairing multimodal extraction with deterministic clinical safety guardrails.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} ${ibmPlexArabic.variable} ${notoDevanagari.variable}`}
    >
      <body className="min-h-screen bg-[#fafafa] text-[#171717] antialiased selection:bg-[#0f766e]/15 selection:text-[#0f766e]">
        {children}
      </body>
    </html>
  );
}
