"use client";

import { useState, useEffect, useMemo } from "react";
import {
  AlertCircle,
  Phone,
  Clock,
  User,
  Search,
  MessageCircle,
  Printer,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MainLayout from "@/components/main-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import Etiqueta from "@/components/handlePrint";

interface Turma {
  id: string;
  nome: string;
  faixa_etaria: string;
}

interface Responsavel {
  id: string;
  nome: string;
  telefone: string;
}

interface Crianca {
  id: string;
  nome: string;
  data_nascimento: string;
  observacoes?: string;
  responsavel: Responsavel;
  horario_entrada: string;
  checkin_id: string; // Mantido para referência futura se necessário
}

export default function TurmasPage() {
  const [selectedTurma, setSelectedTurma] = useState<string | any>();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [criancasPorTurma, setCriancasPorTurma] = useState<
    Record<string, Crianca[]>
  >({});
  const [isLoadingTurmas, setIsLoadingTurmas] = useState(true);
  const [isLoadingCriancas, setIsLoadingCriancas] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768); // Tailwind: md = 768px
    } else {
      setIsMobile(false);
    }
  }, []);

  // Buscar turmas do banco de dados
  useEffect(() => {
    async function fetchTurmas() {
      try {
        setIsLoadingTurmas(true);

        const { data, error } = await supabase
          .from("turmas")
          .select("id, nome, faixa_etaria")
          .order("nome");

        if (error) {
          throw new Error(`Erro ao buscar turmas: ${error.message}`);
        }

        setTurmas(data || []);
      } catch (error) {
        console.error("Erro ao buscar turmas:", error);
        toast("Erro ao carregar turmas", {
          description:
            "Não foi possível carregar as turmas. Tente novamente mais tarde.",
        });
      } finally {
        setIsLoadingTurmas(false);
      }
    }

    fetchTurmas();
  }, [toast, supabase]);

  // Buscar crianças com check-ins ativos para a turma selecionada
  useEffect(() => {
    if (!selectedTurma) return;

    async function fetchCriancasPorTurma() {
      try {
        setIsLoadingCriancas(true);

        // 1. Buscar check-ins ativos para a turma selecionada
        const { data: checkins, error: checkinsError } = await supabase
          .from("checkins")
          .select("id, horario, crianca_id, responsavel_id")
          .eq("turma_id", selectedTurma)
          .eq("status", "ativo")
          .order("horario", { ascending: false });

        if (checkinsError) {
          throw new Error(`Erro ao buscar check-ins: ${checkinsError.message}`);
        }

        if (!checkins || checkins.length === 0) {
          setCriancasPorTurma((prev) => ({
            ...prev,
            [selectedTurma ?? "defaultKey"]: [],
          }));
          return;
        }

        // 2. Buscar detalhes das crianças
        const criancaIds = checkins.map((checkin) => checkin.crianca_id);
        const { data: criancas, error: criancasError } = await supabase
          .from("criancas")
          .select("*")
          .in("id", criancaIds);

        if (criancasError) {
          throw new Error(`Erro ao buscar crianças: ${criancasError.message}`);
        }

        // 3. Buscar detalhes dos responsáveis
        const responsavelIds = checkins.map(
          (checkin) => checkin.responsavel_id
        );
        const { data: responsaveis, error: responsaveisError } = await supabase
          .from("responsaveis")
          .select("*")
          .in("id", responsavelIds);

        if (responsaveisError) {
          throw new Error(
            `Erro ao buscar responsáveis: ${responsaveisError.message}`
          );
        }

        // 4. Criar mapas para facilitar o acesso aos dados
        const criancasMap =
          criancas?.reduce((map, crianca) => {
            map[crianca.id] = crianca;
            return map;
          }, {} as Record<string, any>) || {};

        const responsaveisMap =
          responsaveis?.reduce((map, responsavel) => {
            map[responsavel.id] = responsavel;
            return map;
          }, {} as Record<string, any>) || {};

        // 5. Formatar os dados para o formato esperado pelo frontend
        const criancasPresentes = checkins
          .map((checkin) => {
            const crianca = criancasMap[checkin.crianca_id];
            const responsavel = responsaveisMap[checkin.responsavel_id];

            if (!crianca || !responsavel) {
              console.warn(`Dados incompletos para o check-in ${checkin.id}`);
              return null;
            }

            return {
              id: crianca.id,
              nome: crianca.nome,
              data_nascimento: crianca.data_nascimento,
              observacoes: crianca.observacoes,
              horario_entrada: checkin.horario,
              checkin_id: checkin.id, // Mantido para referência futura se necessário
              responsavel: {
                id: responsavel.id,
                nome: responsavel.nome,
                telefone: responsavel.telefone,
              },
            };
          })
          .filter(Boolean); // Remover itens nulos

        setCriancasPorTurma((prev) => ({
          ...prev,
          [selectedTurma]: criancasPresentes,
        }));
      } catch (error) {
        console.error("Erro ao buscar crianças:", error);
        toast("Erro ao carregar crianças", {
          description:
            "Não foi possível carregar as crianças desta turma. Tente novamente mais tarde.",
        });
        // Definir um array vazio para a turma selecionada em caso de erro
        setCriancasPorTurma((prev) => ({
          ...prev,
          [selectedTurma ?? "defaultKey"]: [],
        }));
      } finally {
        setIsLoadingCriancas(false);
      }
    }

    fetchCriancasPorTurma();
  }, [selectedTurma, toast, supabase]);

  // Calcular idade em anos a partir da data de nascimento
  function calcularIdade(dataNascimento: string): string {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();

    if (
      mesNascimento > mesAtual ||
      (mesNascimento === mesAtual && nascimento.getDate() > hoje.getDate())
    ) {
      idade--;
    }

    return `${idade} anos`;
  }

  // Formatar número de telefone para link do WhatsApp
  function formatarTelefoneParaWhatsApp(telefone: string): string {
    // Remove todos os caracteres não numéricos
    const numeroLimpo = telefone.replace(/\D/g, "");

    // Verifica se o número já tem o código do país
    if (numeroLimpo.startsWith("55")) {
      return numeroLimpo;
    }

    // Adiciona o código do Brasil (55) se não estiver presente
    return `55${numeroLimpo}`;
  }

  // Filtrar crianças com base no termo de busca
  const criancasAtuais = useMemo(() => {
    if (!selectedTurma || !criancasPorTurma[selectedTurma]) {
      return [];
    }

    if (!searchTerm.trim()) {
      return criancasPorTurma[selectedTurma];
    }

    const termoBusca = searchTerm.toLowerCase().trim();
    return criancasPorTurma[selectedTurma].filter((crianca) =>
      crianca.nome.toLowerCase().includes(termoBusca)
    );
  }, [selectedTurma, criancasPorTurma, searchTerm]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Turma</h1>
          <p className="text-muted-foreground">
            Visualize as crianças presentes em cada turma
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Selecione a Turma</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTurmas ? (
              <Skeleton className="h-10 w-full md:w-[300px]" />
            ) : (
              <Select value={selectedTurma} onValueChange={setSelectedTurma}>
                <SelectTrigger className="w-full md:w-[300px]">
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
          </CardContent>
        </Card>

        {selectedTurma && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center">
                <h2 className="text-xl font-semibold">
                  {isLoadingTurmas ? (
                    <Skeleton className="h-6 w-40" />
                  ) : (
                    turmas.find((t) => t.id === selectedTurma)?.nome
                  )}
                </h2>
                <Badge variant="outline" className="ml-2">
                  {isLoadingCriancas ? (
                    <Skeleton className="h-4 w-20" />
                  ) : (
                    `${criancasAtuais.length} crianças presentes`
                  )}
                </Badge>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar criança..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {isLoadingCriancas ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <Skeleton className="h-16 w-full md:w-1/2" />
                        <Skeleton className="h-8 w-full md:w-1/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : criancasAtuais.length > 0 ? (
              <div className="space-y-4">
                {criancasAtuais.map((crianca) => (
                  <Card key={crianca.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-primary/10 p-2">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{crianca.nome}</h3>
                            <p className="text-sm text-muted-foreground">
                              {calcularIdade(crianca.data_nascimento)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            Entrada:{" "}
                            {new Date(
                              crianca.horario_entrada
                            ).toLocaleDateString("pt-BR")}
                            {" às "}
                            {new Date(
                              crianca.horario_entrada
                            ).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {crianca.observacoes && (
                        <Alert className="mt-3">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Observações Médicas</AlertTitle>
                          <AlertDescription>
                            {crianca.observacoes}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="mt-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {crianca.responsavel.nome}: <br />
                            {crianca.responsavel.telefone}
                          </span>
                        </div>
                        {isMobile ? (
                          <a
                            href={`whatsapp://send?phone=+${formatarTelefoneParaWhatsApp(
                              crianca.responsavel.telefone
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className=" "
                          >
                            <Button size="sm" variant="outline">
                              <MessageCircle className="h-4 w-4 mr-2" />
                              WhatsApp
                            </Button>
                          </a>
                        ) : (
                          <div className="flex gap-2 flex-wrap">
                            <a
                              href={`https://wa.me/${formatarTelefoneParaWhatsApp(
                                crianca.responsavel.telefone
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className=""
                            >
                              <Button size="sm" variant="outline">
                                <MessageCircle className="h-4 w-4 mr-2" />
                                WhatsApp
                              </Button>
                            </a>
                            <Etiqueta turmaId={selectedTurma} crianca={crianca} responsavel={crianca.responsavel} />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? "Nenhuma criança encontrada com esse nome."
                      : "Nenhuma criança presente nesta turma no momento."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
