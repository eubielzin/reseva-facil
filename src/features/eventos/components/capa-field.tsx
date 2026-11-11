'use client'

import { useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { ImagePlus, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { enviarImagem, imagemSrc } from '@/services/eventos'
import type { EventoFormValues } from '@/schemas/evento'

const TIPOS = ['image/jpeg', 'image/png', 'image/webp']
const TAMANHO_MAXIMO = 5 * 1024 * 1024

/**
 * Capa opcional do evento. A imagem sobe assim que é escolhida (com prévia);
 * o formulário guarda só a chave em evento.imagem. A API confere tipo e tamanho de novo.
 */
export function CapaField({ imagemUrl }: { imagemUrl?: string }) {
  const { control, getValues } = useFormContext<{ evento: EventoFormValues }>()
  const entrada = useRef<HTMLInputElement>(null)
  // A prévia começa com a capa salva (se o formulário ainda tem a mesma chave)
  const [previa, setPrevia] = useState<string | null>(() => (getValues('evento.imagem') ? imagemUrl ?? null : null))
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  return (
    <FormField
      control={control}
      name="evento.imagem"
      render={({ field }) => {
        async function escolher(arquivo: File | undefined) {
          if (!arquivo) return
          setErro(null)
          if (!TIPOS.includes(arquivo.type)) return setErro('Use uma imagem JPG, PNG ou WebP.')
          if (arquivo.size > TAMANHO_MAXIMO) return setErro('A imagem deve ter no máximo 5 MB.')
          setEnviando(true)
          try {
            const { chave, url } = await enviarImagem(arquivo)
            field.onChange(chave)
            setPrevia(url)
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'Não foi possível enviar a imagem.'
            setErro(msg)
            toast.error(msg)
          } finally {
            setEnviando(false)
            if (entrada.current) entrada.current.value = ''
          }
        }

        const temCapa = !!field.value && !!previa

        return (
          <FormItem>
            <FormLabel>Imagem de capa (opcional)</FormLabel>
            <input
              ref={entrada}
              type="file"
              accept={TIPOS.join(',')}
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => escolher(e.target.files?.[0])}
            />
            {temCapa ? (
              <div className="space-y-2">
                <div className="relative aspect-[16/9] overflow-hidden rounded-lg border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element -- imagem da API, sem otimização do Next */}
                  <img src={imagemSrc(previa)} alt="Prévia da capa" className="h-full w-full object-cover" />
                  {enviando && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={enviando} onClick={() => entrada.current?.click()}>
                    <RefreshCw className="h-4 w-4" />
                    Trocar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={enviando}
                    onClick={() => {
                      field.onChange(null)
                      setPrevia(null)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remover
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={enviando}
                onClick={() => entrada.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  escolher(e.dataTransfer.files?.[0])
                }}
                className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-muted/30 text-sm text-muted-foreground transition-colors outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60 sm:aspect-[21/9]"
              >
                {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                <span className="font-medium text-foreground">{enviando ? 'Enviando…' : 'Escolher imagem'}</span>
                <span className="text-xs">ou arraste para cá · JPG, PNG ou WebP até 5 MB</span>
              </button>
            )}
            <FormDescription>Aparece na vitrine e na página do evento. Use 1600 × 900 (16:9) para ficar nítida.</FormDescription>
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
