import { SignUp } from '@clerk/nextjs'

// Cadastro de usuário comum (participante). Organizadores usam /cadastro/organizador.
export default function CadastroPage() {
  return <SignUp path="/cadastro" signInUrl="/entrar" forceRedirectUrl="/bem-vindo" />
}
