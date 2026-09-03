'use client'

import { useState, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import {
  Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2, Download,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createReservation } from '@/services/reservations'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'
import type { Room } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParsedRow {
  index: number
  sala_nome: string
  sala_id: string | null
  data: string
  horario_inicio: string
  horario_fim: string
  titulo: string
  participante_responsavel: string
  quantidade_participantes: number
  erros: string[]
  status: 'pendente' | 'importando' | 'ok' | 'erro'
  mensagem?: string
}

interface ImportReservationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rooms: Room[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

const COL_MAP: Record<string, string> = {
  sala: 'sala_nome',
  data: 'data',
  inicio: 'horario_inicio',
  horarioinicio: 'horario_inicio',
  fim: 'horario_fim',
  horariofim: 'horario_fim',
  titulo: 'titulo',
  evento: 'titulo',
  nomedoevento: 'titulo',
  responsavel: 'participante_responsavel',
  nomeresponsavel: 'participante_responsavel',
  participantes: 'quantidade_participantes',
  nparticipantes: 'quantidade_participantes',
}

function cellDate(val: unknown): string | null {
  if (val instanceof Date && !isNaN(val.getTime())) return format(val, 'yyyy-MM-dd')
  if (typeof val === 'string') {
    const s = val.trim()
    const dm = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (dm) return `${dm[3]}-${dm[2].padStart(2, '0')}-${dm[1].padStart(2, '0')}`
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  }
  return null
}

function cellTime(val: unknown): string | null {
  if (val instanceof Date && !isNaN(val.getTime())) {
    return `${String(val.getHours()).padStart(2, '0')}:${String(val.getMinutes()).padStart(2, '0')}`
  }
  if (typeof val === 'number' && val < 1) {
    const mins = Math.round(val * 24 * 60)
    return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
  }
  if (typeof val === 'string') {
    const m = val.trim().match(/^(\d{1,2}):(\d{2})/)
    if (m) return `${m[1].padStart(2, '0')}:${m[2]}`
  }
  return null
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Sala', 'Data', 'Início', 'Fim', 'Título', 'Responsável'],
    ['Alfa', '01/08/2026', '09:00', '10:00', 'Reunião de planejamento', 'Maria Silva'],
    ['Beta', '02/08/2026', '14:00', '15:30', 'Treinamento', 'João Costa'],
  ])
  ws['!cols'] = [14, 12, 8, 8, 28, 22].map((wch) => ({ wch }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Reservas')
  XLSX.writeFile(wb, 'modelo-reservas.xlsx')
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ImportReservationsDialog({
  open,
  onOpenChange,
  rooms,
}: ImportReservationsDialogProps) {
  const qc = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)

  const roomByName = useCallback(
    (name: string) => rooms.find((r) => normalize(r.nome) === normalize(name)) ?? null,
    [rooms]
  )

  function reset() {
    setStep('upload')
    setRows([])
    setFileName('')
    setImporting(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function parseFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array', cellDates: true })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: '',
      }) as unknown[][]

      if (raw.length < 2) {
        toast.error('A planilha está vazia ou sem dados.')
        return
      }

      const headers = (raw[0] as unknown[]).map((h) => normalize(String(h)))
      const colIndex: Record<string, number> = {}
      headers.forEach((h, i) => {
        const mapped = COL_MAP[h]
        if (mapped) colIndex[mapped] = i
      })

      const required = ['sala_nome', 'data', 'horario_inicio', 'horario_fim', 'titulo', 'participante_responsavel']
      const missing = required.filter((k) => !(k in colIndex))
      if (missing.length > 0) {
        const labels: Record<string, string> = {
          sala_nome: 'Sala', data: 'Data', horario_inicio: 'Início',
          horario_fim: 'Fim', titulo: 'Título', participante_responsavel: 'Responsável',
        }
        toast.error(`Colunas não encontradas: ${missing.map((k) => labels[k] ?? k).join(', ')}`)
        return
      }

      const get = (row: unknown[], key: string) =>
        colIndex[key] !== undefined ? row[colIndex[key]] : undefined

      const parsed: ParsedRow[] = (raw.slice(1) as unknown[][])
        .filter((row) => row.some((cell) => cell !== '' && cell !== undefined && cell !== null))
        .map((row, i) => {
          const sala_nome = String(get(row, 'sala_nome') ?? '').trim()
          const sala = roomByName(sala_nome)
          const data = cellDate(get(row, 'data'))
          const horario_inicio = cellTime(get(row, 'horario_inicio'))
          const horario_fim = cellTime(get(row, 'horario_fim'))
          const titulo = String(get(row, 'titulo') ?? '').trim()
          const participante_responsavel = String(get(row, 'participante_responsavel') ?? '').trim()
          const qtdRaw = get(row, 'quantidade_participantes')
          const quantidade_participantes = qtdRaw ? Number(qtdRaw) || 1 : 1

          const erros: string[] = []
          if (!sala_nome) erros.push('Sala não informada')
          else if (!sala) erros.push(`Sala "${sala_nome}" não encontrada`)
          if (!data) erros.push('Data inválida')
          if (!horario_inicio) erros.push('Horário de início inválido')
          if (!horario_fim) erros.push('Horário de fim inválido')
          if (!titulo) erros.push('Título não informado')
          if (!participante_responsavel) erros.push('Responsável não informado')
          if (horario_inicio && horario_fim && horario_fim <= horario_inicio)
            erros.push('Fim deve ser posterior ao início')

          return {
            index: i + 2,
            sala_nome,
            sala_id: sala?.id ?? null,
            data: data ?? '',
            horario_inicio: horario_inicio ?? '',
            horario_fim: horario_fim ?? '',
            titulo,
            participante_responsavel,
            quantidade_participantes,
            erros,
            status: 'pendente',
          }
        })

      setRows(parsed)
      setFileName(file.name)
      setStep('preview')
    }
    reader.readAsArrayBuffer(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  async function handleImport() {
    const valid = rows.filter((r) => r.erros.length === 0)
    if (valid.length === 0) return

    setImporting(true)
    const updated = [...rows]
    let ok = 0
    let fail = 0

    for (const row of valid) {
      const idx = updated.findIndex((r) => r.index === row.index)
      updated[idx] = { ...updated[idx], status: 'importando' }
      setRows([...updated])

      try {
        await createReservation({
          sala_id: row.sala_id!,
          data: row.data,
          horario_inicio: row.horario_inicio,
          horario_fim: row.horario_fim,
          titulo: row.titulo,
          participante_responsavel: row.participante_responsavel,
          quantidade_participantes: row.quantidade_participantes,
        })
        updated[idx] = { ...updated[idx], status: 'ok' }
        ok++
      } catch (err) {
        updated[idx] = {
          ...updated[idx],
          status: 'erro',
          mensagem: err instanceof Error ? err.message : 'Erro ao importar',
        }
        fail++
      }

      setRows([...updated])
    }

    await qc.invalidateQueries({ queryKey: queryKeys.reservations.all() })
    setImporting(false)
    setStep('done')

    if (ok > 0) toast.success(`${ok} reserva${ok !== 1 ? 's' : ''} importada${ok !== 1 ? 's' : ''} com sucesso!`)
    if (fail > 0) toast.error(`${fail} reserva${fail !== 1 ? 's' : ''} com erro.`)
  }

  const validCount = rows.filter((r) => r.erros.length === 0).length
  const invalidCount = rows.filter((r) => r.erros.length > 0).length
  const doneOk = rows.filter((r) => r.status === 'ok').length
  const doneErr = rows.filter((r) => r.status === 'erro').length

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o) }}>
      <DialogContent className="max-w-2xl" showCloseButton>
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' && 'Importar reservas de planilha'}
            {step === 'preview' && `Prévia — ${fileName}`}
            {step === 'done' && 'Importação concluída'}
          </DialogTitle>
        </DialogHeader>

        {/* ---- UPLOAD ---- */}
        {step === 'upload' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione um arquivo <strong>.xlsx</strong> com as colunas:
            </p>
            <p className="font-mono text-xs bg-muted rounded px-3 py-2 text-muted-foreground">
              Sala &nbsp;·&nbsp; Data &nbsp;·&nbsp; Início &nbsp;·&nbsp; Fim &nbsp;·&nbsp; Título &nbsp;·&nbsp; Responsável
            </p>
            <div
              className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">Clique para selecionar o arquivo</p>
              <p className="text-xs text-muted-foreground">.xlsx — Excel</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* ---- PREVIEW ---- */}
        {step === 'preview' && (
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-emerald-600 font-medium">✓ {validCount} válida{validCount !== 1 ? 's' : ''}</span>
              {invalidCount > 0 && (
                <span className="text-destructive font-medium">✗ {invalidCount} com erro</span>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto rounded-md border text-xs">
              <table className="w-full">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    {['#', 'Sala', 'Data', 'Horário', 'Título', 'Status'].map((h) => (
                      <th key={h} className="px-2 py-1.5 text-left font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.index} className={cn('border-t', row.erros.length > 0 && 'bg-destructive/5')}>
                      <td className="px-2 py-1.5 text-muted-foreground">{row.index}</td>
                      <td className="px-2 py-1.5 font-medium">{row.sala_nome || '—'}</td>
                      <td className="px-2 py-1.5">{row.data || '—'}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        {row.horario_inicio && row.horario_fim
                          ? `${row.horario_inicio}–${row.horario_fim}`
                          : '—'}
                      </td>
                      <td className="px-2 py-1.5 max-w-36 truncate">{row.titulo || '—'}</td>
                      <td className="px-2 py-1.5">
                        {row.erros.length > 0 ? (
                          <span className="text-destructive" title={row.erros.join('; ')}>
                            ✗ {row.erros[0]}
                          </span>
                        ) : (
                          <span className="text-emerald-600">✓ ok</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---- DONE ---- */}
        {step === 'done' && (
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm">
              {doneOk > 0 && (
                <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  {doneOk} importada{doneOk !== 1 ? 's' : ''} com sucesso
                </span>
              )}
              {doneErr > 0 && (
                <span className="text-destructive font-medium flex items-center gap-1.5">
                  <XCircle className="h-4 w-4" />
                  {doneErr} com erro
                </span>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto rounded-md border text-xs">
              <table className="w-full">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    {['#', 'Título', 'Sala', 'Status'].map((h) => (
                      <th key={h} className="px-2 py-1.5 text-left font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.filter((r) => r.erros.length === 0).map((row) => (
                    <tr key={row.index} className="border-t">
                      <td className="px-2 py-1.5 text-muted-foreground">{row.index}</td>
                      <td className="px-2 py-1.5 font-medium max-w-40 truncate">{row.titulo}</td>
                      <td className="px-2 py-1.5">{row.sala_nome}</td>
                      <td className="px-2 py-1.5">
                        {row.status === 'ok' && (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> OK
                          </span>
                        )}
                        {row.status === 'importando' && (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        )}
                        {row.status === 'erro' && (
                          <span className="text-destructive" title={row.mensagem}>
                            ✗ {row.mensagem}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <div className="flex w-full items-center justify-between">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Baixar modelo
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
            </div>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={reset} disabled={importing}>
                Escolher outro arquivo
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0 || importing}>
                {importing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importando…</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" />Importar {validCount} reserva{validCount !== 1 ? 's' : ''}</>
                )}
              </Button>
            </>
          )}
          {step === 'done' && (
            <>
              <Button variant="outline" onClick={reset}>
                Importar outro arquivo
              </Button>
              <Button onClick={() => { reset(); onOpenChange(false) }}>
                Fechar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
