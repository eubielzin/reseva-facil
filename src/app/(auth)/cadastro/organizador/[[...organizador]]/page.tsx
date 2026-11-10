import { SignUp } from '@clerk/nextjs'
import {
  CabecalhoOrganizador,
  DESTINO_ORGANIZADOR,
  SeJaLogadoViraOrganizador,
} from '@/features/cadastro/components/organizador'

// Link aberto para quem vai agendar espaços. Todo pedido de reserva ainda passa pelo admin.
// Quem já tem conta usa o "Entrar" daqui (/cadastro/organizador/entrar) e também vira organizador.
export default function CadastroOrganizadorPage() {
  return (
    <div className="flex flex-col items-center gap-6 px-4 py-10">
      <SeJaLogadoViraOrganizador />
      <CabecalhoOrganizador descricao="Para quem vai agendar salas e eventos. Cada pedido de reserva é analisado pela administração e você recebe a resposta por email. Já tem conta? Entre por aqui que ela vira de organizador." />
      <SignUp
        path="/cadastro/organizador"
        signInUrl="/cadastro/organizador/entrar"
        forceRedirectUrl={DESTINO_ORGANIZADOR}
      />
    </div>
  )
}
