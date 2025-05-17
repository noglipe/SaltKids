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
import { ArrowLeft } from "lucide-react";
import MainLayout from "@/components/main-layout";

import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

export default function CadastroTurmaPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [faixaEtaria, setFaixaEtaria] = useState("");
  const [capacidade, setCapacidade] = useState("");
  const [sala, setSala] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.from("turmas").insert({
      nome,
      faixa_etaria: faixaEtaria,
      capacidade,
      sala,
    });

    setIsLoading(false);

    if (error) {
      toast.error("Erro ao salvar turma", {
        description: error.message,
      });
      return;
    }

    toast.success("Turma cadastrada com sucesso!");
    router.push("/");
  };

  return (
    <MainLayout>
      <div className="min-w-4xl mx-auto py-8 px-4 dark">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            size="icon"
            className="mr-3"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Cadastrar Turma</h1>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Informações da Turma</CardTitle>
            <CardDescription>
              Preencha os dados abaixo para cadastrar uma nova turma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
                <div className="space-y-2">
                  <label htmlFor="nome" className="block text-sm font-medium">
                    Nome da Turma
                  </label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Berçário, Maternal"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="faixaEtaria"
                    className="block text-sm font-medium"
                  >
                    Faixa Etária
                  </label>
                  <Input
                    id="faixaEtaria"
                    value={faixaEtaria}
                    onChange={(e) => setFaixaEtaria(e.target.value)}
                    placeholder="Ex: 0-1 ano, 2-3 anos"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="capacidade"
                    className="block text-sm font-medium"
                  >
                    Capacidade
                  </label>
                  <Input
                    id="capacidade"
                    value={capacidade}
                    type="number"
                    onChange={(e) => setCapacidade(e.target.value)}
                    placeholder="Ex: 20"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="sala" className="block text-sm font-medium">
                    Sala
                  </label>
                  <Input
                    id="sala"
                    value={sala}
                    onChange={(e) => setSala(e.target.value)}
                    placeholder="Ex: Sala 1"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6">
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
