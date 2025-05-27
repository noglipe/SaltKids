"use client";

import { supabase } from "@/lib/supabase/client";
import { Printer } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";

type Props = {
  crianca: any;
  turmaId: string;
  responsavel?: {
    nome: string;
    id: string;
    telefone: string;
  };
};

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function Etiqueta({ crianca, turmaId, responsavel }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = () => window.print();
  const [turma, setTurma] = useState<any>(null);
  const [dataChekin, setDataChekin] = useState("");

  useEffect(() => {
    async function carregarTurma() {
      const { data, error } = await supabase
        .from("turmas")
        .select("id, nome, faixa_etaria")
        .order("nome")
        .eq("id", turmaId)
        .single();

      if (error) {
        throw new Error(`Erro ao buscar dados de Turma: ${error.message}`);
      }

      setTurma(data);

      const dataFormatada =
        new Date(crianca.horario_entrada).toLocaleDateString("pt-BR") +
        " às " +
        new Date(crianca.horario_entrada).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });

      setDataChekin(dataFormatada);
    }

    carregarTurma();
  }, [turmaId]);

  const Print = () => {
    const printWindow = window.open("", "_blank");
    const printContents = printRef.current?.innerHTML;
    if (!printWindow) {
      alert("Por favor, permita pop-ups para imprimir a etiqueta.");
      return;
    }

    printWindow.document.write(`
  <html>
    <head>
      <title>Etiqueta de Check-in</title>
      <style>
        @page {
          size: 90mm 29mm;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
        }
        .print-container {
          width: 90mm;
          height: 29mm;
          padding: 2mm;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          page-break-after: always; /* 🔁 ESTA LINHA GARANTE UMA ETIQUETA POR PÁGINA */
        }
        .qr-code {
          width: 25mm;
          height: 25mm;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .info {
          margin-left: 3mm;
          width: calc(100% - 28mm);
          overflow: hidden;
        }
        .nome {
          font-weight: bold;
          font-size: 12pt;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .turma {
          font-size: 9pt;
          margin-bottom: 1mm;
        }
        .horario {
          font-size: 8pt;
        }
        .responsavel {
          font-size: 8pt;
          margin-top: 1mm;
        }
        .id {
          font-size: 7pt;
          margin-top: 1mm;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        <div class="qr-code">
          ${printContents}
        </div>
        <div class="info">
          <div class="nome">${crianca?.nome || "Nome da Criança"}</div>
          <div class="turma">${turma?.nome || "Turma"}</div>
          <div class="horario">Check-in: ${dataChekin}</div>
          <div class="responsavel">Responsável: ${responsavel?.nome}</div>
          <div class="id">ID: ${crianca?.id || "000000"}</div>
        </div>
      </div>
      <div class="print-container">
        <div class="qr-code">
          ${printContents}
        </div>
        <div class="info">
          <div class="nome">${responsavel?.nome || "Nome do Responsável"}</div>
          <div class="turma">${turma?.nome || "Turma"}</div>
          <div class="horario">Check-in: ${dataChekin}</div>
          <div class="responsavel">Criança: ${crianca?.nome}</div>
          <div class="id">ID: ${crianca?.id || "000000"}</div>
        </div>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 500);
          }, 500);
        };
      </script>
    </body>
  </html>
`);
  };

  return (
    <div>
      <div ref={printRef} className="hidden">
        <div className="qr">
          <QRCodeSVG value={crianca.checkin_id} size={96} />
        </div>
      </div>

      {/* Botão visível só na tela */}
      <div className="mb-4 print:hidden">
        <Button size="sm" variant="outline" onClick={Print}>
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
      </div>

      {/* Área da etiqueta */}

      <style jsx global>{`
        @media print {
          @page {
            size: 90mm 29mm;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          .etiqueta {
            visibility: visible;
            position: absolute;
            top: 0;
            left: 0;
          }
        }
      `}</style>
    </div>
  );
}
