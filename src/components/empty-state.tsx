interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
}

// O bloco mantém sua moldura: caixa tracejada com uma frase e, se houver, a próxima ação
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-dashed border-input bg-card/60 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  )
}
