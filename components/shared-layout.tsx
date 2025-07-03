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
        <main className="flex-1 w-full py-6 md:py-10">
          {children}
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  )
}