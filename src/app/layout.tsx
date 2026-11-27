import type { Metadata, Viewport } from 'next';
import {
  Newsreader,
  Noto_Sans_Arabic,
  Noto_Sans_Devanagari,
  Plus_Jakarta_Sans,
} from 'next/font/google';
import './globals.css';

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

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

export const viewport: Viewport = {
  themeColor: '#0D5C56',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'ShifaClear | Multilingual Med & Lab Demystifier',
  description:
    'Physician-engineered UAE health translator combining Gemini 3.8 Flash multimodal extraction with deterministic clinical safety guardrails across English, Arabic, Urdu, Tagalog, and Hindi.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ShifaClear',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
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
      className={`${newsreader.variable} ${plusJakarta.variable} ${notoArabic.variable} ${notoDevanagari.variable}`}
    >
      <body className="min-h-screen bg-[#FAF9F6] text-[#18181B] antialiased selection:bg-[#0D5C56]/15 selection:text-[#0D5C56]">
        {children}
      </body>
    </html>
  );
}
