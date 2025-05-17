"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Search,
  Plus,
  Edit,
  User,
  Users,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import MainLayout from "@/components/main-layout";
import { supabase } from "@/lib/supabase/client";
import { mascararCPF } from "@/lib/utils";

export default function GerenciarPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("criancas");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [criancas, setCriancas] = useState<any[]>([]);
  const [responsaveis, setResponsaveis] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        switch (activeTab) {
          case "criancas":
            await carregarCriancas();
            break;
          case "responsavel":
            await carregarResponsaveis();
            break;
          case "turma":
            await carregarTurmas();
            break;
          case "professor":
            await carregarProfessores();
            break;
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [activeTab, supabase]);

  const carregarCriancas = async () => {
    const { data, error } = await supabase
      .from("criancas")
      .select(
        `
        *,
        crianca_responsavel:crianca_responsavel(*)
      `
      )
      .order("nome");

    if (error) throw error;

    // Processar os dados para incluir a contagem de responsáveis
    const criancasProcessadas = data.map((crianca) => {
      const responsaveisCount = crianca.crianca_responsavel
        ? crianca.crianca_responsavel.length
        : 0;

      // Calcular idade
      const dataNascimento = new Date(crianca.data_nascimento);
      const hoje = new Date();
      let idade = hoje.getFullYear() - dataNascimento.getFullYear();
      const m = hoje.getMonth() - dataNascimento.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < dataNascimento.getDate())) {
        idade--;
      }

      return {
        ...crianca,
        idade,
        responsaveisCount,
      };
    });

    setCriancas(criancasProcessadas);
  };

  const carregarResponsaveis = async () => {
    const { data, error } = await supabase
      .from("responsaveis")
      .select(
        `
        *,
        crianca_responsavel:crianca_responsavel(*)
      `
      )
      .order("nome");

    if (error) throw error;

    // Processar os dados para incluir a contagem de crianças
    const responsaveisProcessados = data.map((responsavel) => {
      const criancasCount = responsavel.crianca_responsavel
        ? responsavel.crianca_responsavel.length
        : 0;

      return {
        ...responsavel,
        criancasCount,
      };
    });

    setResponsaveis(responsaveisProcessados);
  };

  const carregarTurmas = async () => {
    const { data, error } = await supabase
      .from("turmas")
      .select(
        `
        *,
        criancas:criancas(id),
        professor_turma:professor_turma(*)
      `
      )
      .order("nome");

    if (error) throw error;

    // Processar os dados para incluir contagens
    const turmasProcessadas = data.map((turma) => {
      const criancasCount = turma.criancas ? turma.criancas.length : 0;
      const professoresCount = turma.professor_turma
        ? turma.professor_turma.length
        : 0;

      return {
        ...turma,
        criancasCount,
        professoresCount,
      };
    });

    setTurmas(turmasProcessadas);
  };

  const carregarProfessores = async () => {
    const { data, error } = await supabase
      .from("professores")
      .select(
        `
        *,
        professor_turma:professor_turma(*)
      `
      )
      .order("nome");

    if (error) throw error;

    // Processar os dados para incluir a contagem de turmas
    const professoresProcessados = data.map((professor) => {
      const turmasCount = professor.professor_turma
        ? professor.professor_turma.length
        : 0;

      return {
        ...professor,
        turmasCount,
      };
    });

    setProfessores(professoresProcessados);
  };

  const filtrarDados = (dados: any[]) => {
    if (!searchTerm) return dados;

    const termLower = searchTerm.toLowerCase();

    return dados.filter((item) => {
      return item.nome.toLowerCase().includes(termLower);
    });
  };

  const renderCriancas = () => {
    const criancasFiltradas = filtrarDados(criancas);

    if (loading) {
      return (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando crianças...</span>
        </div>
      );
    }

    if (criancasFiltradas.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhuma criança encontrada.</p>
          <Button
            className="mt-4"
            onClick={() => router.push("/cadastro/crianca")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar Criança
          </Button>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 ">
        {criancasFiltradas.map((crianca) => (
          <Card
            key={crianca.id}
            className="overflow-hidden hover:transition-opacity hover:opacity-70"
          >
            <CardHeader className="">
              <CardTitle>{crianca.nome}</CardTitle>
              <CardDescription>{crianca.idade} anos</CardDescription>
            </CardHeader>
            <CardContent className="">
              <div className="text-sm">
                <p>
                  <span className="font-medium">Responsáveis:</span>{" "}
                  {crianca.responsaveisCount}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Obs:</span>{" "}
                  {crianca.observacoes
                    ? crianca.observacoes
                    : "Sem Observações Registrada"}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/editar/crianca/${crianca.id}`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  const renderResponsaveis = () => {
    const responsaveisFiltrados = filtrarDados(responsaveis);

    if (loading) {
      return (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando responsáveis...</span>
        </div>
      );
    }

    if (responsaveisFiltrados.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Nenhum responsável encontrado.
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push("/cadastro/responsavel")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar Responsável
          </Button>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {responsaveisFiltrados.map((responsavel) => (
          <Card key={responsavel.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle>{responsavel.nome}</CardTitle>
              <CardDescription>
                CPF: {mascararCPF(responsavel.cpf)}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-sm">
                <p>
                  <span className="font-medium">Telefone:</span>{" "}
                  {responsavel.telefone}
                </p>
                <p>
                  <span className="font-medium">Crianças:</span>{" "}
                  {responsavel.criancasCount}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  router.push(`/editar/responsavel/${responsavel.id}`)
                }
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  const renderTurmas = () => {
    const turmasFiltradas = filtrarDados(turmas);

    if (loading) {
      return (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando turmas...</span>
        </div>
      );
    }

    if (turmasFiltradas.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhuma turma encontrada.</p>
          <Button
            className="mt-4"
            onClick={() => router.push("/cadastro/turma")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar Turma
          </Button>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {turmasFiltradas.map((turma) => (
          <Card key={turma.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle>{turma.nome}</CardTitle>
              <CardDescription>{turma.faixa_etaria}</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-sm">
                <p>
                  <span className="font-medium">Sala:</span> {turma.sala}
                </p>
                <p>
                  <span className="font-medium">Capacidade:</span>{" "}
                  {turma.capacidade}
                </p>
                <p>
                  <span className="font-medium">Crianças:</span>{" "}
                  {turma.criancasCount}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/editar/turma/${turma.id}`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  const renderProfessores = () => {
    const professoresFiltrados = filtrarDados(professores);

    if (loading) {
      return (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando professores...</span>
        </div>
      );
    }

    if (professoresFiltrados.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum professor encontrado.</p>
          <Button
            className="mt-4"
            onClick={() => router.push("/cadastro/professor")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar Professor
          </Button>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {professoresFiltrados.map((professor) => (
          <Card key={professor.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle>{professor.nome}</CardTitle>
              <CardDescription>Telefone: {professor.telefone}</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-sm">
                <p>
                  <span className="font-medium">Turmas:</span>{" "}
                  {professor.turmasCount}
                </p>
                {professor.data_nascimento && (
                  <p>
                    <span className="font-medium">Data de Nascimento:</span>{" "}
                    {new Date(professor.data_nascimento).toLocaleDateString()}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/editar/professor/${professor.id}`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gerenciar Cadastros
          </h1>
          <p className="text-muted-foreground">
            Visualize, edite e gerencie todos os cadastros do sistema
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="criancas" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Crianças
              </TabsTrigger>
              <TabsTrigger value="responsavel" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Responsáveis
              </TabsTrigger>
              <TabsTrigger value="turma" className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                Turmas
              </TabsTrigger>
              <TabsTrigger value="professor" className="flex items-center">
                <GraduationCap className="mr-2 h-4 w-4" />
                Professores
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={() => router.push(`/cadastro/${activeTab}`)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <TabsContent value="criancas">{renderCriancas()}</TabsContent>
            <TabsContent value="responsavel">
              {renderResponsaveis()}
            </TabsContent>
            <TabsContent value="turma">{renderTurmas()}</TabsContent>
            <TabsContent value="professor">{renderProfessores()}</TabsContent>
          </div>
        </Tabs>
      </div>
    </MainLayout>
  );
}
