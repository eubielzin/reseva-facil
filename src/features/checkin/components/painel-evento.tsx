'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Download, MoreHorizontal, ScanLine, Search, ShieldCheck, ShieldOff, Undo2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ErrorState } from '@/components/error-state'
import { TableSkeleton } from '@/components/loading-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn, formatDate, formatTime } from '@/lib/utils'
import { baixarArquivo, gerarCsv } from '@/lib/csv'
import { useDefinirColaborador, useDesfazerCheckin, usePainelEvento } from '@/hooks/use-checkin'
import type { Participante } from '@/types'

type Presenca = 'todos' | 'vieram' | 'nao_vieram' | 'cancelados'

const PRESENCAS: { valor: Presenca; label: string }[] = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'vieram', label: 'Vieram' },
  { valor: 'nao_vieram', label: 'Não vieram' },
  { valor: 'cancelados', label: 'Cancelados' },
]

const quando = (iso?: string) => (iso ? format(new Date(iso), 'dd/MM HH:mm', { locale: ptBR }) : '')
const completo = (iso?: string) => (iso ? format(new Date(iso), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '')

function passa(p: Participante, presenca: Presenca): boolean {
  if (presenca === 'cancelados') return p.status === 'cancelado'
  if (p.status === 'cancelado') return presenca === 'todos'
  if (presenca === 'vieram') return !!p.check_in_em
  if (presenca === 'nao_vieram') return !p.check_in_em
  return true
}

/** Painel do organizador: quem pegou ingresso, quando, quem veio e a que horas. */
export function PainelEvento({ reservaId }: { reservaId: string }) {
  const { data: painel, isLoading, isError, refetch } = usePainelEvento(reservaId)
  const desfazer = useDesfazerCheckin(reservaId)
  const colaborador = useDefinirColaborador(reservaId)
  const [tag, setTag] = useState('')
  const [presenca, setPresenca] = useState<Presenca>('todos')
  const [busca, setBusca] = useState('')
  const [desfazendo, setDesfazendo] = useState<Participante | null>(null)

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return (painel?.participantes ?? []).filter(
      (p) =>
        (!tag || p.tag === tag) &&
        passa(p, presenca) &&
        (!termo ||
          [p.nome, p.email, p.codigo].some((v) => v?.toLowerCase().includes(termo)))
    )
  }, [painel, tag, presenca, busca])

  if (isLoading) return <TableSkeleton rows={6} cols={4} />
  if (isError || !painel) return <ErrorState message="Não foi possível carregar o painel do evento." onRetry={() => refetch()} />

  const { evento } = painel
  const porcentagem = evento.total > 0 ? Math.round((evento.presentes / evento.total) * 100) : 0

  function exportar() {
    const linhas = filtrados.map((p) => [
      p.nome ?? '',
      p.email ?? '',
      p.tag,
      p.codigo,
      p.status === 'cancelado' ? 'Cancelado' : p.check_in_em ? 'Veio' : 'Não veio',
      completo(p.emitido_em),
      completo(p.check_in_em),
      completo(p.cancelado_em),
    ])
    const csv = gerarCsv(
      ['Nome', 'Email', 'Tag', 'Código', 'Situação', 'Pegou o ingresso em', 'Chegou em', 'Cancelado em'],
      linhas
    )
    baixarArquivo(`participantes-${evento.titulo.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}-${evento.data}.csv`, csv)
  }

  const colaboradores = painel.participantes.filter((p) => p.colaborador && p.status === 'ativo')

  return (
    <div className="space-y-6">
      <div>
        <Link href="/reservas" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Reservas
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{evento.titulo}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(evento.data)} · {formatTime(evento.horario_inicio)}–{formatTime(evento.horario_fim)} ·{' '}
              {evento.sala_nome} · check-in a partir de {evento.abertura_checkin.slice(11, 16)}
              {evento.janela_aberta && ' · atualizando ao vivo'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/eventos/${evento.evento_id}/checkin`} className={buttonVariants({ size: 'lg' })}>
              <ScanLine className="h-4 w-4" />
              Abrir leitor
            </Link>
            <Button variant="outline" size="lg" onClick={exportar} disabled={filtrados.length === 0}>
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Totais: geral em destaque, por tag ao lado */}
      <section className="grid gap-3 rounded-lg border bg-card p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div>
          <p className="text-sm text-muted-foreground">Chegaram</p>
          <p className="mt-1 leading-none">
            <span className="text-[30px] font-medium tracking-tight">{evento.presentes}</span>
            <span className="text-sm text-muted-foreground"> de {evento.total} com ingresso</span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={porcentagem} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-booked transition-[width]" style={{ width: `${porcentagem}%` }} />
          </div>
          {painel.cancelados > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">{painel.cancelados} ingressos cancelados</p>
          )}
        </div>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
          {painel.por_tag.map((t) => (
            <li key={t.tag} className="text-sm">
              <span className="text-muted-foreground">{t.tag}</span>
              <span className="ml-2 font-medium">
                {t.presentes}/{t.ativos}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Colaboradores: escolhidos entre quem pegou ingresso */}
      <section className="flex items-start gap-3 rounded-lg border border-dashed px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {colaboradores.length === 0
            ? 'Quem vai ajudar na porta? Peça para a pessoa pegar um ingresso e, na lista abaixo, use "Tornar colaborador". Ela passa a ver o leitor de QR em Meus ingressos.'
            : `Colaboradores no leitor: ${colaboradores.map((p) => p.nome ?? p.codigo).join(', ')}. Para incluir mais alguém, use "Tornar colaborador" na lista.`}
        </p>
      </section>

      {/* Filtros */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Presença" className="flex h-9 items-center gap-0.5 rounded-md bg-muted p-0.5">
            {PRESENCAS.map(({ valor, label }) => (
              <button
                key={valor}
                type="button"
                aria-pressed={presenca === valor}
                onClick={() => setPresenca(valor)}
                className={cn(
                  'h-8 rounded-[5px] px-3 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  presenca === valor ? 'bg-card text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, email ou código"
              className="pl-8"
              aria-label="Buscar participante"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Tag">
          {['', ...painel.por_tag.map((t) => t.tag)].map((t) => (
            <button
              key={t || 'todas'}
              type="button"
              aria-pressed={tag === t}
              onClick={() => setTag(t)}
              className={cn(
                'h-7 rounded-full border px-3 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                tag === t ? 'border-foreground bg-foreground text-background' : 'border-input bg-card text-muted-foreground hover:text-foreground'
              )}
            >
              {t || 'Todas as tags'}
            </button>
          ))}
        </div>
      </section>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          {painel.participantes.length === 0 ? 'Ninguém pegou ingresso ainda.' : 'Ninguém com esses filtros.'}
        </p>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 px-4 text-xs font-normal text-muted-foreground">Participante</TableHead>
                <TableHead className="h-10 px-4 text-xs font-normal text-muted-foreground">Tag</TableHead>
                <TableHead className="hidden h-10 px-4 text-xs font-normal text-muted-foreground md:table-cell">Código</TableHead>
                <TableHead className="hidden h-10 px-4 text-xs font-normal text-muted-foreground sm:table-cell">Pegou em</TableHead>
                <TableHead className="h-10 px-4 text-xs font-normal text-muted-foreground">Chegou em</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((p) => {
                const cancelado = p.status === 'cancelado'
                return (
                  <TableRow key={p.ingresso_id} className="border-rule">
                    <TableCell className={cn('px-4 py-2.5 max-w-[220px]', cancelado && 'text-muted-foreground')}>
                      <p className="flex min-w-0 items-center gap-1.5">
                        <span className={cn('truncate font-medium', cancelado && 'line-through font-normal')}>
                          {p.nome ?? 'Sem nome'}
                        </span>
                        {p.colaborador && !cancelado && (
                          <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-full bg-booked-soft px-2 text-[11px] font-medium text-booked">
                            <ShieldCheck className="h-3 w-3" />
                            Colaborador
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <span className="inline-flex h-5 items-center rounded-full bg-muted px-2 text-xs font-medium">{p.tag}</span>
                    </TableCell>
                    <TableCell className="hidden px-4 py-2.5 font-mono text-xs md:table-cell">{p.codigo}</TableCell>
                    <TableCell className="hidden px-4 py-2.5 text-sm sm:table-cell">{quando(p.emitido_em)}</TableCell>
                    <TableCell className="px-4 py-2.5 text-sm">
                      {cancelado ? (
                        <span className="text-xs text-muted-foreground">Cancelado {quando(p.cancelado_em)}</span>
                      ) : p.check_in_em ? (
                        <span className="font-medium text-booked">{quando(p.check_in_em)}</span>
                      ) : (
                        <span className="text-muted-foreground">Não veio</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-2 text-right">
                      {!cancelado && (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className={buttonVariants({ variant: 'ghost', size: 'icon' })}
                            aria-label={`Ações de ${p.nome ?? p.codigo}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={colaborador.isPending}
                              onClick={() => colaborador.mutate({ ingressoId: p.ingresso_id, colaborador: !p.colaborador })}
                            >
                              {p.colaborador ? (
                                <>
                                  <ShieldOff className="h-4 w-4 mr-2" />
                                  Remover colaborador
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="h-4 w-4 mr-2" />
                                  Tornar colaborador
                                </>
                              )}
                            </DropdownMenuItem>
                            {p.check_in_em && (
                              <DropdownMenuItem onClick={() => setDesfazendo(p)}>
                                <Undo2 className="h-4 w-4 mr-2" />
                                Desfazer check-in
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <p className="border-t px-4 py-2 text-xs text-muted-foreground">
            {filtrados.length === painel.participantes.length
              ? `${filtrados.length} ${filtrados.length === 1 ? 'participante' : 'participantes'}`
              : `${filtrados.length} de ${painel.participantes.length} participantes`}
          </p>
        </div>
      )}

      <ConfirmDialog
        open={desfazendo !== null}
        onOpenChange={(open) => !open && setDesfazendo(null)}
        title="Desfazer check-in"
        description={`A entrada de ${desfazendo?.nome ?? desfazendo?.codigo ?? ''} deixa de contar. Use só para corrigir uma leitura feita por engano.`}
        onConfirm={() => desfazendo && desfazer.mutate(desfazendo.ingresso_id, { onSuccess: () => setDesfazendo(null) })}
        loading={desfazer.isPending}
        confirmLabel="Desfazer check-in"
        loadingLabel="Desfazendo..."
      />
    </div>
  )
}
