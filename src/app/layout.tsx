import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Providers } from '@/components/providers'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ReservaFácil — Gerenciamento de Salas',
  description: 'Sistema de reservas de salas de reunião',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body suppressHydrationWarning className={`${geist.className} h-full antialiased bg-background text-foreground`}>
        <ClerkProvider>
          <Providers>
            {children}
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  )
}
