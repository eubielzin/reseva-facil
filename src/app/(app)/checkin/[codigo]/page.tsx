'use client'

import { useParams } from 'next/navigation'
import { ErrorState } from '@/components/error-state'
import { CardSkeleton } from '@/components/loading-state'
import { LeitorCheckin } from '@/features/checkin/components/leitor-checkin'
import { useCheckinInfo } from '@/hooks/use-checkin'

// Leitor da porta, aberto pelo link de check-in (equipe de apoio, organizador ou admin)
export default function CheckinPage() {
  const { codigo } = useParams<{ codigo: string }>()
  const { data: info, isLoading, isError, error, refetch } = useCheckinInfo(codigo)

  if (isLoading) return <CardSkeleton className="mx-auto h-64 max-w-xl rounded-lg border bg-card p-5 space-y-3" />
  if (isError) {
    return (
      <div className="mx-auto max-w-xl">
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </div>
    )
  }
  return info ? <LeitorCheckin info={info} codigoCheckin={codigo} /> : null
}
