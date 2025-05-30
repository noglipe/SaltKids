"use client";

import { Scanner } from "@alzera/react-scanner";
import { useState } from "react";

interface RealQrScannerProps {
  onResult: (result: string) => void | any;
  width?: number;
  height?: number;
}

export function RealQrScanner({
  onResult,
  width = 300,
  height = 300,
}: RealQrScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);

  return (
    <div className="flex flex-col items-center w-full">
      <div
        style={{
          width,
          height,
          overflow: "hidden",
          borderRadius: "1rem",
        }}
      >
        {!scanned && (
          <Scanner
            onScan={(result) => {
              setScanned(true);
              onResult(result);
            }}
            onError={(err) => {
              console.error("Erro ao escanear:", err);
              setError("Erro ao acessar a câmera ou escanear o código.");
            }}
            className="rounded-xl"
            aspectRatio="1" 
                     />
        )}
      </div>

      {error && <p className="text-red-500 mt-2">{error}</p>}
      {scanned && (
        <button
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => setScanned(false)}
        >
          Escanear novamente
        </button>
      )}
    </div>
  );
}
