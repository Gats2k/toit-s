// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SharedLayout } from '@/components/shared-layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ToiletFinder - Find public toilets near you',
  description: 'Find clean, accessible public toilets near your location with ease.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <SharedLayout renderHeader>{children}</SharedLayout>
      </body>
    </html>
  );
}