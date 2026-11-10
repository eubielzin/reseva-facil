import { SignIn } from '@clerk/nextjs'
import {
  CabecalhoOrganizador,
  DESTINO_ORGANIZADOR,
  SeJaLogadoViraOrganizador,
} from '@/features/cadastro/components/organizador'

// Login pelo link de organizador: conta de usuário que já existia passa a ser organizador
export default function EntrarOrganizadorPage() {
  return (
    <div className="flex flex-col items-center gap-6 px-4 py-10">
      <SeJaLogadoViraOrganizador />
      <CabecalhoOrganizador descricao="Entre com a conta que você já tem. Ela passa a poder pedir reservas de salas e eventos." />
      <SignIn
        path="/cadastro/organizador/entrar"
        signUpUrl="/cadastro/organizador"
        forceRedirectUrl={DESTINO_ORGANIZADOR}
      />
    </div>
  )
}
