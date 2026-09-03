'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { useRole } from '@/hooks/use-role'
import { CalendarDays, LayoutDashboard, DoorOpen } from 'lucide-react'

const adminLinks = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/salas', label: 'Salas', icon: DoorOpen },
  { href: '/reservas', label: 'Reservas', icon: CalendarDays },
]

const userLinks = [
  { href: '/salas', label: 'Salas', icon: DoorOpen },
  { href: '/reservas', label: 'Reservas', icon: CalendarDays },
]

export function Navbar() {
  const pathname = usePathname()
  const { isAdmin } = useRole()
  const links = isAdmin ? adminLinks : userLinks

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r bg-background h-screen sticky top-0">
      <div className="px-6 py-5 border-b">
        <span className="font-bold text-lg tracking-tight">ReservaFácil</span>
      </div>
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <UserButton showName />
      </div>
    </aside>
  )
}

export function MobileNav() {
  const pathname = usePathname()
  const { isAdmin } = useRole()
  const links = isAdmin ? adminLinks : userLinks

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background flex">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
            pathname === href
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="h-5 w-5" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
