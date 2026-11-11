import { describe, it, expect } from 'vitest'
import { extrairCodigoIngresso, aberturaCheckin, corDoResultado, eventoTerminou } from '../business-rules'
import { gerarCsv } from '../csv'

// Espelha CheckinRulesTest.java da reseva-api.

describe('extrairCodigoIngresso', () => {
  it('aceita o texto do QR, minúsculas, espaços e só os 8 caracteres', () => {
    expect(extrairCodigoIngresso('RF-8K2M-Q7PX · Ana Souza · Staff')).toBe('RF-8K2M-Q7PX')
    expect(extrairCodigoIngresso('rf-8k2m-q7px')).toBe('RF-8K2M-Q7PX')
    expect(extrairCodigoIngresso(' rf 8k2m q7px ')).toBe('RF-8K2M-Q7PX')
    expect(extrairCodigoIngresso('8K2MQ7PX')).toBe('RF-8K2M-Q7PX')
  })

  it('recusa o que não é código de ingresso', () => {
    expect(extrairCodigoIngresso('https://exemplo.com')).toBeNull()
    expect(extrairCodigoIngresso('')).toBeNull()
  })
})

describe('aberturaCheckin', () => {
  it('abre os minutos definidos antes do início', () => {
    expect(aberturaCheckin('2026-11-12', '14:00', 60)).toBe('2026-11-12T13:00')
    expect(aberturaCheckin('2026-11-12', '00:30', 60)).toBe('2026-11-11T23:30')
    expect(aberturaCheckin('2026-11-12', '14:00', 0)).toBe('2026-11-12T14:00')
  })
})

describe('corDoResultado', () => {
  it('verde só para ok; amarelo para já entrou e antes da abertura; vermelho para o resto', () => {
    expect(corDoResultado('ok')).toBe('verde')
    expect(corDoResultado('ja_entrou')).toBe('amarelo')
    expect(corDoResultado('antes_da_abertura')).toBe('amarelo')
    expect(corDoResultado('cancelado')).toBe('vermelho')
    expect(corDoResultado('outro_evento')).toBe('vermelho')
    expect(corDoResultado('nao_encontrado')).toBe('vermelho')
    expect(corDoResultado('encerrado')).toBe('vermelho')
  })
})

describe('gerarCsv', () => {
  it('separa por ponto e vírgula, escapa aspas e começa com BOM para o Excel ler acentos', () => {
    const csv = gerarCsv(['Nome', 'Tag'], [
      ['Ana "Aninha" Souza', 'Organização'],
      ['Bruno; Lima', 'Aluno'],
      ['Carla\nCosta', ''],
    ])
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv.slice(1).split('\r\n')).toEqual([
      'Nome;Tag',
      '"Ana ""Aninha"" Souza";Organização',
      '"Bruno; Lima";Aluno',
      '"Carla\nCosta";',
    ])
  })
})

describe('eventoTerminou', () => {
  it('o leitor do colaborador continua até o fim do evento, não só até o início', () => {
    expect(eventoTerminou('2026-11-12', '18:00', '2026-11-12T14:30')).toBe(false)
    expect(eventoTerminou('2026-11-12', '18:00:00', '2026-11-12T17:59')).toBe(false)
    expect(eventoTerminou('2026-11-12', '18:00', '2026-11-12T18:00')).toBe(true)
    expect(eventoTerminou('2026-11-12', '18:00', '2026-11-13T08:00')).toBe(true)
  })
})
