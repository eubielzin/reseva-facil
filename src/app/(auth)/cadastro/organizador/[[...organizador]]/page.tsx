import { SignUp } from '@clerk/nextjs'
import { CalendarCheck } from 'lucide-react'

// Link aberto para quem vai agendar espaços. Todo pedido de reserva ainda passa pelo admin.
export default function CadastroOrganizadorPage() {
  return (
    <div className="flex flex-col items-center gap-6 px-4 py-10">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <CalendarCheck className="h-4 w-4" />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">Cadastro de organizador</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Para quem vai agendar salas e eventos. Cada pedido de reserva é analisado pela administração
          e você recebe a resposta por email.
        </p>
      </div>
      <SignUp
        path="/cadastro/organizador"
        signInUrl="/entrar"
        forceRedirectUrl="/bem-vindo?papel=organizador"
      />
    </div>
  )
}
