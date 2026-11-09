'use client'

import { useParams } from 'next/navigation'
import { EventoDetalhe } from '@/features/eventos/components/evento-detalhe'

export default function EventoPage() {
  const { id } = useParams<{ id: string }>()
  return <EventoDetalhe id={id} />
}
