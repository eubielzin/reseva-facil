import { Navbar, MobileHeader, MobileNav } from '@/components/navbar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <Navbar />
      <main className="flex-1 min-w-0 overflow-y-auto pb-20 lg:pb-0">
        <MobileHeader />
        {/* Canvas fluido: uma margem só (16px no celular, 32px no desktop) */}
        <div className="mx-auto max-w-[1280px] px-4 pt-4 pb-10 md:px-8 md:pt-9">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
