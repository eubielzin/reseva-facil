import { SignIn } from '@clerk/nextjs'

// Login único para todos os papéis; /bem-vindo sincroniza o perfil e manda cada um para a sua área
export default function EntrarPage() {
  return <SignIn path="/entrar" signUpUrl="/cadastro" forceRedirectUrl="/bem-vindo" />
}
