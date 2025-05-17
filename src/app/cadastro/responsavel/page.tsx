"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {  ArrowLeft } from "lucide-react";
import MainLayout from "@/components/main-layout";
import { formatarCPF, formatarTelefone, gerarCPFHash } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { criptografarTexto } from "@/lib/crypto";
import { toast } from "sonner";

export default function CadastroResponsavelPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [nome, setNome] = useState("");
  const [cpfInput, setCpfInput] = useState("");
  const [telefone, setTelefone] = useState("");


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!nome) {
      toast.info("Nome é obrigatório");
      setIsLoading(false);
      return;
    }

    if (!cpfInput) {
      toast.info("CPF é obrigatório");
      setIsLoading(false);
      return;
    }

    const cpfCriptografado = await criptografarTexto(cpfInput);

    const cpfHash = await gerarCPFHash(cpfInput);

    const { error } = await supabase.from("responsaveis").insert({
      nome,
      cpf: cpfCriptografado,
      cpf_hash: cpfHash,
      telefone,
    });

    if (error) {
      toast.error("Erro ao salvar responsável", {
        description: error.message,
      });
      setIsLoading(false);
      return;
    }

    toast.success("Responsável cadastrado com sucesso!");
    setIsLoading(false);
    router.push("/cadastro");
  };

  return (
    <MainLayout>
      <div className="container min-w-4xl mx-auto py-6">
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
            <h1 className="text-2xl font-bold">Cadastrar Responsável</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Responsável</CardTitle>
            <CardDescription>
              Preencha os dados para cadastrar um novo responsável no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="nome" className="text-sm font-medium">
                    Nome Completo
                  </label>
                  <Input
                    id="nome"
                    value={nome}
                    placeholder="Nome do responsável"
                    disabled={isLoading}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="cpf" className="text-sm font-medium">
                    CPF
                  </label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={cpfInput}
                    onChange={(e) => setCpfInput(formatarCPF(e.target.value))}
                    maxLength={14}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="telefone" className="text-sm font-medium">
                    WhatsApp
                  </label>
                  <Input
                    id="telefone"
                    placeholder="(00) 00000-0000"
                    value={telefone}
                    onChange={(e) =>
                      setTelefone(formatarTelefone(e.target.value))
                    }
                    maxLength={15}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/")}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
