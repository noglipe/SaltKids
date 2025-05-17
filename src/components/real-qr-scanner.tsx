"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Camera, CameraOff, Loader2 } from "lucide-react";

interface RealQrScannerProps {
  onResult: (result: string) => void;
  onError?: (error: Error) => void;
  width?: number;
  height?: number;
}

const SCANNER_ID = "qr-scanner";

export function RealQrScanner({
  onResult,
  onError,
  width = 300,
  height = 300,
}: RealQrScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const initializeScanner = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!document.getElementById(SCANNER_ID)) {
          setError("Elemento de scanner não encontrado no DOM");
          setLoading(false);
          return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError("Seu navegador não suporta acesso à câmera");
          setLoading(false);
          return;
        }

        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
          setPermissionDenied(false);
        } catch (err) {
          console.error("Erro ao solicitar permissão da câmera:", err);
          setPermissionDenied(true);
          setLoading(false);
          return;
        }

        const scanner = new Html5Qrcode(SCANNER_ID);
        scannerRef.current = scanner;

        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          const cameraId = cameras[0].id;

          await scanner.start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              console.log("QR Code detectado:", decodedText);
              onResult(decodedText);
            },
            (errorMessage) => {
              if (!errorMessage.includes("QR code parse error")) {
                console.warn("Erro no scanner:", errorMessage);
              }
            }
          );

          setIsScanning(true);
          console.log("Scanner iniciado com sucesso");
        } else {
          setError("Nenhuma câmera encontrada");
        }

        setLoading(false);
      } catch (err) {
        console.error("Erro ao inicializar scanner:", err);
        setError(
          `Erro ao inicializar scanner: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        setLoading(false);
        if (onError && err instanceof Error) {
          onError(err);
        }
      }
    };

    initializeScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current
          .stop()
          .then(() => console.log("Scanner parado"))
          .catch((err) => console.error("Erro ao parar scanner:", err));
      }
    };
  }, [onResult, onError]);

  const handleRetry = () => {
    setPermissionDenied(false);
    setError(null);
    setLoading(true);

    setTimeout(() => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current
          .stop()
          .then(() => (scannerRef.current = null))
          .catch(console.error);
      }

      // Força nova renderização/execução do useEffect
      window.location.reload();
    }, 300);
  };

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
              Por favor, permita o acesso à câmera nas configurações do
              navegador.
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
        id={SCANNER_ID}
        className={`w-full ${
          !loading && !permissionDenied && !error ? "block" : "hidden"
        }`}
        style={{
          height: `${height}px`,
          maxWidth: `${width}px`,
          margin: "0 auto",
        }}
      />

      {isScanning && !loading && !permissionDenied && !error && (
        <p className="text-sm text-center mt-2">
          Posicione o QR code no centro da câmera
        </p>
      )}
    </div>
  );
}
