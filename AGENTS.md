<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# ReservaFácil — Regras para geração de código

Guia de consistência para qualquer agente ou contribuidor que gere código neste projeto. Leia antes de escrever qualquer linha.

---

## Stack e versões

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router) | 16.x |
| Runtime | React | 19.x |
| Linguagem | TypeScript | 5.x |
| Back-end | API Java (`reseva-api`) — Spring Boot | 4.x / Java 21 |
| Banco | Supabase (PostgreSQL), acessado só pela API Java | — |
| Autenticação | Clerk (`@clerk/nextjs`) | 7.x |
| Validação | Zod | **v4** |
| Formulários | React Hook Form + @hookform/resolvers | 7.x / 5.x |
| Estado servidor | TanStack Query | **v5** |
| UI Components | Shadcn/UI sobre **@base-ui/react** | 1.x |
| Estilização | Tailwind CSS | **v4** |
| Calendário | react-day-picker | **v10** |
| Datas | date-fns | v4 (locale `ptBR`) |
| Notificações | Sonner | 2.x |
| Ícones | Lucide React | 1.x |

---

## Estrutura de arquivos

```
src/
├── app/
│   ├── salas/         # Páginas (Client Components com 'use client')
│   └── reservas/
├── components/ui/     # Componentes Shadcn/UI — NÃO editar os existentes diretamente; novos podem ser adicionados
├── features/          # Componentes de domínio (rooms/, reservations/, dashboard/)
├── hooks/             # TanStack Query hooks (use-rooms.ts, use-reservations.ts)
├── services/          # Funções fetch para a API Java (sempre via apiFetch)
├── schemas/           # Schemas Zod dos formulários (espelham as validações da API Java)
├── types/             # Interfaces TypeScript globais
└── lib/               # Utilitários (api-client.ts, utils.ts, query-client.ts, business-rules.ts)
```

Ao criar um novo domínio, siga esse mesmo padrão: `features/<dominio>/components/`, `hooks/use-<dominio>.ts`, `services/<dominio>.ts`, `schemas/<dominio>.ts` — e o endpoint correspondente na API Java.

---

## Back-end — API Java (`reseva-api`)

O back-end é um projeto separado em Spring Boot (`../reseva-api`). **Não existem Route Handlers neste projeto** — não crie `src/app/api/`.

- Toda validação e regra de negócio fica na API Java, nunca só no cliente. A validação Zod do front é apenas UX.
- Endpoints: `GET/POST /salas`, `GET/PUT/DELETE /salas/{id}`, `GET/POST /reservas` (`?sala_id=`), `GET /reservas/ocupacao?data=yyyy-MM-dd` (`&sala_id=`), `GET/PUT/DELETE /reservas/{id}`, `GET /dashboard` (admin).
- JSON em **snake_case** (`sala_id`, `horario_inicio`, ...). Campos nulos são omitidos da resposta.
- Erros: `{ error: string, details?: Record<string, string[]> }` com 401, 403, 404, 409 (regra de negócio) e 422 (validação).
- Ao adicionar um campo: migration Flyway nova (`V<n>__descricao.sql`), entidade, `*Request`/`*Response` e o type/schema aqui no front.

### Chamando a API
- Services usam `apiFetch(path, init)` de `@/lib/api-client` — nunca `fetch` direto. Ele monta a URL com `NEXT_PUBLIC_API_URL` (padrão `http://localhost:8080`) e envia `Authorization: Bearer <JWT do Clerk>`.
- O token vem do `getToken()` do `useAuth()`, registrado pelo `ApiAuthBridge` em `src/components/providers.tsx`. Services só funcionam no browser.
- Papel de admin: a API lê o claim `metadata.role` do JWT (session token do Clerk deve expor `"metadata": "{{user.public_metadata}}"`). Criar/editar/excluir sala e editar/excluir reserva exigem `admin`; criar reserva exige só login.

---

## Next.js App Router

- Páginas são Client Components (`'use client'`) pois usam estado e hooks.
- Nunca use `getServerSideProps`, `getStaticProps` ou `pages/` — este projeto usa App Router.
- Para Server Components, não use hooks de estado nem `useEffect`.

---

## @base-ui/react — Armadilhas conhecidas

A lib de UI deste projeto é `@base-ui/react`, **não Radix UI**. As APIs diferem:

### `asChild` não existe
Nunca escreva `<SelectTrigger asChild>` ou `<DropdownMenuTrigger asChild>`. Para aplicar estilos de botão a um trigger, use `buttonVariants` como `className`:

```tsx
// ERRADO
<DropdownMenuTrigger asChild><Button /></DropdownMenuTrigger>

// CERTO
<DropdownMenuTrigger className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
  <MoreHorizontal className="h-4 w-4" />
</DropdownMenuTrigger>
```

