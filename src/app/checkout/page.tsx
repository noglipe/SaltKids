"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  ArrowLeft,
  Search,
  QrCode,
  UserRound,
  Check,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MainLayout from "@/components/main-layout";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatarCPF, gerarCPFHash, mascararCPF } from "@/lib/utils";
import {  RealQrScanner } from "@/components/real-qr-scanner";

// Schema de validação do formulário de busca por CPF
const cpfFormSchema = z.object({
  cpf: z
    .string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
      message: "CPF deve estar no formato 000.000.000-00",
    })
    .refine((cpf) => cpf.replace(/\D/g, "").length === 11, {
      message: "CPF deve ter 11 dígitos numéricos",
    }),
});

// Schema de validação do formulário de check-out
const checkoutFormSchema = z.object({
  checkinId: z.string({ required_error: "Selecione um check-in" }),
  responsavelId: z.string({ required_error: "Selecione um responsável" }),
  observacoes: z.string().optional(),
});

interface Responsavel {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  parentesco?: string;
}

interface Crianca {
  id: string;
  nome: string;
  data_nascimento: string;
  foto_url: string | null;
}

interface Turma {
  id: string;
  nome: string;
  faixa_etaria: string;
}

interface Checkin {
  id: string;
  crianca_id: string;
  turma_id: string;
  horario: string;
  checkout_horario: string | null;
  status: string | null;
  criancas: Crianca;
  turmas: Turma;
}

type CheckinComRelacionamentos = {
  id: string;
  status: string;
  checkout_horario: string | null;
  criancas: { nome: string } | null;
  turmas: { nome: string } | null;
};

