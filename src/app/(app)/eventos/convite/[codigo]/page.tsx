'use client'

import { useParams } from 'next/navigation'
import { EventoDetalhe } from '@/features/eventos/components/evento-detalhe'

// Link secreto de evento privado, divulgado pelo organizador
export default function ConvitePage() {
  const { codigo } = useParams<{ codigo: string }>()
  return <EventoDetalhe convite={codigo} />
}