### `SelectValue` exibe o `value` bruto, não o texto do item
`<SelectValue />` renderiza o valor interno (ex.: UUID), não o label do `<SelectItem>`. Para exibir o texto correto no trigger, faça lookup manual:

```tsx
// ERRADO — mostra UUID no trigger
<SelectTrigger>
  <SelectValue placeholder="Selecione uma sala" />
</SelectTrigger>

// CERTO — lookup manual pelo id
const selectedRoom = rooms.find((r) => r.id === field.value)
<SelectTrigger>
  <span className={cn(!selectedRoom && 'text-muted-foreground')}>
    {selectedRoom ? selectedRoom.nome : 'Selecione uma sala'}
  </span>
</SelectTrigger>
```

### `value=""` em Select causa warning de controlado/não-controlado
Base UI trata `value=""` como não controlado. Use um sentinel não-vazio quando o estado puder ser "nenhum":

```tsx
const ALL = '*'
const salaValue = selectedSalaId || ALL   // nunca passa ""

<Select value={salaValue} onValueChange={(v) => onChange(v === ALL ? '' : (v ?? ''))}>
  <SelectItem value={ALL}>Todas as salas</SelectItem>
  ...
</Select>
```

### `onValueChange` pode retornar `null`
Sempre use `v ?? 'fallback'` ao processar o retorno de `onValueChange`:

```tsx
onValueChange={(v) => onSortChange((v ?? 'asc') as SortOrder)}
```

### Checkbox com react-hook-form
Use o componente `Checkbox` de `@/components/ui/checkbox` (wrapper de `@base-ui/react/checkbox`). O `onCheckedChange` recebe `boolean` diretamente — sem evento — então integra limpo com `field.onChange`:

```tsx
<FormField
  control={form.control}
  name="disponivel_madrugada"
  render={({ field }) => (
    <FormItem className="flex items-center gap-3 py-1">
      <FormControl>
        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
      </FormControl>
      <FormLabel className="font-normal cursor-pointer">Descrição</FormLabel>
    </FormItem>
  )}
/>
```

---

## Zod v4

Esta versão tem breaking changes em relação ao Zod v3:

- **Removidos**: `required_error` e `invalid_type_error` nos construtores de schema. Use `.min(1, 'mensagem')` ou `.refine()`.
- **`.uuid()` está deprecated**: use regex explícita:

```ts
// ERRADO (Zod v3)
z.string().uuid('Sala inválida')

// CERTO (Zod v4)
z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  'Sala inválida'
)
```

- Números de formulário: use `z.number()` diretamente (não `z.coerce.number()`). Converta no `onChange` do input:

```tsx
onChange={(e) => field.onChange(e.target.valueAsNumber)}
```

---

## TanStack Query v5

- `useMutation` retorna `.error` (tipo `Error | null`) — use `.error?.message` para exibir erros do servidor.
- Invalide queries com `queryClient.invalidateQueries({ queryKey: [...] })`.
- Query keys ficam centralizadas em `src/lib/query-client.ts`.
- `useQuery` não tem mais `status === 'loading'` — use `isLoading`.

---

## Banco de dados

- O front **não acessa o Supabase**. Todo acesso ao banco passa pela API Java (JPA + Flyway).
- O schema é versionado pelas migrations Flyway em `reseva-api/src/main/resources/db/migration/`. `supabase/schema.sql` é apenas referência.

---

## Regras de negócio (não alterar sem discussão)

Implementadas na API Java: `BusinessRules.java` (funções puras) e `ReservaValidator.java` (ordem de aplicação). `src/lib/business-rules.ts` é um espelho para uso na UI — ao mudar uma regra, mude nos dois lados.

### Conflito de horário
Usa desigualdade **não-estrita**: reservas que se encostam (ex.: 14:00–15:00 e 15:00–16:00) **são conflito**. Implementado em `ReservaRepository.findConflicts` com `horarioInicio <= :horarioFim AND horarioFim >= :horarioInicio`.

### Horário de funcionamento
Por padrão, reservas só podem começar a partir das **08:00** (`HORA_ABERTURA`). A validação de madrugada é feita **no servidor** (API Java), condicionalmente ao campo `sala.disponivel_madrugada`. O schema Zod de reserva **não** possui refine de hora mínima — a regra é por sala. O banco usa tipo `time`, que não suporta cruzar meia-noite — fim máximo recomendado: 23:59.

### Disponibilidade por sala
Cada sala possui dois campos booleanos configuráveis pelo admin:

- **`disponivel_madrugada`** (`boolean`, default `false`): se `false`, qualquer reserva com `horario_inicio < '08:00'` é rejeitada com HTTP 409. Se `true`, a sala aceita reservas a partir das 00:00. O `TimeSlotPicker` recebe prop `availableFrom='00:00'` quando a sala selecionada tem esse campo ativo.
- **`disponivel_fim_de_semana`** (`boolean`, default `false`): se `false`, reservas cujo campo `data` cai em sábado ou domingo são rejeitadas com HTTP 409. O calendário do formulário desabilita visualmente esses dias via `disabled={{ dayOfWeek: [0, 6] }}` do react-day-picker. Ao trocar de sala, um `useEffect` em `reservation-form.tsx` limpa o campo `data` automaticamente se a data selecionada for fim de semana e a nova sala não permitir. Dia da semana calculado como `new Date(data + 'T12:00:00').getDay()` (T12 evita problemas de timezone UTC).

