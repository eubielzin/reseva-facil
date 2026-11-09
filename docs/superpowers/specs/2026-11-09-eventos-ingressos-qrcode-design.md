# Etapa 2 — Vitrine de eventos e ingressos com QR code

Data: 2026-11-09 · Status: aprovado para implementação · Depende da etapa 1 (`2026-11-09-aprovacao-reservas-notificacoes-design.md`)

## Decisões

- Uma reserva vira evento **no próprio pedido** (seção "Evento com ingressos" no formulário). O admin vê o evento ao aprovar; só entra na vitrine depois de aprovado. Descrição, tags, visibilidade e limite continuam editáveis depois.
- Evento **público** aparece na vitrine; **privado** só por link secreto (`/eventos/convite/{codigo}`), que o organizador pode regenerar.
- Pegar ingresso exige login. **Um ingresso ativo por pessoa por evento.** Disponível até o horário de início ou até esgotar.
- O organizador define as tags (sugestão pré-marcada: Organização, Staff, Aluno; pode desmarcar e adicionar). O participante escolhe **uma**.
- O QR contém `CODIGO · Nome · Tag` em texto legível; só o código vale (conferido pela API). A tag também aparece escrita no email e em "Meus ingressos".
- O participante pode **cancelar até o início**; para trocar de tag, cancela e pega de novo (QR novo).
- Reserva do evento cancelada → todos os ingressos ativos são cancelados e avisados. Admin muda data/horário → participantes avisados.
- Todos os papéis podem participar de eventos (menu "Eventos" e "Meus ingressos"). Participante (`usuario`) passa a entrar em `/eventos`.

## Modelo de dados

- `V9__create_eventos.sql` — `eventos(id uuid pk, reserva_id uuid unique fk reservas on delete cascade, visibilidade check(publico|privado), descricao text, limite_ingressos int check >= 1, tags text[] not null, codigo_convite varchar(16) unique null, created_at, updated_at)`
- `V10__create_ingressos.sql` — `ingressos(id uuid pk, evento_id fk eventos on delete cascade, usuario_id fk usuarios, codigo varchar(16) unique, tag varchar(40), status check(ativo|cancelado), emitido_em timestamptz, cancelado_em null, check_in_em null, created_at)` + índice único parcial `(evento_id, usuario_id) where status = 'ativo'`.

O ingresso guarda uma cópia do texto da tag. Limite padrão = quantidade de participantes; máximo = capacidade da sala; mínimo = ingressos ativos já emitidos. Código: `RF-XXXX-XXXX`, 8 caracteres de `SecureRandom` num alfabeto sem 0/O/1/I. Emissão trava a linha do evento (`PESSIMISTIC_WRITE`) para não vender a mesma última vaga duas vezes.

## Regras (BusinessRules.java + espelho TS)

- Pode emitir: reserva `aprovada`, agora < início, ingressos ativos < limite, tag ∈ tags do evento, pessoa sem ingresso ativo.
- Pode cancelar ingresso: dono, status `ativo`, agora < início.
- Vitrine: `publico`, reserva `aprovada`, ainda não começou; ordem por data/horário.
- Tags: 1 a 10, cada uma com 1 a 40 caracteres, sem repetição (ignorando maiúsculas/espaços).

## API

| Endpoint | Quem | Ação |
|---|---|---|
| `POST/PUT /reservas` com `evento?` | organizador, admin | cria/edita reserva com evento |
| `PUT /reservas/{id}/evento` | dono, admin | edita evento (inclusive após aprovação) |
| `POST /reservas/{id}/evento/convite` | dono, admin | novo código de convite (privado) |
| `GET /eventos` | logado | vitrine |
| `GET /eventos/{id}` | logado | detalhe de evento público aprovado (senão 404) |
| `GET /eventos/convite/{codigo}` | logado | detalhe de evento privado |
| `POST /eventos/{id}/ingressos` | logado | `{tag, codigo_convite?}` emite ingresso |
| `GET /ingressos/meus` | logado | ingressos da pessoa |
| `POST /ingressos/{id}/cancelar` | dono | cancela antes do início |
| `GET /ingressos/{codigo}/qr.png` | **público** | PNG do QR; cancelado → 404 |

`ReservaResponse.evento` traz `ingressos_emitidos`; `codigo_convite` só para dono/admin. Erros: 409 esgotado / já tem ingresso / já começou / reserva não aprovada; 422 tag inválida / limite inválido; 404 evento ou convite inexistente.

A imagem do QR é pública porque clientes de email a baixam sem login; a proteção é o código aleatório. QR gerado com ZXing (`com.google.zxing:core`). Config nova: `API_PUBLIC_URL` (endereço público da API, usado no `<img>` do email).

## Avisos (email + notificação)

| Acontecimento | Destinatário |
|---|---|
| ingresso emitido (email com QR) | participante |
| ingresso cancelado pelo participante | participante |
| reserva do evento cancelada → ingressos cancelados | participantes com ingresso ativo |
| data/horário alterados pelo admin | participantes com ingresso ativo |

## Telas

- `/eventos`: vitrine em cartões (data, título, sala, horário, descrição; "N vagas" / "Últimas vagas" (<10%) / "Esgotado" / "Você vai").
- `/eventos/[id]`, `/eventos/convite/[codigo]`: detalhe; escolher tag (RHF + Zod) → QR na hora + aviso do email; se já tem ingresso, mostra o ingresso.
- `/ingressos`: abas Próximos / Anteriores e cancelados; cartão com QR, código, tag, evento, "Pego em…", cancelar com confirmação.
- Formulário de reserva: seção "Evento com ingressos" (visibilidade, descrição, limite, editor de tags pré-marcadas).
- `/reservas` (organizador): selo "Evento · 34/80 ingressos"; ações Editar evento, Copiar link do convite, Gerar novo link.
- `/pedidos` (admin): resumo do evento no pedido.
- Navbar: "Eventos" e "Meus ingressos" para todos; perfil perde o aviso "Em breve".

## Testes

JUnit (regras, código, vitrine, limites), Vitest (espelho + editor de tags), casos de uso com mocks (emissão, duplicado, esgotado, convite, cancelamento em cascata), QR lido de volta pelo ZXing, migrations em Postgres descartável.

## Fora do escopo

Check-in e painel de presença (etapa 3; `check_in_em` já existe), lista de convidados, troca de tag sem cancelar, lista de espera, ingresso pago, exportar planilha.
