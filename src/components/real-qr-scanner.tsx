"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Camera, CameraOff, Loader2 } from "lucide-react"

interface RealQrScannerProps {
  onResult: (result: string) => void
  onError?: (error: Error) => void
  width?: number
  height?: number
}

export function RealQrScanner({ onResult, onError, width = 300, height = 300 }: RealQrScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let scanner: Html5Qrcode | null = null

    const initializeScanner = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!containerRef.current) {
          setError("Elemento de contêiner não encontrado")
          setLoading(false)
          return
        }

        // Gerar um ID único para o elemento
        const scannerId = `qr-scanner-${Math.random().toString(36).substring(2, 9)}`

        // Criar elemento para o scanner
        const scannerElement = document.createElement("div")
        scannerElement.id = scannerId
        scannerElement.style.width = "100%"
        scannerElement.style.height = "100%"

        // Limpar o contêiner e adicionar o elemento
        containerRef.current.innerHTML = ""
        containerRef.current.appendChild(scannerElement)

        // Inicializar o scanner
        scanner = new Html5Qrcode(scannerId)
        scannerRef.current = scanner

        console.log("Solicitando acesso à câmera...")

        // Verificar se o navegador suporta a API de câmera
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError("Seu navegador não suporta acesso à câmera")
          setLoading(false)
          return
        }

        // Solicitar permissão da câmera
        try {
          await navigator.mediaDevices.getUserMedia({ video: true })
          setPermissionDenied(false)
        } catch (err) {
          console.error("Erro ao solicitar permissão da câmera:", err)
          setPermissionDenied(true)
          setLoading(false)
          return
        }

        // Iniciar o scanner
        const cameras = await Html5Qrcode.getCameras()
        if (cameras && cameras.length > 0) {
          const cameraId = cameras[0].id

          await scanner.start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              console.log("QR Code detectado:", decodedText)
              onResult(decodedText)
              // Não parar o scanner para permitir múltiplas leituras
            },
            (errorMessage) => {
              // Ignorar erros de decodificação, pois são esperados quando não há QR code visível
              if (errorMessage.includes("QR code parse error")) {
                return
              }

              console.warn("Erro no scanner:", errorMessage)
            },
          )

          setIsScanning(true)
          console.log("Scanner iniciado com sucesso")
        } else {
          setError("Nenhuma câmera encontrada")
        }

        setLoading(false)
      } catch (err) {
        console.error("Erro ao inicializar scanner:", err)
        setError(`Erro ao inicializar scanner: ${err instanceof Error ? err.message : String(err)}`)
        setLoading(false)
        if (onError && err instanceof Error) {
          onError(err)
        }
      }
    }

    initializeScanner()

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((err) => console.error("Erro ao parar scanner:", err))
      }
    }
  }, [onResult, onError])

  const handleRetry = () => {
    setPermissionDenied(false)
    setError(null)

    // Parar o scanner atual se estiver em execução
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current = null
          // Reiniciar o componente
          setIsScanning(false)
          setLoading(true)

          // Pequeno atraso para garantir que tudo seja limpo
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.innerHTML = ""

              // Forçar uma nova renderização
              const event = new Event("retry-scanner")
              window.dispatchEvent(event)
            }
          }, 100)
        })
        .catch((err) => console.error("Erro ao parar scanner para retry:", err))
    }
  }

  return (
    <div className="flex flex-col items-center w-full">
      {loading && (
        <div className="flex flex-col items-center justify-center w-full h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p>Inicializando câmera...</p>
        </div>
      )}

      {permissionDenied && !loading && (
        <div className="flex flex-col items-center justify-center w-full h-[300px]">
          <CameraOff className="h-12 w-12 mb-4 text-destructive" />
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Acesso à câmera negado</AlertTitle>
            <AlertDescription>
              Por favor, permita o acesso à câmera nas configurações do seu navegador para usar o scanner de QR code.
            </AlertDescription>
          </Alert>
          <Button onClick={handleRetry} className="mt-2">
            <Camera className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      )}

      {error && !loading && !permissionDenied && (
        <div className="flex flex-col items-center justify-center w-full h-[300px]">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro no scanner</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleRetry} className="mt-2">
            Tentar novamente
          </Button>
        </div>
      )}

      <div
        ref={containerRef}
        className={`w-full ${!loading && !permissionDenied && !error ? "block" : "hidden"}`}
        style={{ height: `${height}px`, maxWidth: `${width}px`, margin: "0 auto" }}
      />

      {isScanning && !loading && !permissionDenied && !error && (
        <p className="text-sm text-center mt-2">Posicione o QR code no centro da câmera para escanear</p>
      )}
    </div>
  )
}
