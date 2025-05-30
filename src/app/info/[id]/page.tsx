"use client";

import type React from "react";

import { useEffect, useState } from "react";

import {
  User,
  Clock,
  Phone,
  School,
  AlertCircle,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { formatarCPF, formatarData, gerarCPFHash } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import Footer from "@/components/footer";

interface Crianca {
  id: string;
  nome: string;
  data_nascimento: string;
  observacoes?: string;
  turma?: {
    id: string;
    nome: string;
    sala: string;
  };
  professor?: string;
  checkin: {
    id: string;
    horario: string;
  };
}

interface Responsavel {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
}

export default function InfoPage({ params }: { params: { id: string } }) {
  const [cpf, setCpf] = useState("");
  const [validated, setValidated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responsavel, setResponsavel] = useState<Responsavel | null>(null);
  const [criancas, setCriancas] = useState<Crianca[]>([]);

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCpf(formatarCPF(value));
  };

  // Função para calcular a idade
  const calcularIdade = (dataNascimento: string) => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();

    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }

    return idade;
  };

  // Função para validar o CPF e buscar dados
  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Buscar o responsável pelo CPF
      const { data: responsavelData, error: responsavelError } = await supabase
        .from("responsaveis")
        .select("*")
        .eq("cpf_hash", gerarCPFHash(cpf))
        .single();

      if (responsavelError) throw new Error("CPF Informado não é válido");

      setResponsavel(responsavelData);

      // Buscar as crianças do responsável com check-ins ativos
      const { data: relacoesData, error: relacoesError } = await supabase
        .from("crianca_responsavel")
        .select("crianca_id, parentesco")
        .eq("responsavel_id", responsavelData.id);

      if (relacoesError) throw new Error("Erro ao buscar crianças");

      if (relacoesData.length === 0) {
        throw new Error("Nenhuma criança encontrada para este responsável");
      }

      // Buscar check-ins ativos para as crianças do responsável
      const criancaIds = relacoesData.map((rel) => rel.crianca_id);

      const { data: checkinsData, error: checkinsError } = await supabase
        .from("checkins")
        .select(
          `
          id,
          horario,
          crianca_id,
          turma_id,
          criancas (
            id,
            nome,
            data_nascimento,
            observacoes
          ),
          turmas (
            id,
            nome,
            sala
          )
        `
        )
        .in("crianca_id", criancaIds)
        .eq("status", "ativo");

      if (checkinsError) throw new Error("Erro ao buscar check-ins");

      if (checkinsData.length === 0) {
        throw new Error("Nenhuma criança com check-in ativo encontrada");
      }

      // Formatar os dados das crianças
      const criancasFormatadas = checkinsData.map((checkin: any) => {
        const relacao = relacoesData.find(
          (rel) => rel.crianca_id === checkin.crianca_id
        );

        return {
          id: checkin.criancas.id,
          nome: checkin.criancas.nome,
          data_nascimento: checkin.criancas.data_nascimento,
          observacoes: checkin.criancas.observacoes,
          parentesco: relacao?.parentesco || "",
          turma: checkin.turmas
            ? {
                id: checkin.turmas.id,
                nome: checkin.turmas.nome,
                sala: checkin.turmas.sala,
              }
            : undefined,
          checkin: {
            id: checkin.id,
            horario: checkin.horario,
          },
        };
      });

      setCriancas(criancasFormatadas);
      setValidated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao validar CPF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 w-full ">
          <div className="flex gap-2 font-bold w-full items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Setor Kids - Informações
          </div>
        </div>
      </header>

      <main className="flex-1  justify-center items-center">
        <div className="container py-4 md:py-8">
          {!validated ? (
            <div className="max-w-md mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Verificação de Segurança</CardTitle>
                  <CardDescription>
                    Digite o CPF do responsável para visualizar as informações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleValidate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF do Responsável</Label>
                      <Input
                        id="cpf"
                        placeholder="000.000.000-00"
                        value={cpf}
                        onChange={handleCPFChange}
                        maxLength={14}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Verificando..." : "Verificar"}
                    </Button>

                    {error && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erro</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6 justify-center items-center">
              {responsavel && (
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-2xl font-bold mb-2">
                    Olá, {responsavel.nome}
                  </h2>
                  <div className="grid">
                    {criancas.map((crianca) => (
                      <Card key={crianca.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>{crianca.nome}</CardTitle>
                              <CardDescription>
                                {calcularIdade(crianca.data_nascimento)} anos (
                                {formatarData(crianca.data_nascimento)})
                              </CardDescription>
                            </div>
                            <Badge className="bg-green-600">Presente</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {crianca.turma && (
                            <div className="flex items-center gap-2">
                              <School className="h-4 w-4 text-muted-foreground" />
                              <span>Turma: {crianca.turma.nome}</span>
                            </div>
                          )}

                          {crianca.turma && (
                            <div className="flex items-center gap-2">
                              <School className="h-4 w-4 text-muted-foreground" />
                              <span>Sala: {crianca.turma.sala}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              Check-in:{" "}
                              {new Date(
                                crianca.checkin.horario
                              ).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              Data:{" "}
                              {new Date(
                                crianca.checkin.horario
                              ).toLocaleDateString("pt-BR")}
                            </span>
                          </div>

                          {crianca.observacoes && (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Observações</AlertTitle>
                              <AlertDescription>
                                {crianca.observacoes}
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="mt-8 border-t pt-6">
                    <h3 className="font-medium mb-4">Seus dados de contato</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{responsavel.nome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{responsavel.telefone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center text-sm text-muted-foreground max-w-3xl mx-auto">
                <p>
                  Estas informações estão disponíveis apenas enquanto a criança
                  estiver no setor.
                </p>
                <p className="mt-1">Código de acesso: {params.id}</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
