// components/shared-layout.tsx
'use client'

import { ThemeProvider } from '@/components/ui/theme-provider';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export function SharedLayout({ children, renderHeader=false }: { children: React.ReactNode, renderHeader?: boolean }) {
  return (
    <ThemeProvider>
      <div className="flex flex-col min-h-screen">
        {renderHeader && <Header />}
        <main className="flex-1 container max-w-4xl px-2 sm:px-4 py-6 md:py-10 mx-auto w-full">
          {children}
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  )
}