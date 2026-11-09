import { z } from 'zod'
import { MAX_TAGS, MAX_TAMANHO_TAG } from '@/lib/business-rules'

// Espelha EventoRequest.java. Limite x capacidade da sala é checado na API (e avisado na UI).
export const eventoSchema = z.object({
  visibilidade: z.enum(['publico', 'privado']),
  descricao: z.string().max(2000, 'Descrição deve ter no máximo 2000 caracteres').trim(),
  limite_ingressos: z
    .number('Informe o limite de ingressos')
    .int('Deve ser um número inteiro')
    .min(1, 'O limite deve ser de pelo menos 1 ingresso'),
  tags: z
    .array(z.string().trim().min(1).max(MAX_TAMANHO_TAG, `Cada tag deve ter no máximo ${MAX_TAMANHO_TAG} caracteres`))
    .min(1, 'Escolha pelo menos uma tag')
    .max(MAX_TAGS, `Use no máximo ${MAX_TAGS} tags`),
})

export type EventoFormValues = z.infer<typeof eventoSchema>

/** Formulário de "Editar evento": mesmo caminho evento.* do formulário de reserva. */
export const editarEventoSchema = z.object({ evento: eventoSchema })
export type EditarEventoFormValues = z.infer<typeof editarEventoSchema>

// Espelha EmitirIngressoRequest.java
export const ingressoSchema = z.object({
  tag: z.string().min(1, 'Escolha uma tag'),
})

export type IngressoFormValues = z.infer<typeof ingressoSchema>
