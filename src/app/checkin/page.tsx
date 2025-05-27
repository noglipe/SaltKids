"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Printer, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import MainLayout from "@/components/main-layout";
import { Skeleton } from "@/components/ui/skeleton";
import type { Crianca, Responsavel, Turma } from "../../types/database";
import { supabase } from "@/lib/supabase/client";
import { createCheckin } from "../actions/chekins";
import { toast } from "sonner";

interface CriancaResponsavel extends Responsavel {
  parentesco: string;
}

type RawResponsavel = {
  parentesco: string;
  responsaveis: Responsavel | any;
};

export default function CheckinPage() {
  const router = useRouter();
  const [showQRCode, setShowQRCode] = useState(false);
  const [turmaValue, setTurmaValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para os dados
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [responsaveisDisponiveis, setResponsaveisDisponiveis] = useState<
    CriancaResponsavel[]
  >([]);

  // Estados para os campos de busca
  const [openCrianca, setOpenCrianca] = useState(false);
  const [openResponsavel, setOpenResponsavel] = useState(false);
  const [criancaValue, setCriancaValue] = useState("");
  const [responsavelValue, setResponsavelValue] = useState("");
  const [searchCrianca, setSearchCrianca] = useState("");
  const [searchResponsavel, setSearchResponsavel] = useState("");
  const [criancaSelecionada, setCriancaSelecionada] = useState<Crianca | null>(
    null
  );
  const [responsavelSelecionado, setResponsavelSelecionado] =
    useState<CriancaResponsavel | null>(null);
  const [turmaSelecionada, setTurmaSelecionada] = useState<Turma | null>(null);
  const [horarioCheckin, setHorarioCheckin] = useState("");
  const [qrCodeValue, setQrCodeValue] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const etiquetaRef = useRef<HTMLDivElement>(null);

  // Obtém a URL base para o link de acesso
  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  // Carrega os dados iniciais
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Busca as crianças
        const { data: criancasData, error: criancasError } = await supabase
          .from("criancas")
          .select("*")
          .order("nome");

        if (criancasError) throw criancasError;

        // Busca as turmas
        const { data: turmasData, error: turmasError } = await supabase
          .from("turmas")
          .select("*")
          .order("nome");

        if (turmasError) throw turmasError;

        setCriancas(criancasData || []);
        setTurmas(turmasData || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setErrorMessage("Erro ao carregar dados. Por favor, tente novamente.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Atualiza a lista de responsáveis quando uma criança é selecionada
  useEffect(() => {
    async function loadResponsaveis() {
      if (!criancaValue) {
        setResponsaveisDisponiveis([]);
        return;
      }

      try {
        // Busca os responsáveis vinculados à criança
        const { data, error } = await supabase
          .from("crianca_responsavel")
          .select(
            `
            parentesco,
            responsaveis (*)
          `
          )
          .eq("crianca_id", criancaValue);

        if (error) throw error;

        const raw: RawResponsavel[] = data as RawResponsavel[];

        // Formata os dados dos responsáveis
        const responsaveis = raw
          .filter((item) => item.responsaveis !== null)
          .map((item) => ({
            ...item.responsaveis!,
            parentesco: item.parentesco,
          }));

        setResponsaveisDisponiveis(responsaveis);
      } catch (error) {
        console.error("Erro ao carregar responsáveis:", error);
        setErrorMessage(
          "Erro ao carregar responsáveis. Por favor, tente novamente."
        );
      }

      // Limpa o responsável selecionado quando a criança muda
      setResponsavelValue("");
      setResponsavelSelecionado(null);
    }

    loadResponsaveis();
  }, [criancaValue]);

  // Função para realizar o check-in
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!criancaValue || !responsavelValue || !turmaValue) {
      setErrorMessage("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Cria um FormData para enviar ao server action
      const formData = new FormData();
      formData.append("criancaId", criancaValue);
      formData.append("responsavelId", responsavelValue);
      formData.append("turmaId", turmaValue);

      // Chama o server action para criar o check-in
      const result = await createCheckin(formData);

      if (result.error) {
        setErrorMessage(result.error);
        return;
      }

      // Registra o horário do check-in
      const horario = new Date().toLocaleTimeString();
      setHorarioCheckin(horario);

      // Cria os dados para o QR Code
      if (responsavelSelecionado) {
        const checkinId = result.checkinId
        const url = `${window.location.origin}/info/${checkinId}`;
        setQrCodeValue(url);
      } else {
        toast.error("Error", { description: "Responsável não selecionado" });
      }
      // Converte para string JSON para o QR Code

      setShowQRCode(true);
    } catch (error) {
      console.error("Erro ao realizar check-in:", error);
      setErrorMessage("Erro ao realizar check-in. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para imprimir a etiqueta
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor, permita pop-ups para imprimir a etiqueta.");
      return;
    }

    const crianca = criancas.find((c) => c.id === criancaValue);
    const turma = turmas.find((t) => t.id === turmaValue);
    const responsavelInfo = responsavelSelecionado
      ? `${responsavelSelecionado.nome} (${responsavelSelecionado.parentesco})`
      : "Responsável";

    const canvas = document.querySelector("canvas");
    if (!canvas) {
      console.error("Canvas não encontrado.");
      return;
    }

    const qrCodeUrl = canvas.toDataURL("image/png");

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
            .link {
              font-size: 7pt;
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
              <!-- Usar uma API externa para gerar o QR code -->
              <img src="${qrCodeUrl}" width="80" height="80" alt="QR Code" />
            </div>
            <div class="info">
              <div class="nome">${crianca?.nome || "Nome da Criança"}</div>
              <div class="turma">${turma?.nome || "Turma"}</div>
              <div class="horario">Check-in: ${horarioCheckin}</div>
              <div class="responsavel">Resp: ${responsavelInfo}</div>
              <div class="id">ID: ${crianca?.id || "000000"}</div>
            </div>
          </div>
          <script>
            // Garantir que a imagem seja carregada antes de imprimir
            const img = document.querySelector('img');
            if (img.complete) {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 500);
              }, 500);
            } else {
              img.onload = function() {
                setTimeout(function() {
                  window.print();
                  setTimeout(function() {
                    window.close();
                  }, 500);
                }, 500);
              };
              
              // Fallback se a imagem falhar ao carregar
              img.onerror = function() {
                alert('Não foi possível carregar o QR code. Tente novamente.');
                setTimeout(function() {
                  window.print();
                  setTimeout(function() {
                    window.close();
                  }, 500);
                }, 500);
              };
            }
          </script>
        </body>
      </html>
    `);
  };

  const handleNovo = () => {
    setCriancaValue("");
    setResponsavelValue("");
    setTurmaSelecionada(null);

    setShowQRCode(false);
    router.push("/checkin");
  };
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Check-in</h1>
          <p className="text-muted-foreground">
            Registre a entrada de uma criança
          </p>
        </div>

        {!showQRCode ? (
          <form onSubmit={handleSubmit} className="sm:min-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle>Dados do Check-in</CardTitle>
                <CardDescription>
                  Selecione a criança, o responsável e a turma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {errorMessage && (
                  <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="crianca">Criança</Label>
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Popover open={openCrianca} onOpenChange={setOpenCrianca}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCrianca}
                          className="w-full justify-between"
                        >
                          {criancaValue
                            ? criancas.find(
                                (crianca) => crianca.id === criancaValue
                              )?.nome
                            : "Selecione uma criança..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Buscar criança..."
                            value={searchCrianca}
                            onValueChange={setSearchCrianca}
                          />
                          <CommandList>
                            <CommandEmpty>
                              Nenhuma criança encontrada.
                            </CommandEmpty>
                            <CommandGroup>
                              {criancas
                                .filter((crianca) =>
                                  crianca.nome
                                    .toLowerCase()
                                    .includes(searchCrianca.toLowerCase())
                                )
                                .map((crianca) => (
                                  <CommandItem
                                    key={crianca.id}
                                    value={crianca.id}
                                    onSelect={(currentValue) => {
                                      setCriancaValue(
                                        currentValue === criancaValue
                                          ? ""
                                          : currentValue
                                      );
                                      setCriancaSelecionada(
                                        currentValue === criancaValue
                                          ? null
                                          : criancas.find(
                                              (c) => c.id === currentValue
                                            ) || null
                                      );
                                      setOpenCrianca(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        criancaValue === crianca.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {crianca.nome}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsavel">
                    Responsável
                    {!criancaValue && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (Selecione uma criança primeiro)
                      </span>
                    )}
                  </Label>
                  {isLoading ||
                  (criancaValue &&
                    responsaveisDisponiveis.length === 0 &&
                    !errorMessage) ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Popover
                      open={openResponsavel}
                      onOpenChange={setOpenResponsavel}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openResponsavel}
                          className="w-full justify-between"
                          disabled={
                            !criancaValue ||
                            responsaveisDisponiveis.length === 0
                          }
                        >
                          {responsavelValue && responsavelSelecionado
                            ? `${responsavelSelecionado.nome} (${responsavelSelecionado.parentesco})`
                            : "Selecione um responsável..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Buscar responsável..."
                            value={searchResponsavel}
                            onValueChange={setSearchResponsavel}
                          />
                          <CommandList>
                            <CommandEmpty>
                              Nenhum responsável encontrado.
                            </CommandEmpty>
                            <CommandGroup>
                              {responsaveisDisponiveis
                                .filter((resp) =>
                                  resp.nome
                                    .toLowerCase()
                                    .includes(searchResponsavel.toLowerCase())
                                )
                                .map((resp) => (
                                  <CommandItem
                                    key={resp.id}
                                    value={resp.id}
                                    onSelect={(currentValue) => {
                                      setResponsavelValue(
                                        currentValue === responsavelValue
                                          ? ""
                                          : currentValue
                                      );
                                      setResponsavelSelecionado(
                                        currentValue === responsavelValue
                                          ? null
                                          : responsaveisDisponiveis.find(
                                              (r) => r.id === currentValue
                                            ) || null
                                      );
                                      setOpenResponsavel(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        responsavelValue === resp.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {resp.nome}{" "}
                                    <span className="text-muted-foreground ml-1">
                                      ({resp.parentesco})
                                    </span>
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                  {criancaValue &&
                    responsaveisDisponiveis.length === 0 &&
                    !isLoading && (
                      <p className="text-xs text-destructive mt-1">
                        Esta criança não possui responsáveis vinculados. Por
                        favor, cadastre um responsável primeiro.
                      </p>
                    )}
                </div>

                <div className="space-y-2 w-full">
                  <Label htmlFor="turma">Turma</Label>
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                    
                      value={turmaValue}
                      onValueChange={(value) => {
                        setTurmaValue(value);
                        setTurmaSelecionada(
                          turmas.find((t) => t.id === value) || null
                        );
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione uma turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {turmas.map((turma) => (
                          <SelectItem key={turma.id} value={turma.id}>
                            {turma.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/")}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !criancaValue ||
                    !responsavelValue ||
                    !turmaValue ||
                    isSubmitting
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Realizar Check-in"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Check-in Realizado</CardTitle>
              <CardDescription>Etiqueta gerada com sucesso</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div
                ref={etiquetaRef}
                className="bg-white text-black rounded-lg border p-4 w-full max-w-md flex items-center"
              >
                <div className="flex-shrink-0">
                  <QRCodeCanvas value={qrCodeValue} size={100} level="H" />
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="font-bold text-lg truncate">
                    {criancaSelecionada?.nome || "Nome da Criança"}
                  </p>
                  <p className="text-sm">{turmaSelecionada?.nome || "Turma"}</p>
                  <p className="text-sm">Check-in: {horarioCheckin}</p>
                  <p className="text-sm">
                    Resp:{" "}
                    {responsavelSelecionado
                      ? `${responsavelSelecionado.nome} (${responsavelSelecionado.parentesco})`
                      : "Responsável"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {criancaSelecionada?.id || "000000"}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={handleNovo}>
                  Novo Check-in
                </Button>
                <Button onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir Etiqueta
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
