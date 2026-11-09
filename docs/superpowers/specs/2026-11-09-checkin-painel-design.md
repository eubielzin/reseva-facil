# Etapa 3 — Check-in pelo QR code e painel do organizador

Data: 2026-11-09 · Status: aprovado para implementação · Depende das etapas 1 e 2

## Decisões

- **Quem lê os QR:** dono do evento, admin e equipe de apoio com o **link de check-in** (`/checkin/{codigo_checkin}`), secreto e regenerável. O link só dá acesso ao leitor daquele evento; funciona para qualquer papel logado.
- **Leitura:** câmera no navegador (`@zxing/browser`) + campo para digitar o código (serve também para leitor USB/Bluetooth). Câmera exige HTTPS (ou localhost).
- **Janela:** abre `checkin_minutos_antes` antes do início (definido pelo organizador, **padrão 60**, de 0 a 1440) e fecha no fim do evento.
- **Check-in feito não se faz de novo:** segunda leitura (câmera, digitada, outra pessoa, simultânea) não registra nada nem altera o horário; mostra "Já entrou às HH:mm". Garantido no banco com `UPDATE … WHERE check_in_em IS NULL`.
- **Desfazer check-in** existe só para dono/admin, pelo painel, para corrigir engano.
- Check-in **não** gera email nem notificação.
- **Painel** com totais (geral e por tag), lista de participantes (pegou em, chegou em, situação), filtros, atualização a cada 10 s durante a janela e **exportação CSV** (gerada no navegador, respeitando filtros).

## Dados — `V11__add_checkin.sql`

- `eventos.checkin_minutos_antes int not null default 60 check (0..1440)`
- `eventos.codigo_checkin varchar(16) unique` — preenchido para eventos existentes na migration; todo evento novo ganha um.
- `ingressos.check_in_por varchar(64) null` — id de quem leu.

## Regras (BusinessRules.java + espelho TS)

Resultado da leitura, nesta ordem: `nao_encontrado` → `outro_evento` → `cancelado` → `ja_entrou` → `antes_da_abertura` → `encerrado` → `ok`.

Extração do código: aceita o texto inteiro do QR (`RF-8K2M-Q7PX · Ana · Staff`), o código com/sem traços e em minúsculas; normaliza para `RF-XXXX-XXXX`.

Permissão para ler/ver o cabeçalho do leitor: admin, dono do evento, ou `codigo_checkin` informado igual ao do evento. Sem permissão → 404.

## API

| Endpoint | Quem | Ação |
|---|---|---|
| `GET /eventos/checkin/{codigoCheckin}` | logado com o link | título, data, horário, janela, presentes/total |
| `POST /eventos/{id}/checkin` | dono, admin, link | `{codigo, codigo_checkin?}` → `{resultado, mensagem, participante?}` — 200 para todo resultado |
| `GET /reservas/{id}/evento/participantes` | dono, admin | lista + totais geral e por tag |
| `POST /ingressos/{id}/checkin/desfazer` | dono, admin | limpa `check_in_em`/`check_in_por` |
| `POST /reservas/{id}/evento/link-checkin` | dono, admin | novo `codigo_checkin` |

`EventoRequest`/`EventoResumo` ganham `checkin_minutos_antes`; o resumo ganha `codigo_checkin` (só dono/admin recebem reservas).

## Telas

- `/reservas/[id]/evento` (dono/admin): totais com barra e por tag; lista (nome+email, tag, código, pegou em, chegou em / "Não veio", situação; cancelados riscados); filtros (tag, presença, busca); exportar CSV; abrir leitor; copiar/gerar link de check-in; desfazer check-in por linha. Ação "Painel do evento" na lista de reservas.
- `/checkin/[codigo]`: leitor para celular — cabeçalho com evento e presentes/total, botão "Ativar câmera", vídeo, campo de código; cartão grande verde (nome + tag) / amarelo / vermelho por ~3 s com vibração; ignora a mesma leitura em menos de 3 s; sem permissão de câmera fica só o campo.
- Formulário do evento: "Check-in abre ___ minutos antes" (padrão 60).

## Testes

JUnit: janela, ordem dos resultados, extração do código, permissão, segunda leitura sem efeito, desfazer. Vitest: espelho, extração, CSV (aspas, acentos, vírgulas). Integração em Postgres descartável: duas leituras simultâneas → uma entrada.

## Fora do escopo

Lista de presença em PDF, check-in offline, saída (check-out), notificações de check-in.
