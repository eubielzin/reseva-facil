import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { requireAdmin } from '@/lib/roles'
import { reservationSchema } from '@/schemas/reservation'
import {
  getReservationById,
  updateReservation,
  deleteReservation,
  findConflicts,
} from '@/repositories/reservations'
import { getRoomById } from '@/repositories/rooms'
import { isWeekend, isMadrugada, exceedsCapacity } from '@/lib/business-rules'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const reservation = await getReservationById(id)
    if (!reservation) {
      return NextResponse.json({ error: 'Reserva não encontrada.' }, { status: 404 })
    }
    return NextResponse.json(reservation)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar reserva.' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const { id } = await params
    const body = await req.json()
    const parsed = reservationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const existing = await getReservationById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Reserva não encontrada.' }, { status: 404 })
    }

    const { sala_id, quantidade_participantes, data, horario_inicio, horario_fim } = parsed.data

    // Regra 2 — Capacidade da sala
    const sala = await getRoomById(sala_id)
    if (!sala) {
      return NextResponse.json({ error: 'Sala não encontrada.' }, { status: 404 })
    }
    if (exceedsCapacity(quantidade_participantes, sala.capacidade)) {
      return NextResponse.json(
        {
          error: `A sala "${sala.nome}" comporta no máximo ${sala.capacidade} participante(s). Você informou ${quantidade_participantes}.`,
        },
        { status: 409 }
      )
    }

    // Regra 3 — Disponibilidade no fim de semana
    if (!sala.disponivel_fim_de_semana && isWeekend(data)) {
      return NextResponse.json(
        { error: `A sala "${sala.nome}" não está disponível nos fins de semana.` },
        { status: 409 }
      )
    }

    // Regra 4 — Disponibilidade na madrugada
    if (!sala.disponivel_madrugada && isMadrugada(horario_inicio)) {
      return NextResponse.json(
        { error: `A sala "${sala.nome}" não aceita reservas antes das 08:00.` },
        { status: 409 }
      )
    }

    // Regra 1 — Conflito de horário (exclui a própria reserva da verificação)
    const conflicts = await findConflicts(sala_id, data, horario_inicio, horario_fim, id)
    if (conflicts.length > 0) {
      const c = conflicts[0]
      return NextResponse.json(
        {
          error: `Conflito de horário: já existe uma reserva nesta sala das ${c.horario_inicio.slice(0, 5)} às ${c.horario_fim.slice(0, 5)}.`,
        },
        { status: 409 }
      )
    }

    const reservation = await updateReservation(id, parsed.data)
    return NextResponse.json(reservation)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar reserva.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const { id } = await params
    const existing = await getReservationById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Reserva não encontrada.' }, { status: 404 })
    }

    await deleteReservation(id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir reserva.' }, { status: 500 })
  }
}
