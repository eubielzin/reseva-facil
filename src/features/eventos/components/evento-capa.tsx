import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { imagemSrc } from '@/services/eventos'

// Sem capa: degradê fixo por evento (mesmo id → mesma cor), com o título por cima
const FUNDOS = [
  'from-booked to-foreground',
  'from-chart-2 to-booked',
  'from-chart-4 to-foreground',
  'from-positive to-booked',
] as const

function fundoDo(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return FUNDOS[h % FUNDOS.length]
}

interface EventoCapaProps {
  id: string
  titulo: string
  data: string
  imagemUrl?: string
  /** "card": título pequeno no degradê; "destaque": página do evento */
  tamanho?: 'card' | 'destaque'
  className?: string
  children?: React.ReactNode
}

/** Capa 16:9 do evento: a imagem enviada pelo organizador ou um degradê com o título. */
export function EventoCapa({ id, titulo, data, imagemUrl, tamanho = 'card', className, children }: EventoCapaProps) {
  const d = new Date(data + 'T12:00:00')
  return (
    <div className={cn('relative aspect-[16/9] overflow-hidden bg-muted', className)}>
      {imagemUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagem da API (ou do MinIO), sem otimização do Next
        <img
          src={imagemSrc(imagemUrl)}
          alt={`Capa do evento ${titulo}`}
          loading={tamanho === 'card' ? 'lazy' : 'eager'}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div
          aria-hidden
          className={cn(
            'flex h-full w-full flex-col justify-end bg-gradient-to-br text-white',
            fundoDo(id),
            tamanho === 'card' ? 'p-4' : 'p-6 sm:p-8'
          )}
        >
          <span className="text-xs font-medium uppercase tracking-wider opacity-80">
            {format(d, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </span>
          <span
            className={cn(
              'mt-1 line-clamp-2 font-semibold tracking-tight',
              tamanho === 'card' ? 'text-lg leading-snug' : 'text-2xl leading-tight sm:text-3xl'
            )}
          >
            {titulo}
          </span>
        </div>
      )}
      {children}
    </div>
  )
}
