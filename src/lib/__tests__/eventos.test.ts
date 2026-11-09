import { describe, it, expect } from 'vitest'
import {
  TAGS_SUGERIDAS,
  vagasRestantes,
  situacaoVagas,
  normalizarTags,
  erroTags,
  alternarTag,
} from '../business-rules'

// Espelha EventoRulesTest.java da reseva-api.

describe('vagasRestantes', () => {
  it('nunca fica negativo', () => {
    expect(vagasRestantes(80, 10)).toBe(70)
    expect(vagasRestantes(80, 80)).toBe(0)
    expect(vagasRestantes(50, 60)).toBe(0)
  })
})

describe('situacaoVagas', () => {
  it('esgotado, últimas vagas (menos de 10%) ou disponível', () => {
    expect(situacaoVagas(0, 80)).toBe('esgotado')
    expect(situacaoVagas(7, 80)).toBe('ultimas')
    expect(situacaoVagas(8, 80)).toBe('disponivel')
    expect(situacaoVagas(1, 5)).toBe('ultimas')
  })
})

describe('normalizarTags', () => {
  it('tira espaços, vazias e repetidas ignorando maiúsculas', () => {
    expect(normalizarTags([' Staff ', 'Aluno', 'staff', '  ', 'Pós  graduação'])).toEqual([
      'Staff',
      'Aluno',
      'Pós graduação',
    ])
  })
})

describe('erroTags', () => {
  it('exige de 1 a 10 tags de até 40 caracteres', () => {
    expect(erroTags(['Staff'])).toBeNull()
    expect(erroTags([])).not.toBeNull()
    expect(erroTags(['a'.repeat(41)])).not.toBeNull()
    expect(erroTags(Array.from({ length: 11 }, (_, i) => `t${i}`))).not.toBeNull()
  })
})

describe('alternarTag', () => {
  it('sugestões já vêm marcadas; clicar desmarca e clicar de novo marca', () => {
    expect(TAGS_SUGERIDAS).toEqual(['Organização', 'Staff', 'Aluno'])
    const semStaff = alternarTag([...TAGS_SUGERIDAS], 'staff')
    expect(semStaff).toEqual(['Organização', 'Aluno'])
    expect(alternarTag(semStaff, 'Staff')).toEqual(['Organização', 'Aluno', 'Staff'])
  })
})
