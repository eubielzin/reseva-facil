'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DoorOpen, CalendarDays, Activity, Clock } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { ErrorState } from '@/components/error-state'
import { CardSkeleton } from '@/components/loading-state'
import { StatsCard } from '@/features/dashboard/components/stats-card'
import { UpcomingReservations } from '@/features/dashboard/components/upcoming-reservations'
import { useDashboard } from '@/hooks/use-reservations'
import { useRole } from '@/hooks/use-role'

export default function DashboardPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useRole()
  const { data, isLoading, isError, refetch } = useDashboard()

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.replace('/reservas')
    }
  }, [isLoaded, isAdmin, router])

  if (!isLoaded || !isAdmin) return null

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral das salas e reservas."
      />

      {isError && (
        <ErrorState
          message="Não foi possível carregar os dados do dashboard."
          onRetry={() => refetch()}
        />
      )}

      {!isError && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {isLoading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : (
              <>
                <StatsCard
                  title="Total de salas"
                  value={data?.total_salas ?? 0}
                  description="Salas cadastradas no sistema"
                  icon={DoorOpen}
                />
                <StatsCard
                  title="Total de reservas"
                  value={data?.total_reservas ?? 0}
                  description="Reservas registradas no sistema"
                  icon={CalendarDays}
                />
                <StatsCard
                  title="Em andamento"
                  value={data?.reservas_em_andamento ?? 0}
                  description="Reservas acontecendo agora"
                  icon={Activity}
                />
                <StatsCard
                  title="Próximas reservas"
                  value={data?.proximas_reservas?.length ?? 0}
                  description="Agendadas para os próximos dias"
                  icon={Clock}
                />
              </>
            )}
          </div>

          <div className="max-w-2xl">
            {isLoading ? (
              <CardSkeleton />
            ) : (
              <UpcomingReservations reservations={data?.proximas_reservas ?? []} />
            )}
          </div>
        </>
      )}
    </div>
  )
}
