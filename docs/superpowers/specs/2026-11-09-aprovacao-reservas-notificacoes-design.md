# Etapa 1 — Papéis, aprovação de reservas, notificações e email

Data: 2026-11-09 · Status: aprovado para implementação

## Contexto e roadmap

O ReservaFácil vai ganhar ingressos estilo Sympla. O trabalho foi dividido em três etapas, cada uma com spec própria:

1. **Esta etapa** — papéis (usuario/organizador/admin), reserva de organizador passa por aprovação do admin, notificações no app, envio de email via oxymail, página de perfil.
2. Vitrine de eventos públicos/privados + ingressos com tag (definida pelo organizador; participante escolhe uma) e QR code por email + "Meus ingressos".
3. Check-in por leitura do QR + painel do organizador (horário em que pegou o ingresso, quem veio, horário de chegada).

Decisão de arquitetura: **sem microfrontend**. Áreas separadas por route groups do App Router + proteção por papel; um único app Next.

## Papéis

| Papel | Como obtém | Pode |
|---|---|---|
| `usuario` | cadastro por `/cadastro` (padrão; ausência de role = usuario) | ver perfil/notificações (na etapa 2: vitrine e ingressos) |
| `organizador` | cadastro por `/cadastro/organizador` (aberto) | pedir reservas, ver/editar/cancelar só as próprias |
| `admin` | cadastra-se como organizador e é promovido manualmente no painel do Clerk | tudo |

O papel vale pelo claim `metadata.role` do JWT. A tabela `usuarios` é um espelho atualizado em `POST /me`; uma promoção feita no Clerk só reflete na tabela no próximo login da pessoa (aceito).

Session token do Clerk passa a expor também `"email": "{{user.primary_email_address}}"` e `"nome": "{{user.full_name}}"`.

## Status da reserva

```
pendente ──aprovar──▶ aprovada ──pedir cancelamento──▶ cancelamento_solicitado
   │                                                    │            │
   ├─recusar / recusa automática──▶ recusada            aprovar     recusar
   └─organizador cancela──▶ cancelada ◀─────────────────┘            └──▶ aprovada
admin pode cancelar direto qualquer pendente/aprovada/cancelamento_solicitado
```

- Reserva criada por **organizador** nasce `pendente`; por **admin**, `aprovada`.
- Reservas já existentes migram como `aprovada`.
- **Bloqueiam horário:** `aprovada` e `cancelamento_solicitado`. Pendentes **não** bloqueiam.
- Criar/editar pedido que conflita com reserva bloqueante → 409. Conflito com pendente não impede.
- Aprovar re-checa conflito com bloqueantes (409 se houver) e **recusa automaticamente** os pendentes conflitantes, com motivo "Outro pedido foi aprovado para este horário".
- Conflito continua não-estrito (reservas que se encostam conflitam).
- Ordem dos pedidos = `created_at`. Pedidos pendentes que se sobrepõem (mesma sala/data) formam um grupo de disputa; a API devolve `ordem_pedido` e `concorrentes`.
- Organizador edita e cancela só reservas próprias `pendente`; em `aprovada` só pode solicitar cancelamento.
- Transição inválida → 409 (`TransicaoStatusInvalidaException`). Papel errado → 403.
- `GET /reservas/ocupacao` devolve só bloqueantes.
- Visibilidade mantida: organizador vê só as próprias; admin vê todas; usuario não cria reservas.

Regras puras em `BusinessRules.java`, espelhadas em `src/lib/business-rules.ts`.

## Modelo de dados (Flyway)

- `V5__create_usuarios.sql` — `usuarios(id text pk /*sub*/, nome, email, papel check(usuario|organizador|admin), created_at, updated_at)`
- `V6__add_status_reservas.sql` — `reservas + status not null default 'aprovada' check(...)`, `motivo_recusa`, `decidido_por`, `decidido_em`, `cancelamento_solicitado_em`
- `V7__create_emails.sql` — `emails(id uuid, destinatario, assunto, html, status check(pendente|enviado|falhou), tentativas int, ultimo_erro, created_at, enviado_em)`
- `V8__create_notificacoes.sql` — `notificacoes(id uuid, usuario_id fk usuarios, tipo, titulo, mensagem, reserva_id fk null, email_id fk null, lida_em null, created_at)`; uma linha por destinatário (cada admin tem a sua cópia).

## API

