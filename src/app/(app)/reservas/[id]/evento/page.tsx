'use client'

import { useParams } from 'next/navigation'
import { PainelEvento } from '@/features/checkin/components/painel-evento'

// Painel do organizador (dono da reserva ou admin)
export default function PainelEventoPage() {
  const { id } = useParams<{ id: string }>()
  return <PainelEvento reservaId={id} />
}
