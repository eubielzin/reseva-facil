import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

// Erro dentro do bloco que falhou: uma frase e "Tentar novamente"; a cor negativa só no ícone
export function ErrorState({ message = 'Ocorreu um erro inesperado.', onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border bg-card px-5 py-4">
      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
      <p className="text-sm flex-1 min-w-0">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
