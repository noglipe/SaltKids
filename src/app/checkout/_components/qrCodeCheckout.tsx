"use client";

import { RealQrScanner } from "@/components/real-qr-scanner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase/client";
import { Check, QrCode } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function QrCodeCheckout() {
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  const handleQrCodeResult = async (result: string) => {
    try {
      if (!result || typeof result !== "string") {
        setScanError("QR Code inválido. Por favor, tente novamente.");
        return;
      }

      // Extrai o ID do check-in da URL (assumindo o formato /info/checkin/<id>)
      const partes = result.split("/");
      const checkinId = partes[partes.length - 1];



      // Buscar o check-in pelo ID
      const { data: checkin, error: fetchError } = await supabase
        .from("checkins")
        .select(
          `
                id,
                status,
                checkout_horario,
                criancas (nome),
                turmas (nome)
              `
        )
        .eq("id", checkinId)
        .maybeSingle<CheckinComRelacionamentos>();

      if (fetchError || !checkin) {
        toast.error("Check-in não encontrado");
        throw new Error("Check-in não encontrado");
      }

      if (checkin.checkout_horario) {
        toast.warning("Check-out já realizado", {
          description: "Esta criança já foi retirada anteriormente.",
        });
        return;
      }

      // Realizar o check-out (atualizando o horário e o status)
      const { error: updateError } = await supabase
        .from("checkins")
        .update({
          checkout_horario: new Date().toISOString(),
          status: "finalizado",
        })
        .eq("id", checkinId);

      if (updateError) {
        throw updateError;
      }

      toast.success("Check-out realizado com sucesso", {
        description: `Criança: ${
          (checkin.criancas as { nome: string })?.nome ?? "Desconhecida"
        }\nTurma: ${(checkin.turmas as { nome: string })?.nome ?? ""}`,
      });

      setQrDialogOpen(false);
    } catch (error) {
      console.error("Erro ao processar QR code:", error);
      setScanError("Erro ao realizar o check-out. Por favor, tente novamente.");
    } finally {
      setSuccessDialogOpen(true);
    }
  };

  return (
    <>
      <TabsContent value="qrcode" className="space-y-6">
        <div className="text-center p-6 border rounded-lg">
          <QrCode className="h-16 w-16 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-medium mb-2">Escanear QR Code</h3>
          <p className="text-slate-500 mb-4">
            Escaneie o QR Code da criança para realizar o check-out rapidamente.
          </p>
          <Button onClick={() => setQrDialogOpen(true)}>
            Abrir Scanner
            <QrCode className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </TabsContent>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escanear QR Code</DialogTitle>
            <DialogDescription>
              Posicione o QR Code no centro da câmera para escanear.
            </DialogDescription>
          </DialogHeader>
          <div className="h-[300px]">
            <RealQrScanner onResult={handleQrCodeResult} />
          </div>
          {scanError && (
            <div className="text-red-500 text-sm mt-2">{scanError}</div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-green-600">
              <Check className="mr-2 h-5 w-5" />
              Check-out Realizado com Sucesso
            </DialogTitle>
            <DialogDescription>
              O check-out foi registrado no sistema.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
