import React, { useRef, useEffect } from "react";
import Webcam from "react-webcam";
import jsQR from "jsqr";

interface QrScannerProps {
  onResult: (code: string) => void;
}

export default function QrScanner({ onResult }: QrScannerProps) {
  const webcamRef = useRef<Webcam>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const video = webcamRef.current?.video;

      if (video instanceof HTMLVideoElement) {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code?.data) {
          onResult(code.data);
          clearInterval(interval);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [onResult]);

  return (
    <Webcam
      ref={webcamRef}
      audio={false}
      screenshotFormat="image/jpeg"
      videoConstraints={{ facingMode: { ideal: "environment" } }}
      className="rounded-b-4xl w-full h-3/4"
    />
  );
}
