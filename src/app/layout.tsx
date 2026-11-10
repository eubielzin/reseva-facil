import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ptBR } from '@clerk/localizations'
import './globals.css'
import { Providers } from '@/components/providers'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'ReservaFácil — Gerenciamento de Salas',
  description: 'Sistema de reservas de salas de reunião',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`}>
      <body suppressHydrationWarning className={`${geist.className} h-full antialiased bg-ground text-foreground`}>
        <ClerkProvider signInUrl="/entrar" signUpUrl="/cadastro" afterSignOutUrl="/entrar" localization={ptBR}>
          <Providers>
            {children}
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  )
}
