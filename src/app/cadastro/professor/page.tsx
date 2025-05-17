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
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatarTelefone } from "@/lib/utils";

export default function CadastroProfessorPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.from("professores").insert({
      nome,
      telefone,
    });

    setIsLoading(false);

    if (error) {
      toast.error("Erro ao salvar turma", {
        description: error.message,
      });
      return;
    }

    toast.success("Professor cadastrado com sucesso!");
    router.push("/");
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
            <h1 className="text-2xl font-bold">Cadastrar Professor</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Professor</CardTitle>
            <CardDescription>
              Preencha os dados para cadastrar um novo professor no sistema.
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
                    placeholder="Nome do professor"
                    disabled={isLoading}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="telefone" className="text-sm font-medium">
                    Telefone
                  </label>
                  <Input
                    id="telefone"
                    value={telefone}
                    placeholder="(00) 00000-0000"
                    onChange={(e) =>
                      setTelefone(formatarTelefone(e.target.value))
                    }
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
