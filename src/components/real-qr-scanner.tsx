"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError("Seu navegador não suporta acesso à câmera.");
          setLoading(false);
          return;
        }

        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (err) {
          setPermissionDenied(true);
          setLoading(false);
          return;
        }

        const element = document.getElementById(SCANNER_ID);
        if (!element) {
          setError("Elemento do scanner não encontrado.");
          setLoading(false);
          return;
        }

        const scanner = new Html5Qrcode(SCANNER_ID);
        scannerRef.current = scanner;

        const cameras = await Html5Qrcode.getCameras();
        if (!cameras.length) {
          setError("Nenhuma câmera encontrada.");
          setLoading(false);
          return;
        }

        const backCamera = cameras.find((cam) =>
          cam.label.toLowerCase().includes("back")
        );

        setTimeout(async () => {
          await scanner.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
                onResult(decodedText);
                scanner.stop().then(() => {
                  setIsScanning(false);
                });
              }
            },
            () => {
              
            }
          );

          setIsScanning(true);
          setLoading(false);
        }, 300);
      } catch (err) {
        console.error("Erro ao iniciar scanner:", err);
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Erro ao iniciar scanner: ${msg}`);
        setLoading(false);
        if (onError && err instanceof Error) onError(err);
      }
    };

    startScanner();

    return () => {
      scannerRef.current?.stop().catch(console.error);
    };
  }, [onResult, onError]);

  const handleRetry = () => {
    setPermissionDenied(false);
    setError(null);
    setLoading(true);
    window.location.reload(); // Reinicia o scanner
  };

  return (
    <div className="flex flex-col items-center w-full">
      {loading && (
        <div className="flex flex-col items-center justify-center h-[300px]">
          <Loader2 className="h-6 w-6 animate-spin mb-2" />
          <p>Inicializando câmera...</p>
        </div>
      )}

      {permissionDenied && (
        <div className="flex flex-col items-center justify-center h-[300px]">
          <CameraOff className="h-10 w-10 mb-4 text-destructive" />
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Acesso negado à câmera</AlertTitle>
            <AlertDescription>
              Habilite o acesso à câmera nas configurações do navegador.
            </AlertDescription>
          </Alert>
          <Button onClick={handleRetry}>
            <Camera className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center h-[300px]">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleRetry}>Tentar novamente</Button>
        </div>
      )}

      <div
        id={SCANNER_ID}
        className={`w-full ${
          !loading && !permissionDenied && !error
            ? "block"
            : "opacity-0 h-0 overflow-hidden"
        }`}
        style={{
          height: `${height}px`,
          maxWidth: `${width}px`,
          margin: "0 auto",
        }}
      />

      {isScanning && !loading && (
        <p className="text-sm text-center mt-2">
          Aponte a câmera para o QR Code
        </p>
      )}
    </div>
  );
}