Ambas as regras são validadas no servidor **após** a validação de capacidade e **antes** da detecção de conflito.

### Visibilidade das reservas
Cada reserva guarda quem a criou (`criado_por` = claim `sub` do JWT do Clerk, gravado pela API no `POST`). Usuário comum só vê as próprias reservas em `GET /reservas` e `GET /reservas/{id}` (reserva de outro responde 404); admin vê todas. Reservas antigas, sem dono, só aparecem para o admin. Regra pura em `BusinessRules.podeVerReserva`.

Para escolher horário livre (formulário, coluna "Agora" em Salas) use `GET /reservas/ocupacao` (hook `useOcupacao`): devolve os horários ocupados de **todos** os usuários, só com sala, data, início e fim — nunca use a lista de reservas para isso, porque o usuário comum não recebe as dos outros.

### Capacidade
`quantidade_participantes > sala.capacidade` retorna HTTP 409. É bloqueio rígido, não aviso.

### Edição sem conflito consigo mesma
Ao editar, `UpdateReservaUseCase` passa `excludeId` para `findConflicts()` para excluir a própria reserva da verificação.

---

## react-day-picker v10

- Para seleção de data única: `mode="single"`, `selected={date}`, `onSelect={setDate}`.
- Para intervalo de datas: `mode="range"`, `selected={dateRange}`, `onSelect={setDateRange}`, `numberOfMonths={2}`.
- Tipo de intervalo: `import { type DateRange } from 'react-day-picker'`.
- Sempre passe `locale={ptBR}` para formatação em português.

---

## Calendário no formulário (data única)

Use `Popover` + `Calendar` do Shadcn. O `PopoverTrigger` NÃO usa `asChild` — aplique `buttonVariants` como className:

```tsx
<PopoverTrigger className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-start ...')}>
  <CalendarIcon className="mr-2 h-4 w-4" />
  {field.value ? format(new Date(field.value + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione uma data'}
</PopoverTrigger>
```

Armazene datas como string `'yyyy-MM-dd'` nos formulários e envie assim para a API. Horários como `'HH:mm'`. Nunca envie objetos `Date`.

---

## TypeScript

- Sem `any`. Se precisar de um tipo desconhecido, use `unknown` e faça narrowing.
- Interfaces globais ficam em `src/types/index.ts`.
- Tipos de schema Zod são exportados junto ao schema: `export type ReservationFormValues = z.infer<typeof reservationSchema>`.
- Antes de commitar, verifique: `npx tsc --noEmit` deve retornar 0 erros.

---

## Testes

- **Front**: **Vitest 2.x** (compatível com Node 18+). Rode com `npm test`. Testes em `src/lib/__tests__/business-rules.test.ts`.
- **API Java**: JUnit 5. Rode com `./mvnw test` dentro de `reseva-api`. Testes em `src/test/java/.../rules/BusinessRulesTest.java`.

Ao adicionar ou alterar uma regra de negócio:

1. Implemente a lógica pura em `BusinessRules.java` e aplique em `ReservaValidator.java`.
2. Espelhe em `src/lib/business-rules.ts` se a UI precisar dela.
3. Adicione casos de teste nos dois lados.

Nunca teste lógica que depende do banco em testes unitários — mock ou integração separada.

---

## Commits

- Mensagens **em português**.
- Formato: `tipo: descrição curta no imperativo`.
- Tipos comuns: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`.
- **Não incluir** a linha `Co-Authored-By:` nos commits.
- Um commit por contexto de alteração — não misture features com correções.

Exemplos:
```
feat: adiciona filtro de período com range calendar na listagem de reservas
fix: corrige ordenação que não era aplicada ao trocar a direção
docs: atualiza readme com stack e decisões de produto
```

---

## Estilo e convenções de componentes

- Componentes `'use client'` quando usam `useState`, `useEffect`, hooks de query ou event handlers.
- Formulários: sempre React Hook Form + Zod + `zodResolver`. Nunca estado manual para campos de formulário.
- Erros do servidor: exiba com `Alert variant="destructive"` inline no formulário **e** `toast.error()` do Sonner simultaneamente.
- Ícones: sempre de `lucide-react`. Tamanho padrão: `h-4 w-4`.
- Classes CSS: sempre via `cn()` de `@/lib/utils` para mesclar Tailwind condicionalmente.
- Tailwind v4: use variáveis CSS (`bg-background`, `text-foreground`, `border-input`, etc.) em vez de valores hardcoded.
