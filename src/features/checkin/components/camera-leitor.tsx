'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { extrairCodigoIngresso } from '@/lib/business-rules'

// Com o QR parado na frente, a câmera lê o mesmo código várias vezes por segundo
const IGNORAR_REPETIDA_MS = 3000

type Estado = 'parada' | 'iniciando' | 'lendo' | 'negada' | 'indisponivel'

/**
 * Câmera traseira lendo QR continuamente (@zxing/browser, carregado só no navegador).
 * A mesma leitura em menos de 3 s é ignorada.
 * Só liga depois do clique em "Ativar câmera" — o navegador pede a permissão nessa hora.
 * Exige HTTPS (ou localhost).
 */
export function CameraLeitor({ onLer }: { onLer: (texto: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onLerRef = useRef(onLer)
  const ultimaRef = useRef<{ codigo: string; em: number } | null>(null)
  const [estado, setEstado] = useState<Estado>('parada')

  useEffect(() => {
    onLerRef.current = onLer
  }, [onLer])

  useEffect(() => {
    if (estado !== 'iniciando' || !videoRef.current) return
    let parar: (() => void) | undefined
    let cancelado = false

    ;(async () => {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser')
        const leitor = new BrowserQRCodeReader()
        const controles = await leitor.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } }, audio: false },
          videoRef.current ?? undefined,
          (resultado) => {
            if (!resultado) return
            const texto = resultado.getText()
            const codigo = extrairCodigoIngresso(texto) ?? texto
            const agora = Date.now()
            const ultima = ultimaRef.current
            if (ultima && ultima.codigo === codigo && agora - ultima.em < IGNORAR_REPETIDA_MS) return
            ultimaRef.current = { codigo, em: agora }
            onLerRef.current(texto)
          }
        )
        if (cancelado) {
          controles.stop()
          return
        }
        parar = () => controles.stop()
        setEstado('lendo')
      } catch (e) {
        if (cancelado) return
        const nome = e instanceof Error ? e.name : ''
        setEstado(nome === 'NotAllowedError' || nome === 'SecurityError' ? 'negada' : 'indisponivel')
      }
    })()

    return () => {
      cancelado = true
      parar?.()
    }
  }, [estado])

  const ligada = estado === 'iniciando' || estado === 'lendo'

  return (
    <div className="space-y-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black sm:aspect-video">
        <video ref={videoRef} muted playsInline className={ligada ? 'h-full w-full object-cover' : 'hidden'} />
        {ligada && (
          // Moldura para centralizar o QR
          <div aria-hidden className="pointer-events-none absolute inset-[18%] rounded-2xl border-2 border-white/80" />
        )}
        {!ligada && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
            {estado === 'negada' || estado === 'indisponivel' ? (
              <>
                <CameraOff className="h-8 w-8 opacity-80" />
                <p className="text-sm opacity-90">
                  {estado === 'negada'
                    ? 'A câmera foi bloqueada. Libere o acesso nas configurações do navegador ou digite o código abaixo.'
                    : 'Não foi possível abrir a câmera neste aparelho. Digite o código abaixo. (A câmera só funciona em HTTPS.)'}
                </p>
                <Button variant="secondary" onClick={() => setEstado('iniciando')}>
                  Tentar de novo
                </Button>
              </>
            ) : (
              <Button size="lg" variant="secondary" onClick={() => setEstado('iniciando')}>
                <Camera className="h-4 w-4" />
                Ativar câmera
              </Button>
            )}
          </div>
        )}
      </div>
      {ligada && (
        <button
          type="button"
          onClick={() => setEstado('parada')}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Desligar câmera
        </button>
      )}
    </div>
  )
}
