import { useEffect, useState } from 'react'

/** Data/hora atual, atualizada a cada minuto (para "em uso agora" e a linha do agora). */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}
