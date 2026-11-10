'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { useRole } from '@/hooks/use-role'
import { BrandMark, BrandName } from '@/components/brand-mark'
import { NotificationBell } from '@/features/notificacoes/components/notification-bell'
import { CalendarDays, LayoutDashboard, DoorOpen, Inbox, PartyPopper, Ticket, UserRound, type LucideIcon } from 'lucide-react'
import type { Papel } from '@/types'

interface NavLink {
  href: string
  label: string
  icon: LucideIcon
}

const LINKS: Record<Papel, NavLink[]> = {
  admin: [
    { href: '/', label: 'Hoje', icon: LayoutDashboard },
    { href: '/pedidos', label: 'Pedidos', icon: Inbox },
    { href: '/salas', label: 'Salas', icon: DoorOpen },
    { href: '/reservas', label: 'Reservas', icon: CalendarDays },
    { href: '/eventos', label: 'Eventos', icon: PartyPopper },
    { href: '/ingressos', label: 'Ingressos', icon: Ticket },
    { href: '/perfil', label: 'Perfil', icon: UserRound },
  ],
  organizador: [
    { href: '/reservas', label: 'Minhas reservas', icon: CalendarDays },
    { href: '/salas', label: 'Salas', icon: DoorOpen },
    { href: '/eventos', label: 'Eventos', icon: PartyPopper },
    { href: '/ingressos', label: 'Ingressos', icon: Ticket },
    { href: '/perfil', label: 'Perfil', icon: UserRound },
  ],
  usuario: [
    { href: '/eventos', label: 'Eventos', icon: PartyPopper },
    { href: '/ingressos', label: 'Meus ingressos', icon: Ticket },
    { href: '/perfil', label: 'Perfil', icon: UserRound },
  ],
}

function useLinks() {
  const { papel, isLoaded } = useRole()
  return isLoaded ? LINKS[papel] : []
}

// Sidebar no mesmo fundo da página, sem borda; item ativo é um pill cinza neutro
export function Navbar() {
  const pathname = usePathname()
  const links = useLinks()

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-sidebar h-screen sticky top-0">
      <div className="flex items-center justify-between pl-5 pr-3 pt-6 pb-7">
        <BrandName />
        <NotificationBell />
      </div>
      <nav className="flex flex-col gap-0.5 px-3 flex-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                active
                  ? 'bg-sidebar-accent text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-5 py-5">
        <UserButton showName userProfileMode="navigation" userProfileUrl="/perfil" />
      </div>
    </aside>
  )
}

export function MobileHeader() {
  return (
    <header className="lg:hidden sticky top-0 z-40 flex h-12 items-center justify-between bg-ground px-4 md:px-8">
      <div className="flex items-center gap-2">
        <BrandMark />
        <span className="text-sm font-semibold">ReservaFácil</span>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <UserButton userProfileMode="navigation" userProfileUrl="/perfil" />
      </div>
    </header>
  )
}

export function MobileNav() {
  const pathname = usePathname()
  const links = useLinks()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card flex">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-colors',
              active ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.75} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
