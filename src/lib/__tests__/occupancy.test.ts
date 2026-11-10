import { describe, expect, it } from 'vitest'
import { dayBlocks, dayWindow, nowPosition, roomPhoto } from '../occupancy'

const r = (sala_id: string, horario_inicio: string, horario_fim: string) => ({
  sala_id,
  data: '2026-11-10',
  horario_inicio,
  horario_fim,
})

describe('linha do tempo do card de sala', () => {
  const janela = dayWindow({ disponivel_madrugada: false })

  it('usa 08h–22h, ou o dia todo quando a sala aceita madrugada', () => {
    expect(janela).toEqual({ de: '08:00', ate: '22:00' })
    expect(dayWindow({ disponivel_madrugada: true })).toEqual({ de: '00:00', ate: '24:00' })
  })

  it('converte reservas da sala em faixas percentuais', () => {
    const blocos = dayBlocks('a', [r('a', '08:00:00', '15:00:00'), r('b', '09:00', '10:00')], janela)
    expect(blocos).toHaveLength(1)
    expect(blocos[0]).toMatchObject({ inicio: '08:00', fim: '15:00', left: 0, width: 50 })
  })

  it('recorta reservas que passam da janela e ignora as que ficam fora', () => {
    const blocos = dayBlocks('a', [r('a', '06:00', '09:24'), r('a', '05:00', '07:00')], janela)
    expect(blocos).toHaveLength(1)
    expect(blocos[0].left).toBe(0)
    expect(blocos[0].width).toBeCloseTo(10)
  })

  it('posiciona o agora e devolve null fora da janela', () => {
    expect(nowPosition('15:00', janela)).toBe(50)
    expect(nowPosition('07:59', janela)).toBeNull()
    expect(nowPosition('22:01', janela)).toBeNull()
  })
})

describe('foto da sala', () => {
  it('usa a foto enviada quando existe', () => {
    expect(roomPhoto({ id: 'x', foto_url: 'https://minio/salas/x.jpg' })).toBe('https://minio/salas/x.jpg')
  })

  it('sem foto, escolhe sempre o mesmo exemplo para a mesma sala', () => {
    const a = roomPhoto({ id: '3f2b0c1e-0000-4000-8000-000000000001' })
    expect(a).toMatch(/^\/mock\/salas\/sala-[1-6]\.jpg$/)
    expect(roomPhoto({ id: '3f2b0c1e-0000-4000-8000-000000000001' })).toBe(a)
  })

  it('pela posição na lista, as seis primeiras salas não repetem foto', () => {
    const fotos = Array.from({ length: 6 }, (_, i) => roomPhoto({ id: `s${i}` }, i))
    expect(new Set(fotos).size).toBe(6)
    expect(roomPhoto({ id: 's6' }, 6)).toBe(fotos[0])
  })
})