export default function CheckOut() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [responsavel, setResponsavel] = useState<Responsavel | null>(null);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [checkinSelecionado, setCheckinSelecionado] = useState<Checkin | null>(
    null
  );
  const [responsavelSelecionado, setResponsavelSelecionado] =
    useState<Responsavel | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [checkoutRealizado, setCheckoutRealizado] = useState<{
    checkin: Checkin;
    responsavel: Responsavel;
  } | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [nomeCrianca, setNomeCrianca] = useState("");

  const [parentesco, setParentesco] = useState("");
  // Formulário de busca por CPF
  const cpfForm = useForm<z.infer<typeof cpfFormSchema>>({
    resolver: zodResolver(cpfFormSchema),
    defaultValues: {
      cpf: "",
    },
  });

  // Formulário de check-out
  const checkoutForm = useForm<z.infer<typeof checkoutFormSchema>>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      checkinId: "",
      responsavelId: "",
      observacoes: "",
    },
  });

  // Função para buscar responsável por CPF
  const buscarPorCPF = async (values: z.infer<typeof cpfFormSchema>) => {
    setBuscando(true);
    try {
      const cpfHash = await gerarCPFHash(values.cpf);

      // Buscar responsável
      const { data: respData, error: respError } = await supabase
        .from("responsaveis")
        .select("*")
        .eq("cpf_hash", cpfHash)
        .maybeSingle();

      if (respError || !respData) {
        toast.error("Responsável não encontrado", {
          description: "Nenhum responsável encontrado com este CPF.",
        });
        setResponsavel(null);
        setCheckins([]);
        return;
      }

      const { data: checkinsData, error: checkinsError } = await supabase
        .from("checkins")
        .select(
          `
            id,
            crianca_id,
            turma_id,
            horario,
            checkout_horario,
            status,
            criancas (
                id,
                nome,
                data_nascimento,
                foto_url
                ),
            turmas (
                id,
                nome,
                faixa_etaria
                )
        `
        )
        .eq("responsavel_id", respData?.id)
        .is("checkout_horario", null);

      if (checkinsError) {
        console.error("Erro no select dos check-ins:", checkinsError);
        throw checkinsError;
      }

      if (!checkinsData || checkinsData.length === 0) {
        toast("Nenhum check-in ativo", {
          description:
            "Não há check-ins ativos para as crianças deste responsável.",
        });
        setResponsavel(respData);
        setCheckins([]);
        return;
      }

      // Formatar dados dos check-ins
      const checkinsFormatados = checkinsData.map((item) => ({
        id: item.id,
        crianca_id: item.crianca_id,
        turma_id: item.turma_id,
        horario: item.horario,
        checkout_horario: item.checkout_horario,
        status: item.status,
        criancas: item.criancas ?? null,
        turmas: item.turmas ?? null,
      }));

      setCheckins(checkinsFormatados);
      setResponsavel(respData);
    } catch (error: any) {
      console.error("Erro ao buscar por CPF:", error);
      toast.error("Erro", {
        description:
          "Ocorreu um erro ao buscar o responsável. Tente novamente.",
      });
      setResponsavel(null);
      setCheckins([]);
    } finally {
      setBuscando(false);
    }
  };

  // Função para processar o resultado do QR Code
  const handleQrCodeResult = async (result: string) => {
    try {
      if (!result || typeof result !== "string") {
        setScanError("QR Code inválido. Por favor, tente novamente.");
        return;
      }

      // Extrai o ID do check-in da URL (assumindo o formato /info/checkin/<id>)
      const partes = result.split("/");
      const checkinId = partes[partes.length - 1];

      setBuscando(true);

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
        throw new Error("Check-in não encontrado");
      }

      if (checkin.checkout_horario) {
        toast("Check-out já realizado", {
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

      toast("Check-out realizado com sucesso", {
        description: `Criança: ${
          (checkin.criancas as { nome: string })?.nome ?? "Desconhecida"
        }\nTurma: ${(checkin.turmas as { nome: string })?.nome ?? ""}`,
      });

      setSuccessDialogOpen(true);

      // Reset
      setQrDialogOpen(false);
      setScannerActive(false);
      setResponsavel(null);
      setCheckins([]);
    } catch (error) {
      console.error("Erro ao processar QR code:", error);
      setScanError("Erro ao realizar o check-out. Por favor, tente novamente.");
    } finally {
      setBuscando(false);
    }
  };

  // Função para realizar check-out
  const realizarCheckout = async (checkin: Checkin) => {
    const confirmar = window.confirm(
      "Você tem certeza que deseja realizar o check-out?"
    );

    if (!confirmar) return;

    setIsLoading(true);
    try {
      //bucar criança
      const { data: RC, error: RCError } = await supabase
        .from("crianca_responsavel")
        .select("*")
        .eq("crianca_id", checkin.crianca_id)
        .maybeSingle();

      if (RC) {
        setParentesco(RC.parentesco);
      } else {
        setParentesco(""); // ou um valor padrão
        console.warn(
          "Nenhuma relação encontrada para a criança:",
          checkin.crianca_id
        );
      }

      // Realizar check-out
      const { data: checkout, error } = await supabase
        .from("checkins")
        .update({
          checkout_horario: new Date().toISOString(),
          checkout_responsavel_id: responsavel?.id,
          status: "finalizado",
        })
        .eq("id", checkin.id)
        .select()
        .single();

      if (error) throw error;

      setCheckoutRealizado({
        checkin,
        responsavel: responsavel!,
      });

      // Mostrar diálogo de sucesso
      setSuccessDialogOpen(true);

      // Limpar formulários
      cpfForm.reset();
      checkoutForm.reset();
      setCheckinSelecionado(null);
      setResponsavelSelecionado(null);
    } catch (error: any) {
      console.error("Erro ao realizar check-out:", error);
      toast.error("Erro", {
        description:
          error.message ||
          "Não foi possível realizar o check-out. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
      if (checkins.length > 0) {
        router.push("/checkout");
      }
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              className="mr-2"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Check-out</h1>
          </div>
        </div>

        <Card className="max-w-2xl sm:min-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Realizar Check-out</CardTitle>
            <CardDescription>
              Registre a saída de uma criança do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="cpf" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cpf">Buscar por CPF</TabsTrigger>
                <TabsTrigger value="qrcode">Escanear QR Code</TabsTrigger>
              </TabsList>

              <TabsContent value="cpf" className="space-y-6">
                <Form {...cpfForm}>
                  <form
                    onSubmit={cpfForm.handleSubmit(buscarPorCPF)}
                    className="space-y-4"
                  >
                    <FormField
                      control={cpfForm.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF do Responsável</FormLabel>
                          <div className="flex space-x-2">
                            <FormControl>
                              <Input
                                placeholder="Digite o CPF do responsável"
                                inputMode="numeric"
                                {...field}
                                onChange={(e) =>
                                  cpfForm.setValue(
                                    "cpf",
                                    formatarCPF(e.target.value)
                                  )
                                }
                              />
                            </FormControl>
                            <Button type="submit" disabled={buscando}>
                              {buscando ? "Buscando..." : "Buscar"}
                              <Search className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                          <FormDescription>
                            Formato: 000.000.000-00
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="qrcode" className="space-y-6">
                <div className="text-center p-6 border rounded-lg">
                  <QrCode className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-medium mb-2">Escanear QR Code</h3>
                  <p className="text-slate-500 mb-4">
                    Escaneie o QR Code da criança para realizar o check-out
                    rapidamente.
                  </p>
                  <Button onClick={() => setQrDialogOpen(true)}>
                    Abrir Scanner
                    <QrCode className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {checkins.length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="font-medium">Check-ins ativos:</h3>
                <div className="grid gap-2 ">
                  {checkins.map((checkin) => (
                    <div
                      key={checkin.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors hover:text-black ${
                        checkinSelecionado?.id === checkin.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-slate-50"
                      }`}
                      onClick={() => {
                        realizarCheckout(checkin);
                      }}
                    >
                      <div className="flex items-center justify-between hover:text-black">
                        <div className="flex items-center space-x-3 ">
                          <Avatar className="">
                            {checkin.crianca?.foto_url ? (
                              <AvatarImage
                                src={
                                  checkin.criancas?.foto_url ||
                                  "/placeholder.svg"
                                }
                                alt={checkin.criancas?.nome}
                              />
                            ) : (
                              <AvatarFallback>
                                <UserRound className="h-5 w-5" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium hover:text-black">
                              {checkin.criancas?.nome}
                            </p>
                            <div className="flex items-center space-x-2 text-sm text-slate-500 hover:text-black">
                              <Badge variant="outline" className="mr-2">
                                {checkin.turmas?.nome}
                              </Badge>
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>
                                  {formatDistanceToNow(
                                    new Date(checkin?.horario),
                                    {
                                      addSuffix: true,
                                      locale: ptBR,
                                    }
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {checkinSelecionado?.id === checkin.id && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diálogo do Scanner de QR Code */}
        <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Escanear QR Code</DialogTitle>
              <DialogDescription>
                Posicione o QR Code no centro da câmera para escanear.
              </DialogDescription>
            </DialogHeader>
            <div className="h-[300px]">
              <RealQrScanner
                onResult={handleQrCodeResult}
              />
            </div>
            {scanError && (
              <div className="text-red-500 text-sm mt-2">{scanError}</div>
            )}
          </DialogContent>
        </Dialog>

        {/* Diálogo de Check-out Realizado com Sucesso */}
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
            {checkoutRealizado && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-green-100 dark">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-12 w-12">
                      {checkoutRealizado.checkin.criancas?.foto_url ? (
                        <AvatarImage
                          src={
                            checkoutRealizado.checkin.criancas?.foto_url ||
                            "/placeholder.svg"
                          }
                          alt={checkoutRealizado.checkin.criancas?.nome}
                        />
                      ) : (
                        <AvatarFallback>
                          {checkoutRealizado.checkin.criancas?.nome.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="space-y-1 dark">
                      <h3 className="font-medium ">
                        {checkoutRealizado.checkin.criancas?.nome}
                      </h3>
                      <div className="text-sm text-slate-500">
                        <p>
                          Data de Nascimento:{" "}
                          {format(
                            new Date(
                              checkoutRealizado.checkin.criancas?.data_nascimento
                            ),
                            "dd/MM/yyyy",
                            {
                              locale: ptBR,
                            }
                          )}
                        </p>
                        <p>
                          Turma: {checkoutRealizado.checkin.turmas.nome} (
                          {checkoutRealizado.checkin.turmas.faixa_etaria})
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4  rounded-lg border border-blue-100">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {checkoutRealizado.responsavel.nome.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="font-medium ">
                        {checkoutRealizado.responsavel.nome}
                      </h3>
                      <div className="text-sm text-slate-500">
                        <p>
                          CPF: {mascararCPF(checkoutRealizado.responsavel.cpf)}
                        </p>
                        <p>
                          Telefone: {checkoutRealizado.responsavel.telefone}
                        </p>
                        {checkoutRealizado.responsavel && (
                          <Badge variant="outline">{parentesco}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSuccessDialogOpen(false);
                      router.push("/checkout");
                      window.location.reload();
                    }}
                  >
                    Fechar
                  </Button>
                  <Button onClick={() => router.push("/")}>
                    Voltar para o Início
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