| Endpoint | Quem | Ação |
|---|---|---|
| `POST /me` | logado | upsert em `usuarios`; aceita `{papel_desejado:"organizador"}` só se a pessoa ainda não tem papel → grava no `public_metadata` via Clerk Backend API (`CLERK_SECRET_KEY`) |
| `GET /me` | logado | perfil |
| `POST /reservas` | organizador, admin | cria (`pendente`/`aprovada`) |
| `PUT /reservas/{id}` | admin; organizador dono se `pendente` | edita |
| `POST /reservas/{id}/cancelar` | dono, admin | cancela ou solicita cancelamento |
| `POST /reservas/{id}/aprovar` | admin | aprova + recusa concorrentes |
| `POST /reservas/{id}/recusar` | admin | `{motivo?}` |
| `POST /reservas/{id}/cancelamento/aprovar` · `/recusar` | admin | decide cancelamento |
| `DELETE /reservas/{id}` | admin | apaga |
| `GET /reservas?status=` | visibilidade | filtro por status; pendentes com `ordem_pedido`, `concorrentes` |
| `GET /notificacoes` · `GET /notificacoes/nao-lidas/contagem` | logado | próprias |
| `POST /notificacoes/{id}/lida` · `POST /notificacoes/lidas` | logado | marcar lidas |
| `GET /emails?status=falhou` · `POST /emails/{id}/reenviar` | admin | emails com falha |

## Notificações e email

| Acontecimento | Destinatário | Email |
|---|---|---|
| novo pedido | admins | sim |
| aprovado / recusado / recusa automática | organizador | sim |
| organizador cancela pendente | — | não |
| cancelamento solicitado | admins | sim |
| cancelamento aprovado / recusado | organizador | sim |
| email falhou | admins (notificação com reenviar) | não |

Fluxo: o use case, na mesma transação, muda status, grava notificações e grava emails como `pendente`, e publica `EmailsCriados`. Um `EmailSender` `@Async @TransactionalEventListener` envia via `EmailClient` (Feign, `POST /oxymail/email/enviar {email, assunto, mensagem}`), marca `enviado` ou `falhou` (+ notificação `email_falhou` aos admins). Mesmo padrão do projeto Achados & Perdidos. Emails usam `EmailLayout` copiado de lá, com escape de HTML e botão "Ver no ReservaFácil" para `APP_URL`.

Config nova da API: `EMAIL_SERVICE_URL` (padrão `https://gateway.ceuma.br`), `EMAIL_BANNER_URL`, `APP_URL`, `CLERK_SECRET_KEY`. Dependências: `spring-cloud-starter-openfeign`, `@EnableAsync`, `@EnableFeignClients`.

Notificações no front: polling da contagem a cada 30 s (`refetchInterval`) + refetch no foco. Sem WebSocket.

## Telas

- `/cadastro`, `/cadastro/organizador` (Clerk SignUp) → `/bem-vindo[?papel=organizador]` chama `POST /me`, renova token, redireciona.
- `/entrar`: login único.
- Navbar: sininho (contagem + últimas 5 + "ver todas") e avatar → `/perfil`.
- `/perfil`: dados, notificações (filtro não lidas, marcar todas), e para admin "Emails com falha" com Reenviar.
- Organizador em `/reservas`: só as próprias, coluna status (motivo se recusada), ações por status, botão "Enviar pedido", pendentes tracejadas na agenda. `/salas` só consulta.
- Admin `/pedidos`: aba Pedidos (agrupados por disputa, selos 1º/2º pedido com data-hora, aprovar com confirmação dos que serão recusados, recusar com motivo) e aba Cancelamentos. Dashboard ganha card "Pedidos pendentes".
- Usuario comum: redirecionado para `/perfil` com aviso "Em breve: eventos e ingressos".
- Proteção de rotas no `proxy` do Next 16 + Clerk (ler `node_modules/next/dist/docs/` antes). A API é a barreira real (403).

## Testes

- JUnit `BusinessRulesTest`: transições, status bloqueantes, agrupamento/ordem de disputa, permissões por papel.
- Vitest `business-rules.test.ts`: espelho.
- Use cases com repositório mockado: aprovação recusa concorrentes; aprovação com bloqueante → 409.
- `EmailSender` com `EmailClient` mockado: sucesso → `enviado`; falha → `falhou` + notificação.

## Fora do escopo desta etapa

Ingressos, tags, QR code, vitrine, check-in (etapas 2 e 3); tela de gestão de usuários; webhook do Clerk; WebSocket; expiração de pedidos.
