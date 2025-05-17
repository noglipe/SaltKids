"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  User,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import MainLayout from "@/components/main-layout";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Crianca {
  id: string;
  nome: string;
  turma: {
    id: string;
    nome: string;
  };
  checkin: {
    id: string;
    horario: string;
    responsavel: {
      id: string;
      nome: string;
    };
  };
}

export default function CheckoutForcadoPage() {
  const router = useRouter();
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCrianca, setSelectedCrianca] = useState<Crianca | null>(null);
  const [responsavel, setResponsavel] = useState<any>("");
  const [motivo, setMotivo] = useState("");
  const [confirmacao, setConfirmacao] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar crianças com check-ins ativos diretamente do Supabase
  useEffect(() => {
    const fetchCriancas = async () => {
      try {
        setIsLoading(true);

        // Buscar check-ins ativos com informações relacionadas
        const { data: checkinsData, error: checkinsError } = await supabase
          .from("checkins")
          .select(
            `
            id, 
            horario,
            crianca_id,
            criancas:crianca_id(id, nome),
            responsaveis:responsavel_id(id, nome),
            turmas:turma_id(id, nome)
          `
          )
          .eq("status", "ativo")
          .order("horario", { ascending: false });

        if (checkinsError) {
          throw new Error(`Erro ao buscar check-ins: ${checkinsError.message}`);
        }

        if (!checkinsData || checkinsData.length === 0) {
          setCriancas([]);
          return;
        }

        // Transformar os dados para o formato esperado pelo componente
        const criancasFormatadas = checkinsData.map((checkin) => ({
          id: checkin.criancas?.id || "",
          nome: checkin.criancas?.nome || "",
          turma: {
            id: checkin.turmas?.id || "",
            nome: checkin.turmas?.nome || "",
          },
          checkin: {
            id: checkin.id,
            horario: checkin.horario,
            responsavel: {
              id: checkin.responsaveis?.id || "",
              nome: checkin.responsaveis?.nome || "",
            },
          },
        }));

        setCriancas(criancasFormatadas);
      } catch (error) {
        console.error("Erro ao buscar crianças:", error);
        toast.error("Erro", {
          description:
            "Não foi possível carregar a lista de crianças com check-ins ativos.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCriancas();
  }, [supabase, toast]);

  // Função para preparar o checkout forçado
  const handleCheckoutForcado = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCrianca) {
      toast.error("Erro", {
        description: "Selecione uma criança para realizar o checkout forçado.",
      });
      return;
    }

    if (!responsavel.trim()) {
      toast.error("Erro", {
        description: "Informe o nome do responsável pelo checkout.",
      });
      return;
    }

    if (!motivo.trim()) {
      toast.error("Erro", {
        description: "Informe o motivo do checkout forçado.",
      });
      return;
    }

    setConfirmacao(true);
  };

  // Função para confirmar o checkout forçado usando Supabase diretamente
  const handleConfirmar = async () => {
    try {
      setIsSubmitting(true);

      if (!selectedCrianca?.checkin.id) {
        throw new Error("ID do check-in não encontrado");
      }

      // Atualizar o check-in para finalizado
      const { error: checkoutError } = await supabase
        .from("checkins")
        .update({
          checkout_horario: new Date().toISOString(),
          checkout_responsavel_nome: responsavel, // Usando o nome informado no formulário
          status: "finalizado",
          checkout_forcado_motivo: motivo, // Usando a coluna específica para o motivo
          checkout_forcado: true, // Marcando como checkout forçado
        })
        .eq("id", selectedCrianca.checkin.id);

      if (checkoutError) {
        throw new Error(`Erro ao realizar checkout: ${checkoutError.message}`);
      }

      setConfirmacao(false);
      setCheckoutComplete(true);

      toast.success("Sucesso", {
        description: "Checkout forçado realizado com sucesso!",
      });

      // Redirecionar após 3 segundos
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (error) {
      console.error("Erro ao realizar checkout forçado:", error);
      toast.error("Erro", {
        description:
          error instanceof Error
            ? error.message
            : "Erro ao realizar checkout forçado",
      });
      setConfirmacao(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatar horário
  const formatHorario = (horario: string) => {
    try {
      return format(new Date(horario), "HH:mm", { locale: ptBR });
    } catch (error) {
      return "Horário inválido";
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Checkout Forçado
          </h1>
          <p className="text-muted-foreground">
            Realize a saída manual de uma criança
          </p>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção!</AlertTitle>
          <AlertDescription>
            O checkout forçado deve ser utilizado apenas em situações
            excepcionais, quando não é possível realizar o checkout normal.
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2">
                Carregando crianças com check-ins ativos...
              </p>
            </CardContent>
          </Card>
        ) : criancas.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <Alert>
                <AlertTitle>Nenhum check-in ativo</AlertTitle>
                <AlertDescription>
                  Não há crianças com check-ins ativos no momento.
                </AlertDescription>
              </Alert>
              <div className="mt-4 flex justify-center">
                <Button onClick={() => router.push("/")}>
                  Voltar para o Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : !confirmacao && !checkoutComplete ? (
          <form onSubmit={handleCheckoutForcado}>
            <Card>
              <CardHeader>
                <CardTitle>Dados do Checkout Forçado</CardTitle>
                <CardDescription>
                  Selecione a criança e informe o motivo da saída forçada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 w-full">
                  <Label htmlFor="crianca">Criança</Label>
                  <Select
                    required
                    onValueChange={(value) => {
                      const crianca = criancas.find((c) => c.id === value);
                      setSelectedCrianca(crianca || null);
                    }}
                    
                    
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma criança" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      {criancas.map((crianca) => (
                        <SelectItem key={crianca.id} value={crianca.id}>
                          {crianca.nome} - {crianca.turma.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsavel">Responsável pelo Checkout</Label>
                  <Input
                    id="responsavel"
                    placeholder="Nome do responsável pelo checkout"
                    required
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivo">Motivo do Checkout Forçado</Label>
                  <Textarea
                    id="motivo"
                    placeholder="Descreva o motivo do checkout forçado"
                    className="min-h-[100px]"
                    required
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                  />
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
                <Button type="submit" variant="destructive">
                  Realizar Checkout Forçado
                </Button>
              </CardFooter>
            </Card>
          </form>
        ) : confirmacao ? (
          <Card>
            <CardHeader>
              <CardTitle>Confirmar Checkout Forçado</CardTitle>
              <CardDescription>
                Verifique os dados e confirme a ação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCrianca && (
                <>
                  <div className="flex items-center space-x-4 border-b pb-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{selectedCrianca.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedCrianca.turma.nome}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Check-in:
                      </span>
                      <span className="text-sm font-medium flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {formatHorario(selectedCrianca.checkin.horario)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Responsável pelo check-in:
                      </span>
                      <span className="text-sm font-medium">
                        {selectedCrianca.checkin.responsavel.nome}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Responsável pelo checkout:
                      </span>
                      <span className="text-sm font-medium">{responsavel}</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted p-3">
                    <h4 className="text-sm font-medium mb-1">
                      Motivo do checkout forçado:
                    </h4>
                    <p className="text-sm">{motivo}</p>
                  </div>
                </>
              )}

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Confirmação</AlertTitle>
                <AlertDescription>
                  Esta ação será registrada no sistema como um checkout forçado.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setConfirmacao(false)}
                disabled={isSubmitting}
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmar}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Confirmar Checkout Forçado"
                )}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="mt-4 text-xl font-bold">
                Checkout Forçado Realizado!
              </h2>
              <p className="mt-2 text-muted-foreground">
                O checkout forçado de {selectedCrianca?.nome} foi registrado com
                sucesso.
              </p>
              <p className="text-sm mt-4">Redirecionando para o dashboard...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
