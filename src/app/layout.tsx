import type { Metadata } from 'next';
import {
  Noto_Sans_Arabic,
  Noto_Sans_Devanagari,
  Plus_Jakarta_Sans,
} from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const notoArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-devanagari',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ShifaClear | Multilingual Med & Lab Demystifier',
  description:
    'Physician-engineered UAE health translator combining Gemini 3.8 Flash multimodal extraction with deterministic clinical safety guardrails across English, Arabic, Urdu, Tagalog, and Hindi.',
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
      className={`${plusJakarta.variable} ${notoArabic.variable} ${notoDevanagari.variable}`}
    >
      <body className="min-h-screen bg-[#F7F9F8] text-slate-900 antialiased selection:bg-teal-100 selection:text-teal-900">
        {children}
      </body>
    </html>
  );
}
