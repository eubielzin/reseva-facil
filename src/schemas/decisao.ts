import { z } from 'zod'

// Espelha DecisaoRequest.java: motivo opcional da recusa, até 500 caracteres
export const recusaSchema = z.object({
  motivo: z.string().max(500, 'Motivo deve ter no máximo 500 caracteres'),
})

export type RecusaFormValues = z.infer<typeof recusaSchema>
