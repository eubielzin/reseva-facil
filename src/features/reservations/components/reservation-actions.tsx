'use client'

import { useState } from 'react'
import { Ban, Check, MoreHorizontal, Pencil, Trash2, Undo2, X } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ReservationDialog } from './reservation-dialog'
import { RecusarDialog } from './recusar-dialog'
import { useDeleteReservation, useMudarStatusReserva } from '@/hooks/use-reservations'
import { useRole } from '@/hooks/use-role'
import { podeEditarReserva, proximoStatus } from '@/lib/business-rules'
import type { AcaoReserva, ReservationWithRoom } from '@/types'

interface Confirmacao {
  acao: AcaoReserva
  titulo: string
  descricao: string
  rotulo: string
  destrutiva: boolean
}

// Ações de acordo com o papel e o status (regras espelhadas de BusinessRules.java)
export function ReservationActions({ reservation }: { reservation: ReservationWithRoom }) {
  const { papel, isAdmin } = useRole()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [recusarOpen, setRecusarOpen] = useState(false)
  const [confirmacao, setConfirmacao] = useState<Confirmacao | null>(null)
  const deleteReservation = useDeleteReservation()
  const mudarStatus = useMudarStatusReserva()

  // Quem não é admin só recebe da API as próprias reservas
  const dono = !isAdmin
  const status = reservation.status
  const pode = (acao: AcaoReserva) => proximoStatus(status, acao, papel, dono) !== null
  const podeEditar = podeEditarReserva(status, papel, dono)
  const cancelarVira = proximoStatus(status, 'cancelar', papel, dono)

  const outros = reservation.concorrentes ?? 0
  const itens = [
    podeEditar,
    pode('aprovar'),
    pode('recusar'),
    pode('aprovar_cancelamento'),
    pode('recusar_cancelamento'),
    cancelarVira !== null,
    isAdmin,
  ]
  if (!itens.some(Boolean)) return null

  function confirmar() {
    if (!confirmacao) return
    mudarStatus.mutate(
      { id: reservation.id, acao: confirmacao.acao },
      { onSuccess: () => setConfirmacao(null) }
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {pode('aprovar') && (
            <DropdownMenuItem
              onClick={() =>
                setConfirmacao({
                  acao: 'aprovar',
                  titulo: 'Aprovar pedido',
                  descricao:
                    outros > 0
                      ? `Os outros ${outros} pedidos deste horário serão recusados automaticamente.`
                      : `Aprovar "${reservation.titulo}"? O organizador será avisado por email.`,
                  rotulo: 'Aprovar',
                  destrutiva: false,
                })
              }
            >
              <Check className="h-4 w-4 mr-2" />
              Aprovar
            </DropdownMenuItem>
          )}
          {pode('recusar') && (
            <DropdownMenuItem onClick={() => setRecusarOpen(true)}>
              <X className="h-4 w-4 mr-2" />
              Recusar
            </DropdownMenuItem>
          )}
          {pode('aprovar_cancelamento') && (
            <DropdownMenuItem
              onClick={() =>
                setConfirmacao({
                  acao: 'aprovar_cancelamento',
                  titulo: 'Aprovar cancelamento',
                  descricao: `A reserva "${reservation.titulo}" será cancelada e o horário liberado.`,
                  rotulo: 'Aprovar cancelamento',
                  destrutiva: true,
                })
              }
            >
              <Check className="h-4 w-4 mr-2" />
              Aprovar cancelamento
            </DropdownMenuItem>
          )}
          {pode('recusar_cancelamento') && (
            <DropdownMenuItem
              onClick={() =>
                setConfirmacao({
                  acao: 'recusar_cancelamento',
                  titulo: 'Recusar cancelamento',
                  descricao: `A reserva "${reservation.titulo}" continua valendo.`,
                  rotulo: 'Recusar cancelamento',
                  destrutiva: false,
                })
              }
            >
              <Undo2 className="h-4 w-4 mr-2" />
              Recusar cancelamento
            </DropdownMenuItem>
          )}
          {podeEditar && (
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
          )}
          {cancelarVira !== null && (
            <DropdownMenuItem
              onClick={() =>
                setConfirmacao(
                  cancelarVira === 'cancelamento_solicitado'
                    ? {
                        acao: 'cancelar',
                        titulo: 'Solicitar cancelamento',
                        descricao: `"${reservation.titulo}" já foi aprovada. O administrador precisa aprovar o cancelamento; até lá a reserva continua valendo.`,
                        rotulo: 'Solicitar cancelamento',
                        destrutiva: true,
                      }
                    : {
                        acao: 'cancelar',
                        titulo: 'Cancelar reserva',
                        descricao: `Tem certeza que deseja cancelar "${reservation.titulo}"?`,
                        rotulo: 'Cancelar reserva',
                        destrutiva: true,
                      }
                )
              }
              variant="destructive"
            >
              <Ban className="h-4 w-4 mr-2" />
              {cancelarVira === 'cancelamento_solicitado' ? 'Solicitar cancelamento' : 'Cancelar'}
            </DropdownMenuItem>
          )}
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDeleteOpen(true)} variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ReservationDialog open={editOpen} onOpenChange={setEditOpen} reservation={reservation} />

      <RecusarDialog
        open={recusarOpen}
        onOpenChange={setRecusarOpen}
        reservaId={reservation.id}
        titulo={reservation.titulo}
      />

      <ConfirmDialog
        open={confirmacao !== null}
        onOpenChange={(open) => !open && setConfirmacao(null)}
        title={confirmacao?.titulo ?? ''}
        description={confirmacao?.descricao ?? ''}
        onConfirm={confirmar}
        loading={mudarStatus.isPending}
        confirmLabel={confirmacao?.rotulo}
        loadingLabel="Salvando..."
        variant={confirmacao?.destrutiva ? 'destructive' : 'default'}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir reserva"
        description={`Tem certeza que deseja excluir a reserva "${reservation.titulo}"? Isso apaga o registro de vez; para manter o histórico, use Cancelar.`}
        onConfirm={() => deleteReservation.mutate(reservation.id, { onSuccess: () => setDeleteOpen(false) })}
        loading={deleteReservation.isPending}
      />
    </>
  )
}
