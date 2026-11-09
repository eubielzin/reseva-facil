'use client'

import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MAX_TAMANHO_TAG, TAGS_SUGERIDAS, alternarTag, normalizarTags } from '@/lib/business-rules'

interface TagsEditorProps {
  value: string[]
  onChange: (tags: string[]) => void
  invalid?: boolean
}

/**
 * Tags que o participante pode escolher ao pegar o ingresso. As sugestões já vêm
 * marcadas; clicar desmarca. Tags criadas aqui entram marcadas e continuam
 * visíveis se desmarcadas, para dar para voltar atrás.
 */
export function TagsEditor({ value, onChange, invalid }: TagsEditorProps) {
  const [nova, setNova] = useState('')
  const [opcoes, setOpcoes] = useState(() => normalizarTags([...TAGS_SUGERIDAS, ...value]))
  const marcada = (tag: string) => value.some((v) => v.toLowerCase() === tag.toLowerCase())

  function adicionar() {
    const tag = nova.trim().replace(/\s+/g, ' ')
    if (!tag) return
    setOpcoes((atual) => normalizarTags([...atual, tag]))
    if (!marcada(tag)) onChange(normalizarTags([...value, tag]))
    setNova('')
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Tags do evento">
        {opcoes.map((tag) => {
          const ativa = marcada(tag)
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={ativa}
              onClick={() => onChange(alternarTag(value, tag))}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                ativa
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-input bg-card text-muted-foreground hover:text-foreground line-through decoration-muted-foreground/60'
              )}
            >
              {ativa && <Check className="h-3.5 w-3.5" />}
              {tag}
            </button>
          )
        })}
      </div>
      <div className="flex gap-2">
        <Input
          value={nova}
          maxLength={MAX_TAMANHO_TAG}
          placeholder="Outra tag (ex.: Professor, Convidado)"
          aria-invalid={invalid}
          onChange={(e) => setNova(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              adicionar()
            }
          }}
        />
        <Button type="button" variant="outline" onClick={adicionar} disabled={!nova.trim()}>
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>
    </div>
  )
}
