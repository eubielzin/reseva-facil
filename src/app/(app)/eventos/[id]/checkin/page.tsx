'use client'

import { useParams } from 'next/navigation'
import { ErrorState } from '@/components/error-state'
import { CardSkeleton } from '@/components/loading-state'
import { LeitorCheckin } from '@/features/checkin/components/leitor-checkin'
import { useCheckinInfo } from '@/hooks/use-checkin'

// Leitor da porta: dono do evento, admin ou colaborador escolhido pelo dono
export default function CheckinPage() {
  const { id } = useParams<{ id: string }>()
  const { data: info, isLoading, isError, error, refetch } = useCheckinInfo(id)

  if (isLoading) return <CardSkeleton className="mx-auto h-64 max-w-xl rounded-lg border bg-card p-5 space-y-3" />
  if (isError) {
    return (
      <div className="mx-auto max-w-xl">
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </div>
    )
  }
  return info ? <LeitorCheckin info={info} /> : null
}
